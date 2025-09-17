import type { ExtractorConfig, UpsertExtractorConfigInput } from '../entities'

export interface IExtractorConfigRepository {
  getConfig(): Promise<ExtractorConfig>
  updateConfig(data: UpsertExtractorConfigInput): Promise<ExtractorConfig>
  setApiKey(apiKey: string | null): Promise<ExtractorConfig>
}
