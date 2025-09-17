import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { ConversationDraftRepository } from '@/infrastructure/repositories/ConversationDraftRepository'
import { ExtractorConfigRepository } from '@/infrastructure/repositories/ExtractorConfigRepository'
import { ExtractorService } from '@/domain/services/ExtractorService'
import type { ExtractorPatch, FormType } from '@/domain/entities'

const conversationDraftRepository = new ConversationDraftRepository(prisma)
const extractorConfigRepository = new ExtractorConfigRepository(prisma)
const extractorService = new ExtractorService(conversationDraftRepository, extractorConfigRepository)

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const conversationId = searchParams.get('conversationId')
  const includeLogs = searchParams.get('includeLogs') === '1'

  if (!conversationId) {
    return NextResponse.json(
      { error: 'conversationId query parameter is required' },
      { status: 400 },
    )
  }

  try {
    const context = await extractorService.getDraftByConversation(conversationId)

    if (!context) {
      return NextResponse.json(
        { error: 'Draft not found for conversation' },
        { status: 404 },
      )
    }

    const { draft, versions, submissions, messages, logs } = context

    return NextResponse.json({
      draft,
      versions,
      submissions,
      messages,
      ...(includeLogs ? { logs: logs ?? [] } : {}),
    })
  } catch (error) {
    console.error('Extractor GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch draft' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const payload = (await request.json()) as Record<string, unknown>

  const conversationId = payload.conversationId
  const formType = payload.formType
  const messageId = payload.messageId
  const content = payload.content
  const senderType = payload.senderType
  const rawPatch = payload.patch
  const autoCommit = payload.autoCommit
  const metadata = payload.metadata as Record<string, unknown> | undefined

  if (typeof conversationId !== 'string' || conversationId.length === 0) {
    return NextResponse.json({ error: 'conversationId is required' }, { status: 400 })
  }

  if (!isFormType(formType)) {
    return NextResponse.json({ error: 'Invalid formType value' }, { status: 400 })
  }

  if (typeof messageId !== 'string' || messageId.length === 0) {
    return NextResponse.json({ error: 'messageId is required' }, { status: 400 })
  }

  if (typeof content !== 'string' || content.length === 0) {
    return NextResponse.json({ error: 'content is required' }, { status: 400 })
  }

  if (!isSenderType(senderType)) {
    return NextResponse.json({ error: 'Invalid senderType value' }, { status: 400 })
  }

  let patch: ExtractorPatch | null | undefined
  if (rawPatch !== undefined) {
    if (!isExtractorPatch(rawPatch)) {
      return NextResponse.json({ error: 'Invalid patch payload' }, { status: 400 })
    }
    patch = rawPatch
  }

  try {
    const result = await extractorService.processMessage({
      conversationId,
      formType,
      messageId,
      content,
      senderType,
      patch: patch ?? null,
      autoCommit: typeof autoCommit === 'boolean' ? autoCommit : undefined,
      metadata,
    })

    return NextResponse.json({
      draft: result.draft,
      version: result.version,
      changedFields: result.changedFields,
      missingFields: result.missingFields,
      reasons: result.reasons,
      isComplete: result.isComplete,
      overallConfidence: result.overallConfidence,
      fieldConfidences: result.fieldConfidences,
      violations: result.violations,
    })
  } catch (error) {
    if (error instanceof Error && error.message.includes('Failed to generate patch via LLM')) {
      return NextResponse.json(
        {
          error: error.message,
          code: 'PATCH_GENERATION_FAILED',
        },
        { status: 502 },
      )
    }

    console.error('Extractor POST error:', error)
    return NextResponse.json({ error: 'Failed to process extractor message' }, { status: 500 })
  }
}

function isFormType(value: unknown): value is FormType {
  return value === 'lesson_booking' || value === 'student_registration' || value === 'consultation'
}

function isSenderType(value: unknown): value is 'user' | 'bot' {
  return value === 'user' || value === 'bot'
}

function isExtractorPatch(value: unknown): value is ExtractorPatch {
  if (!value || typeof value !== 'object') {
    return false
  }

  const patchCandidate = value as Record<string, unknown>
  if (!Array.isArray(patchCandidate.operations) || !Array.isArray(patchCandidate.missingFields)) {
    return false
  }

  const operationsValid = patchCandidate.operations.every((op) => {
    if (!op || typeof op !== 'object') {
      return false
    }
    const operation = op as Record<string, unknown>
    const opType = operation.op
    return (
      (opType === 'set' || opType === 'unset') &&
      typeof operation.path === 'string' &&
      typeof operation.confidence === 'number'
    )
  })

  if (!operationsValid) {
    return false
  }

  const missingFieldsValid = patchCandidate.missingFields.every((field) => typeof field === 'string')

  if (!missingFieldsValid) {
    return false
  }

  if (
    patchCandidate.reasons !== undefined &&
    (!Array.isArray(patchCandidate.reasons) ||
      !patchCandidate.reasons.every((reason) => typeof reason === 'string'))
  ) {
    return false
  }

  if (
    patchCandidate.fieldConfidences !== undefined &&
    (typeof patchCandidate.fieldConfidences !== 'object' || patchCandidate.fieldConfidences === null)
  ) {
    return false
  }

  if (
    patchCandidate.overallConfidence !== undefined &&
    typeof patchCandidate.overallConfidence !== 'number'
  ) {
    return false
  }

  return true
}
