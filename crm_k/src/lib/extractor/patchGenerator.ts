import { GoogleGenAI } from '@google/genai'
import type { ExtractorPatch, FormType } from '@/domain/entities'
import type { JsonSchemaDefinition } from '@/lib/schemas'

interface ConversationTurn {
  sender: 'user' | 'bot'
  content: string
  timestamp?: string
}

interface PatchGeneratorParams {
  schema: JsonSchemaDefinition
  formType: FormType
  draftData: Record<string, unknown>
  history: ConversationTurn[]
  missingFields: string[]
  model?: string
  fieldMinConf?: number
  overallMinConf?: number
}

const OPERATIONS_KEY = 'operations'

export async function generatePatchWithLLM(params: PatchGeneratorParams): Promise<ExtractorPatch | null> {
  const apiKey = process.env.GOOGLE_GENAI_API_KEY
  if (!apiKey) {
    return null
  }

  const genAI = new GoogleGenAI({ apiKey })
  const model = params.model || process.env.EXTRACTOR_MODEL || 'gemini-1.5-pro'

  const prompt = buildPrompt(params)

  try {
    const result = await genAI.models.generateContent({
      model,
      contents: [{
        role: 'user',
        parts: [{ text: prompt }],
      }],
    })

    const rawText = (result.text || '').trim()
    if (!rawText) {
      return null
    }

    const jsonPayload = cleanseModelOutput(rawText)
    const parsed = JSON.parse(jsonPayload) as Record<string, unknown>

    return normalizePatch(parsed)
  } catch (error) {
    console.error('Extractor patch generation error:', error)
    return null
  }
}

function buildPrompt(params: PatchGeneratorParams): string {
  const { schema, draftData, history, missingFields, fieldMinConf, overallMinConf, formType } = params

  const schemaJson = JSON.stringify(schema, null, 2)
  const draftJson = JSON.stringify(draftData ?? {}, null, 2)
  const historyText = history
    .map((turn) => `${turn.sender === 'bot' ? 'assistant' : 'user'}: ${turn.content}`)
    .join('\n')

  const missingList = missingFields.length ? missingFields.join(', ') : 'нет'

  return `Ты — ассистент CRM. Задача: выделить структурированные данные из диалога WhatsApp для формы "${formType}".
Ты получаешь:
1. JSON Schema целевого объекта (строго следуй типам/форматам).
2. Текущий черновик данных в JSON.
3. Историю диалога (user / assistant).
4. Список недостающих (required) полей на данный момент.

Нужно вернуть JSON следующего вида (только JSON, без пояснений):
{
  "operations": [
    {
      "op": "set" | "unset",
      "path": "/fieldName",
      "value": <значение, если op = set>,
      "confidence": <число 0..1>,
      "evidence": "фраза из диалога"
    }
  ],
  "missing_fields": ["field1", "field2"],
  "reasons": ["почему какие поля не заполнены"],
  "field_confidences": { "fieldName": 0.9 },
  "overall_confidence": 0.85
}

Правила:
- Используй JSON Pointer в поле path (пример: "/parentPhone").
- Если данных нет — не придумывай. Возвращай поле в missing_fields и не добавляй операции.
- Нормализуй телефон в формате +7XXXXXXXXXX, даты — ISO 8601 (UTC).
- confidence должен быть числом 0..1. overall_confidence — среднее по полям.
- field_confidences содержит только изменённые поля.
- Не меняй поля, если данные противоречивы или с низкой уверенностью.
- Опираться можно только на текст диалога и имеющийся черновик.
${fieldMinConf ? `- Минимальная уверенность для поля: ${fieldMinConf}.` : ''}
${overallMinConf ? `- Минимальная уверенность для авто-коммита: ${overallMinConf}.` : ''}

JSON Schema:
${schemaJson}

Текущий черновик:
${draftJson}

Недостающие поля: ${missingList}

История диалога:
${historyText}

Верни строго валидный JSON без пояснений.`
}

function cleanseModelOutput(output: string): string {
  return output
    .replace(/```json/g, '')
    .replace(/```/g, '')
    .trim()
}

function normalizePatch(raw: Record<string, unknown>): ExtractorPatch {
  const operationsData = Array.isArray(raw[OPERATIONS_KEY]) ? raw[OPERATIONS_KEY] : []

  const normalizedOperations: ExtractorPatch['operations'] = operationsData
    .filter((item): item is Record<string, unknown> => typeof item === 'object' && item !== null)
    .map((item) => {
      const rawOp = item['op'] ?? item['action']
      const op: 'set' | 'unset' = typeof rawOp === 'string' && rawOp.toLowerCase() === 'unset' ? 'unset' : 'set'
      const rawPathValue = item['path']
      const rawPath = typeof rawPathValue === 'string' ? rawPathValue.trim() : ''
      const path = rawPath.startsWith('/') ? rawPath : rawPath ? `/${rawPath}` : '/'
      const rawConfidence = item['confidence'] ?? item['confidence_score']
      const confidence = normalizeNumber(rawConfidence) ?? 0
      const evidenceValue = item['evidence']
      const evidence = typeof evidenceValue === 'string' ? evidenceValue : undefined
      const valueSource = op === 'set' ? item['value'] ?? item['newValue'] : undefined
      const value = op === 'set' ? (valueSource !== undefined ? valueSource : null) : undefined

      return {
        op,
        path,
        value,
        confidence,
        evidence,
      }
    })

  const missingFields: string[] = []
  const missingSource = raw.missing_fields ?? raw.missingFields
  if (Array.isArray(missingSource)) {
    for (const field of missingSource) {
      if (typeof field === 'string') {
        const trimmed = field.trim()
        if (trimmed.length > 0) {
          missingFields.push(trimmed)
        }
      }
    }
  }

  const reasons: string[] = []
  const reasonsSource = raw.reasons ?? raw.errors
  if (Array.isArray(reasonsSource)) {
    for (const reason of reasonsSource) {
      if (typeof reason === 'string') {
        const trimmed = reason.trim()
        if (trimmed.length > 0) {
          reasons.push(trimmed)
        }
      }
    }
  }

  const fieldConfidences: Record<string, number> = {}
  const fieldConfidencesSource = raw.field_confidences ?? raw.fieldConfidences
  if (typeof fieldConfidencesSource === 'object' && fieldConfidencesSource !== null) {
    for (const [key, value] of Object.entries(fieldConfidencesSource)) {
      const numeric = normalizeNumber(value)
      if (numeric !== undefined) {
        fieldConfidences[key] = numeric
      }
    }
  }

  const overallConfidence = normalizeNumber(raw.overall_confidence ?? raw.overallConfidence)

  return {
    operations: normalizedOperations,
    missingFields,
    reasons,
    fieldConfidences: Object.keys(fieldConfidences).length ? fieldConfidences : undefined,
    overallConfidence: overallConfidence ?? undefined,
  }
}

function normalizeNumber(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return clamp(value, 0, 1)
  }

  if (typeof value === 'string' && value.trim().length > 0) {
    const parsed = Number(value.replace(',', '.'))
    if (Number.isFinite(parsed)) {
      return clamp(parsed, 0, 1)
    }
  }

  return undefined
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

