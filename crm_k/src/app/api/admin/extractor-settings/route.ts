import { NextRequest, NextResponse } from "next/server"
import { getAuthUser } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { ExtractorConfigRepository } from '@/infrastructure/repositories'
import type { UpsertExtractorConfigInput } from '@/domain/entities'

const repository = new ExtractorConfigRepository(prisma)

export async function GET(request: NextRequest) {
  const user = getAuthUser(request)

  if (!user || user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 })
  }

  const config = await repository.getConfig()

  return NextResponse.json({
    extractorModel: config.extractorModel,
    autoCommit: config.autoCommit,
    autoCommitMinConf: config.autoCommitMinConf,
    fieldMinConf: config.fieldMinConf,
    patchMaxAgeSec: config.patchMaxAgeSec,
    schemaVersion: config.schemaVersion,
    upsertDedupeWindowSec: config.upsertDedupeWindowSec,
    auditLogLevel: config.auditLogLevel,
    lessonBookingMinConf: config.lessonBookingMinConf,
    studentRegistrationMinConf: config.studentRegistrationMinConf,
    consultationMinConf: config.consultationMinConf,
    systemPrompt: config.systemPrompt,
    userPrompt: config.userPrompt,
    generationTemperature: config.generationTemperature,
    maxOutputTokens: config.maxOutputTokens,
    googleGenaiApiKey: config.googleGenaiApiKey,
    updatedAt: config.updatedAt,
  })
}

export async function POST(request: NextRequest) {
  const user = getAuthUser(request)

  if (!user || user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 })
  }

  const payload = (await request.json()) as Record<string, unknown>
  const validationError = validatePayload(payload)

  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 })
  }

  const updateInput: UpsertExtractorConfigInput = {
    extractorModel: getString(payload.extractorModel),
    autoCommit: typeof payload.autoCommit === 'boolean' ? payload.autoCommit : undefined,
    autoCommitMinConf: getNumber(payload.autoCommitMinConf),
    fieldMinConf: getNumber(payload.fieldMinConf),
    patchMaxAgeSec: getInteger(payload.patchMaxAgeSec),
    schemaVersion: getString(payload.schemaVersion),
    upsertDedupeWindowSec: getInteger(payload.upsertDedupeWindowSec),
    auditLogLevel: getString(payload.auditLogLevel),
    lessonBookingMinConf: getNumber(payload.lessonBookingMinConf),
    studentRegistrationMinConf: getNumber(payload.studentRegistrationMinConf),
    consultationMinConf: getNumber(payload.consultationMinConf),
    systemPrompt: getString(payload.systemPrompt),
    userPrompt: getString(payload.userPrompt),
    generationTemperature: getNumber(payload.generationTemperature),
    maxOutputTokens: getInteger(payload.maxOutputTokens),
    googleGenaiApiKey:
      payload.googleGenaiApiKey === null
        ? null
        : getString(payload.googleGenaiApiKey) ?? undefined,
  }

  const updated = await repository.updateConfig(updateInput)

  return NextResponse.json({
    extractorModel: updated.extractorModel,
    autoCommit: updated.autoCommit,
    autoCommitMinConf: updated.autoCommitMinConf,
    fieldMinConf: updated.fieldMinConf,
    patchMaxAgeSec: updated.patchMaxAgeSec,
    schemaVersion: updated.schemaVersion,
    upsertDedupeWindowSec: updated.upsertDedupeWindowSec,
    auditLogLevel: updated.auditLogLevel,
    lessonBookingMinConf: updated.lessonBookingMinConf,
    studentRegistrationMinConf: updated.studentRegistrationMinConf,
    consultationMinConf: updated.consultationMinConf,
    systemPrompt: updated.systemPrompt,
    userPrompt: updated.userPrompt,
    generationTemperature: updated.generationTemperature,
    maxOutputTokens: updated.maxOutputTokens,
    googleGenaiApiKey: updated.googleGenaiApiKey,
    updatedAt: updated.updatedAt,
  })
}

type NumericFieldKey =
  | 'autoCommitMinConf'
  | 'fieldMinConf'
  | 'lessonBookingMinConf'
  | 'studentRegistrationMinConf'
  | 'consultationMinConf'
  | 'generationTemperature'
  | 'maxOutputTokens'
  | 'patchMaxAgeSec'
  | 'upsertDedupeWindowSec'

function validatePayload(payload: Record<string, unknown>): string | null {
  const numericFields: Array<{ key: NumericFieldKey; min?: number; max?: number }> = [
    { key: 'autoCommitMinConf', min: 0, max: 1 },
    { key: 'fieldMinConf', min: 0, max: 1 },
    { key: 'lessonBookingMinConf', min: 0, max: 1 },
    { key: 'studentRegistrationMinConf', min: 0, max: 1 },
    { key: 'consultationMinConf', min: 0, max: 1 },
    { key: 'generationTemperature', min: 0, max: 2 },
    { key: 'maxOutputTokens', min: 1 },
    { key: 'patchMaxAgeSec', min: 0 },
    { key: 'upsertDedupeWindowSec', min: 0 },
  ]

  for (const field of numericFields) {
    const rawValue = payload[field.key]
    if (rawValue === undefined || rawValue === null) {
      continue
    }

    const numeric = Number(rawValue)
    if (!Number.isFinite(numeric)) {
      return `Field ${field.key} must be a number`
    }

    if (field.min !== undefined && numeric < field.min) {
      return `Field ${field.key} must be >= ${field.min}`
    }

    if (field.max !== undefined && numeric > field.max) {
      return `Field ${field.key} must be <= ${field.max}`
    }
  }

  if (payload.autoCommit !== undefined && typeof payload.autoCommit !== 'boolean') {
    return 'Field autoCommit must be boolean'
  }

  return null
}

function getString(value: unknown): string | undefined {
  if (typeof value === 'string' && value.trim().length > 0) {
    return value.trim()
  }
  return undefined
}

function getNumber(value: unknown): number | undefined {
  if (value === undefined || value === null) {
    return undefined
  }

  const numeric = Number(value)
  return Number.isFinite(numeric) ? numeric : undefined
}

function getInteger(value: unknown): number | undefined {
  const numeric = getNumber(value)
  if (numeric === undefined) {
    return undefined
  }

  return Math.round(numeric)
}
