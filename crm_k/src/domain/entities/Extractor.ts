import type {
  ConversationDraft,
  ConversationMessage,
  DraftSubmission,
  DraftVersion,
  ExtractorLog,
} from '@prisma/client'

export type FormType = 'lesson_booking' | 'student_registration' | 'consultation'

export type PatchOperationType = 'set' | 'unset'

export interface PatchOperation {
  op: PatchOperationType
  path: string
  value?: unknown
  confidence: number
  evidence?: string
}

export interface ExtractorPatch {
  operations: PatchOperation[]
  missingFields: string[]
  reasons?: string[]
  overallConfidence?: number
  fieldConfidences?: Record<string, number>
}

export interface DraftContext {
  draft: ConversationDraft
  versions: DraftVersion[]
  submissions: DraftSubmission[]
  messages: ConversationMessage[]
  logs?: ExtractorLog[]
}

export interface ExtractorConfig {
  id: number
  extractorModel: string
  autoCommit: boolean
  autoCommitMinConf: number
  fieldMinConf: number
  patchMaxAgeSec: number
  schemaVersion: string
  upsertDedupeWindowSec: number
  auditLogLevel: string
  lessonBookingMinConf: number
  studentRegistrationMinConf: number
  consultationMinConf: number
  googleGenaiApiKey?: string | null
  createdAt: Date
  updatedAt: Date
}

export interface UpsertExtractorConfigInput {
  extractorModel?: string
  autoCommit?: boolean
  autoCommitMinConf?: number
  fieldMinConf?: number
  patchMaxAgeSec?: number
  schemaVersion?: string
  upsertDedupeWindowSec?: number
  auditLogLevel?: string
  lessonBookingMinConf?: number
  studentRegistrationMinConf?: number
  consultationMinConf?: number
  googleGenaiApiKey?: string | null
}
