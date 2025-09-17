import type { ConversationDraft } from '@prisma/client'
import { normalizeDraftData } from '@/lib/extractor/normalization'
import { validateDraft } from '@/lib/extractor/validation'
import { getSchemaForForm } from '@/lib/schemas'
import { generatePatchWithLLM } from '@/lib/extractor/patchGenerator'
import type { DraftContext, ExtractorPatch, FormType } from '../entities'
import type { IConversationDraftRepository, IExtractorConfigRepository } from '../repositories'

export interface ProcessMessageParams {
  conversationId: string
  formType: FormType
  messageId: string
  content: string
  senderType: 'user' | 'bot'
  patch?: ExtractorPatch | null
  autoCommit?: boolean
  metadata?: Record<string, unknown>
}

export interface ProcessMessageResult {
  draft: ConversationDraft
  version?: number
  changedFields: string[]
  missingFields: string[]
  reasons: string[]
  violations: string[]
  isComplete: boolean
  overallConfidence?: number
  fieldConfidences?: Record<string, number>
}

export interface IExtractorService {
  processMessage(params: ProcessMessageParams): Promise<ProcessMessageResult>
  getDraftByConversation(conversationId: string): Promise<DraftContext | null>
}

export class ExtractorService implements IExtractorService {
  constructor(
    private readonly draftRepository: IConversationDraftRepository,
    private readonly configRepository?: IExtractorConfigRepository,
  ) {}

  async processMessage(params: ProcessMessageParams): Promise<ProcessMessageResult> {
    const startedAt = Date.now()

    const draft = await this.draftRepository.getOrCreateDraft({
      conversationId: params.conversationId,
      formType: params.formType,
      autoCommit: params.autoCommit,
    })

    await this.draftRepository.recordMessage({
      draftId: draft.id,
      messageId: params.messageId,
      content: params.content,
      senderType: params.senderType,
    })

    await this.draftRepository.createLog({
      draftId: draft.id,
      messageId: params.messageId,
      operation: 'receive',
      inputData: {
        senderType: params.senderType,
        content: params.content,
        metadata: params.metadata,
      },
    })

    const schema = getSchemaForForm(params.formType)
    const currentDraft = (draft.draftData as Record<string, unknown> | null) ?? {}
    const normalizedBefore = normalizeDraftData(schema, currentDraft)
    const validationBefore = validateDraft(schema, normalizedBefore)
    const missingBefore = validationBefore.missingFields

    let patch = params.patch ?? null

    if (!patch) {
      const historyContext = await this.draftRepository.getDraftContext(draft.id)
      const sortedMessages = historyContext?.messages
        ?.slice()
        .sort((a, b) => new Date(a.processedAt).getTime() - new Date(b.processedAt).getTime()) ?? []
      const trimmedHistory = sortedMessages.slice(-12).map((message) => ({
        sender: message.senderType === 'bot' ? 'bot' : 'user',
        content: message.content,
        timestamp: message.processedAt.toISOString(),
      }))

      const config = await this.configRepository?.getConfig().catch(() => undefined)
      patch = await generatePatchWithLLM({
        schema,
        formType: params.formType,
        draftData: currentDraft,
        history: trimmedHistory,
        missingFields: missingBefore,
        model: config?.extractorModel,
        fieldMinConf: config?.fieldMinConf,
        overallMinConf: config?.autoCommitMinConf,
      })

      if (!patch) {
        const elapsed = Date.now() - startedAt
        await this.draftRepository.createLog({
          draftId: draft.id,
          messageId: params.messageId,
          operation: 'extract_generate',
          errorMessage: 'LLM patch generation failed',
          processingTime: elapsed,
        })
        throw new Error('Failed to generate patch via LLM')
      }

      await this.draftRepository.createLog({
        draftId: draft.id,
        messageId: params.messageId,
        operation: 'extract_generate',
        inputData: {
          missingFields: missingBefore,
          messages: trimmedHistory,
        },
        outputData: patch,
      })
    }

    const { updatedDraft, changedFields } = this.applyPatch(currentDraft, patch)

    const normalizedDraft = normalizeDraftData(schema, updatedDraft)
    const validation = validateDraft(schema, normalizedDraft)

    const missingFields = Array.from(
      new Set([...(patch.missingFields ?? []), ...validation.missingFields]),
    )
    const violations = validation.violations

    const overallConfidence =
      patch.overallConfidence ?? this.calculateOverallConfidence(patch)

    const updated = await this.draftRepository.updateDraft({
      draftId: draft.id,
      draftData: normalizedDraft,
      isComplete: missingFields.length === 0,
    })

    const version = await this.draftRepository.createVersion({
      draftId: draft.id,
      patchData: patch,
      confidence: overallConfidence ?? 0,
      messageId: params.messageId,
    })

    const elapsed = Date.now() - startedAt

    await this.draftRepository.createLog({
      draftId: draft.id,
      messageId: params.messageId,
      operation: 'extract',
      inputData: {
        senderType: params.senderType,
        content: params.content,
      },
      outputData: {
        changedFields,
        missingFields,
        violations,
        reasons: patch.reasons,
        overallConfidence,
      },
      confidence: overallConfidence,
      processingTime: elapsed,
    })

    return {
      draft: updated,
      version: version.version,
      changedFields,
      missingFields,
      reasons: patch.reasons ?? [],
      violations,
      isComplete: updated.isComplete,
      overallConfidence,
      fieldConfidences: patch.fieldConfidences,
    }
  }

  async getDraftByConversation(conversationId: string): Promise<DraftContext | null> {
    const draft = await this.draftRepository.getDraftByConversation(conversationId)

    if (!draft) {
      return null
    }

    const { versions, submissions, messages, extractorLogs, ...draftBase } = draft

    return {
      draft: draftBase,
      versions,
      submissions,
      messages,
      logs: extractorLogs,
    }
  }
  private applyPatch(
    baseDraft: Record<string, unknown> | null,
    patch: ExtractorPatch,
  ) {
    const draftCopy = this.cloneDraft(baseDraft)
    const changedFields: string[] = []

    for (const operation of patch.operations) {
      if (!operation.path.startsWith('/')) {
        continue
      }

      const segments = this.parsePointer(operation.path)
      if (!segments.length) {
        continue
      }

      const fieldKey = segments.join('.')

      if (operation.op === 'set') {
        this.setValue(draftCopy, segments, operation.value)
        changedFields.push(fieldKey)
      } else if (operation.op === 'unset') {
        if (this.unsetValue(draftCopy, segments)) {
          changedFields.push(fieldKey)
        }
      }
    }

    return {
      updatedDraft: draftCopy,
      changedFields,
    }
  }

  private cloneDraft(baseDraft: Record<string, unknown> | null) {
    if (baseDraft == null) {
      return {}
    }

    if (typeof structuredClone === 'function') {
      return structuredClone(baseDraft)
    }

    return JSON.parse(JSON.stringify(baseDraft))
  }

  private parsePointer(path: string): string[] {
    return path
      .split('/')
      .slice(1)
      .map((segment) => segment.replace(/~1/g, '/').replace(/~0/g, '~'))
      .filter((segment) => segment.length > 0)
  }

  private setValue(target: Record<string, unknown>, path: string[], value: unknown) {
    let current: Record<string, unknown> = target

    for (let i = 0; i < path.length - 1; i += 1) {
      const key = path[i]
      const next = current[key]
      if (typeof next !== 'object' || next === null) {
        const nested: Record<string, unknown> = {}
        current[key] = nested
        current = nested
      } else {
        current = next as Record<string, unknown>
      }
    }

    current[path[path.length - 1]] = value as never
  }

  private unsetValue(target: Record<string, unknown>, path: string[]) {
    let current: Record<string, unknown> | null = target

    for (let i = 0; i < path.length - 1; i += 1) {
      const key = path[i]
      const next = current?.[key]
      if (typeof next !== 'object' || next === null) {
        return false
      }
      current = next as Record<string, unknown>
    }

    if (!current) {
      return false
    }

    const finalKey = path[path.length - 1]
    if (Object.prototype.hasOwnProperty.call(current, finalKey)) {
      delete current[finalKey]
      return true
    }

    return false
  }

  private calculateOverallConfidence(patch: ExtractorPatch) {
    const confidences = patch.operations
      .map((operation) => operation.confidence)
      .filter((value): value is number => typeof value === 'number' && !Number.isNaN(value))

    if (!confidences.length) {
      return undefined
    }

    const total = confidences.reduce((sum, value) => sum + value, 0)
    return Number((total / confidences.length).toFixed(4))
  }
}



