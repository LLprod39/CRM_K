import type { JsonSchemaDefinition, JsonSchemaProperty } from '@/lib/schemas'

export function normalizePhone(value: unknown): string | null {
  if (value == null) {
    return null
  }

  const digits = String(value).replace(/\D/g, '')

  if (digits.length === 11 && (digits.startsWith('7') || digits.startsWith('8'))) {
    return `+7${digits.slice(1)}`
  }

  if (digits.length === 10) {
    return `+7${digits}`
  }

  return null
}

export function normalizeDateTime(value: unknown): string | null {
  if (value == null) {
    return null
  }

  const date = value instanceof Date ? value : new Date(String(value))
  if (Number.isNaN(date.getTime())) {
    return null
  }

  return date.toISOString()
}

export function normalizeInteger(value: unknown): number | null {
  if (value == null) {
    return null
  }

  const numberValue = typeof value === 'number' ? value : Number.parseInt(String(value), 10)
  if (Number.isNaN(numberValue)) {
    return null
  }

  return numberValue
}

export function normalizeDraftData(
  schema: JsonSchemaDefinition,
  data: Record<string, unknown>,
): Record<string, unknown> {
  const normalized: Record<string, unknown> = { ...data }

  const properties = schema.properties ?? {}

  for (const [key, property] of Object.entries(properties)) {
    const currentValue = normalized[key]
    if (currentValue === undefined || currentValue === null) {
      continue
    }

    const normalizedValue = normalizeValue(property, currentValue, key)
    if (normalizedValue !== undefined) {
      normalized[key] = normalizedValue
    }
  }

  return normalized
}

function normalizeValue(
  property: JsonSchemaProperty,
  value: unknown,
  key: string,
): unknown {
  if (property.type === 'integer') {
    return normalizeInteger(value)
  }

  if (property.type === 'string') {
    if (property.format === 'date-time') {
      return normalizeDateTime(value)
    }

    if (key.toLowerCase().includes('phone') || property.pattern?.includes('\\+7')) {
      const normalizedPhone = normalizePhone(value)
      return normalizedPhone ?? value
    }

    if (property.enum && typeof value === 'string') {
      const lowered = value.toLowerCase()
      const matched = property.enum.find((item) => item.toLowerCase() === lowered)
      return matched ?? value
    }
  }

  return value
}
