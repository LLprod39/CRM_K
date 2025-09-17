import type {
  ConversationDraft,
  ConversationMessage,
  DraftSubmission,
  DraftVersion,
  ExtractorLog,
} from '@prisma/client'
import type { DraftContext, ExtractorPatch, FormType } from '../entities'

export interface ConversationDraftWithRelations extends ConversationDraft {
  versions: DraftVersion[]
  submissions: DraftSubmission[]
  messages: ConversationMessage[]
  extractorLogs?: ExtractorLog[]
}

export interface DraftUpsertParams {
  conversationId: string
  formType: FormType
  autoCommit?: boolean
  initialDraftData?: Record<string, unknown>
}

export interface RecordMessageParams {
  draftId: string
  messageId: string
  content: string
  senderType: 'user' | 'bot'
}

export interface CreateVersionParams {
  draftId: string
  patchData: ExtractorPatch
  confidence: number
  messageId?: string | null
}

export interface UpdateDraftParams {
  draftId: string
  draftData?: Record<string, unknown>
  isComplete?: boolean
  autoCommit?: boolean
  isCommitted?: boolean
  committedAt?: Date
  committedBy?: string
}

export interface CreateSubmissionParams {
  draftId: string
  submissionData: Record<string, unknown>
  status?: 'pending' | 'committed' | 'failed'
  errorMessage?: string
}

export interface CreateLogParams {
  draftId?: string
  messageId?: string
  operation: 'receive' | 'extract' | 'extract_generate' | 'validate' | 'commit'
  inputData?: unknown
  outputData?: unknown
  confidence?: number
  errorMessage?: string
  processingTime?: number
}

export interface IConversationDraftRepository {
  getOrCreateDraft(params: DraftUpsertParams): Promise<ConversationDraftWithRelations>
  getDraftByConversation(conversationId: string): Promise<ConversationDraftWithRelations | null>
  getDraftById(draftId: string): Promise<ConversationDraftWithRelations | null>
  getDraftContext(draftId: string): Promise<DraftContext | null>
  recordMessage(params: RecordMessageParams): Promise<ConversationMessage>
  createVersion(params: CreateVersionParams): Promise<DraftVersion>
  updateDraft(params: UpdateDraftParams): Promise<ConversationDraft>
  createSubmission(params: CreateSubmissionParams): Promise<DraftSubmission>
  createLog(params: CreateLogParams): Promise<ExtractorLog>
}
