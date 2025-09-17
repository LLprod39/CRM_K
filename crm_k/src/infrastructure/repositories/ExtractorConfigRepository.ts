import { PrismaClient } from '@prisma/client'
import type { ExtractorConfig, UpsertExtractorConfigInput } from '@/domain/entities'
import type { IExtractorConfigRepository } from '@/domain/repositories'

function resolveBoolean(value: string | undefined, fallback: boolean) {
  if (value === undefined) {
    return fallback
  }
  return value === '1' || value.toLowerCase() === 'true'
}

function resolveNumber(value: string | undefined, fallback: number) {
  if (value === undefined) {
    return fallback
  }

  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

const DEFAULTS = {
  extractorModel: process.env.EXTRACTOR_MODEL || 'gemini-1.5-pro',
  autoCommit: resolveBoolean(process.env.AUTO_COMMIT, false),
  autoCommitMinConf: resolveNumber(process.env.AUTO_COMMIT_MIN_CONF, 0.85),
  fieldMinConf: resolveNumber(process.env.FIELD_MIN_CONF, 0.75),
  patchMaxAgeSec: resolveNumber(process.env.PATCH_MAX_AGE_SEC, 3600),
  schemaVersion: process.env.SCHEMA_VERSION || '1.0',
  upsertDedupeWindowSec: resolveNumber(process.env.UPSERT_DEDUPE_WINDOW_SEC, 300),
  auditLogLevel: process.env.AUDIT_LOG_LEVEL || 'info',
  lessonBookingMinConf: resolveNumber(process.env.LESSON_BOOKING_MIN_CONF, 0.8),
  studentRegistrationMinConf: resolveNumber(process.env.STUDENT_REGISTRATION_MIN_CONF, 0.9),
  consultationMinConf: resolveNumber(process.env.CONSULTATION_MIN_CONF, 0.7),
  googleGenaiApiKey: process.env.GOOGLE_GENAI_API_KEY || null,
} as const

export class ExtractorConfigRepository implements IExtractorConfigRepository {
  constructor(private readonly prisma: PrismaClient) {}

  private async ensureConfig(): Promise<ExtractorConfig> {
    const existing = await this.prisma.extractorConfig.findFirst()

    if (existing) {
      return existing
    }

    const created = await this.prisma.extractorConfig.create({
      data: {
        extractorModel: DEFAULTS.extractorModel,
        autoCommit: DEFAULTS.autoCommit,
        autoCommitMinConf: DEFAULTS.autoCommitMinConf,
        fieldMinConf: DEFAULTS.fieldMinConf,
        patchMaxAgeSec: DEFAULTS.patchMaxAgeSec,
        schemaVersion: DEFAULTS.schemaVersion,
        upsertDedupeWindowSec: DEFAULTS.upsertDedupeWindowSec,
        auditLogLevel: DEFAULTS.auditLogLevel,
        lessonBookingMinConf: DEFAULTS.lessonBookingMinConf,
        studentRegistrationMinConf: DEFAULTS.studentRegistrationMinConf,
        consultationMinConf: DEFAULTS.consultationMinConf,
        googleGenaiApiKey: DEFAULTS.googleGenaiApiKey,
      },
    })

    return created
  }

  async getConfig(): Promise<ExtractorConfig> {
    return this.ensureConfig()
  }

  async updateConfig(data: UpsertExtractorConfigInput): Promise<ExtractorConfig> {
    const config = await this.ensureConfig()

    return this.prisma.extractorConfig.update({
      where: { id: config.id },
      data: {
        extractorModel: data.extractorModel ?? config.extractorModel,
        autoCommit: data.autoCommit ?? config.autoCommit,
        autoCommitMinConf: data.autoCommitMinConf ?? config.autoCommitMinConf,
        fieldMinConf: data.fieldMinConf ?? config.fieldMinConf,
        patchMaxAgeSec: data.patchMaxAgeSec ?? config.patchMaxAgeSec,
        schemaVersion: data.schemaVersion ?? config.schemaVersion,
        upsertDedupeWindowSec: data.upsertDedupeWindowSec ?? config.upsertDedupeWindowSec,
        auditLogLevel: data.auditLogLevel ?? config.auditLogLevel,
        lessonBookingMinConf: data.lessonBookingMinConf ?? config.lessonBookingMinConf,
        studentRegistrationMinConf:
          data.studentRegistrationMinConf ?? config.studentRegistrationMinConf,
        consultationMinConf: data.consultationMinConf ?? config.consultationMinConf,
        googleGenaiApiKey:
          data.googleGenaiApiKey !== undefined
            ? data.googleGenaiApiKey
            : config.googleGenaiApiKey,
      },
    })
  }

  async setApiKey(apiKey: string | null): Promise<ExtractorConfig> {
    const config = await this.ensureConfig()

    return this.prisma.extractorConfig.update({
      where: { id: config.id },
      data: {
        googleGenaiApiKey: apiKey,
      },
    })
  }
}
