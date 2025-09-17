import { Prisma, PrismaClient } from '@prisma/client'
import {
  ConversationDraftWithRelations,
  CreateLogParams,
  CreateSubmissionParams,
  CreateVersionParams,
  DraftUpsertParams,
  IConversationDraftRepository,
  RecordMessageParams,
  UpdateDraftParams,
} from '../../domain/repositories'
import type { DraftContext } from '../../domain/entities'

const draftInclude = {
  versions: {
    orderBy: { version: 'desc' as const },
  },
  submissions: {
    orderBy: { createdAt: 'desc' as const },
  },
  messages: {
    orderBy: { processedAt: 'desc' as const },
  },
  extractorLogs: {
    orderBy: { createdAt: 'desc' as const },
  },
} satisfies Prisma.ConversationDraftInclude

type DraftRecord = Prisma.ConversationDraftGetPayload<{ include: typeof draftInclude }>

export class ConversationDraftRepository implements IConversationDraftRepository {
  constructor(private readonly prisma: PrismaClient) {}

  private mapRecord(record: DraftRecord): ConversationDraftWithRelations {
    const { extractorLogs, ...rest } = record

    return {
      ...rest,
      extractorLogs,
    }
  }

  async getOrCreateDraft(params: DraftUpsertParams): Promise<ConversationDraftWithRelations> {
    const existing = await this.prisma.conversationDraft.findUnique({
      where: { conversationId: params.conversationId },
      include: draftInclude,
    })

    if (existing) {
      return this.mapRecord(existing)
    }

    const created = await this.prisma.conversationDraft.create({
      data: {
        conversationId: params.conversationId,
        formType: params.formType,
        draftData: (params.initialDraftData ?? {}) as Prisma.JsonObject,
        autoCommit: params.autoCommit ?? false,
      },
      include: draftInclude,
    })

    return this.mapRecord(created)
  }

  async getDraftByConversation(conversationId: string): Promise<ConversationDraftWithRelations | null> {
    const record = await this.prisma.conversationDraft.findUnique({
      where: { conversationId },
      include: draftInclude,
    })

    return record ? this.mapRecord(record) : null
  }

  async getDraftById(draftId: string): Promise<ConversationDraftWithRelations | null> {
    const record = await this.prisma.conversationDraft.findUnique({
      where: { id: draftId },
      include: draftInclude,
    })

    return record ? this.mapRecord(record) : null
  }

  async getDraftContext(draftId: string): Promise<DraftContext | null> {
    const record = await this.prisma.conversationDraft.findUnique({
      where: { id: draftId },
      include: draftInclude,
    })

    if (!record) {
      return null
    }

    const { extractorLogs, versions, submissions, messages, ...draft } = record

    return {
      draft,
      versions,
      submissions,
      messages,
      logs: extractorLogs,
    }
  }

  async recordMessage(params: RecordMessageParams) {
    const existing = await this.prisma.conversationMessage.findFirst({
      where: {
        draftId: params.draftId,
        messageId: params.messageId,
      },
    })

    if (existing) {
      return existing
    }

    return this.prisma.conversationMessage.create({
      data: {
        draftId: params.draftId,
        messageId: params.messageId,
        content: params.content,
        senderType: params.senderType,
      },
    })
  }

  async createVersion(params: CreateVersionParams) {
    const latestVersion = await this.prisma.draftVersion.findFirst({
      where: { draftId: params.draftId },
      orderBy: { version: 'desc' },
    })

    const nextVersion = (latestVersion?.version ?? 0) + 1

    return this.prisma.draftVersion.create({
      data: {
        draftId: params.draftId,
        version: nextVersion,
        patchData: params.patchData as unknown as Prisma.JsonObject,
        confidence: params.confidence,
        messageId: params.messageId ?? null,
      },
    })
  }

  async updateDraft(params: UpdateDraftParams) {
    return this.prisma.conversationDraft.update({
      where: { id: params.draftId },
      data: {
        ...(params.draftData !== undefined ? { draftData: params.draftData as unknown as Prisma.JsonObject } : {}),
        ...(params.isComplete !== undefined ? { isComplete: params.isComplete } : {}),
        ...(params.autoCommit !== undefined ? { autoCommit: params.autoCommit } : {}),
        ...(params.isCommitted !== undefined ? { isCommitted: params.isCommitted } : {}),
        ...(params.committedAt !== undefined ? { committedAt: params.committedAt } : {}),
        ...(params.committedBy !== undefined ? { committedBy: params.committedBy } : {}),
      },
    })
  }

  async createSubmission(params: CreateSubmissionParams) {
    return this.prisma.draftSubmission.create({
      data: {
        draftId: params.draftId,
        submissionData: params.submissionData as unknown as Prisma.JsonObject,
        status: params.status ?? 'pending',
        errorMessage: params.errorMessage ?? null,
      },
    })
  }

  async createLog(params: CreateLogParams) {
    return this.prisma.extractorLog.create({
      data: {
        draftId: params.draftId ?? null,
        messageId: params.messageId ?? null,
        operation: params.operation,
        inputData: params.inputData as unknown as Prisma.JsonValue,
        outputData: params.outputData as unknown as Prisma.JsonValue,
        confidence: params.confidence ?? null,
        errorMessage: params.errorMessage ?? null,
        processingTime: params.processingTime ?? null,
      },
    })
  }
}
