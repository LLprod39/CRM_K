import type { JsonSchemaDefinition, JsonSchemaProperty } from '@/lib/schemas'

export interface ValidationResult {
  missingFields: string[]
  violations: string[]
}

export function validateDraft(
  schema: JsonSchemaDefinition,
  data: Record<string, unknown>,
): ValidationResult {
  const missingFields = computeMissingFields(schema, data)
  const violations = computeViolations(schema, data)

  return {
    missingFields,
    violations,
  }
}

export function computeMissingFields(
  schema: JsonSchemaDefinition,
  data: Record<string, unknown>,
): string[] {
  const requiredFields = schema.required ?? []
  const missing: string[] = []

  for (const field of requiredFields) {
    const value = data[field]
    if (value === undefined || value === null || value === '') {
      missing.push(field)
    }
  }

  return missing
}

export function computeViolations(
  schema: JsonSchemaDefinition,
  data: Record<string, unknown>,
): string[] {
  const violations: string[] = []
  const properties = schema.properties ?? {}

  for (const [key, property] of Object.entries(properties)) {
    const value = data[key]
    if (value === undefined || value === null) {
      continue
    }

    if (!passesTypeCheck(property, value)) {
      violations.push(`${key}:type`)
      continue
    }

    if (!passesEnumCheck(property, value)) {
      violations.push(`${key}:enum`)
    }

    if (!passesPatternCheck(property, value)) {
      violations.push(`${key}:pattern`)
    }

    if (!passesRangeCheck(property, value)) {
      violations.push(`${key}:range`)
    }
  }

  return violations
}

function passesTypeCheck(property: JsonSchemaProperty, value: unknown): boolean {
  switch (property.type) {
    case 'string':
      return typeof value === 'string'
    case 'integer':
      return typeof value === 'number' && Number.isInteger(value)
    case 'number':
      return typeof value === 'number'
    case 'boolean':
      return typeof value === 'boolean'
    case 'object':
      return typeof value === 'object' && value !== null
    default:
      return true
  }
}

function passesEnumCheck(property: JsonSchemaProperty, value: unknown): boolean {
  if (!property.enum) {
    return true
  }

  if (typeof value !== 'string') {
    return false
  }

  return property.enum.some((item) => item.toLowerCase() === value.toLowerCase())
}

function passesPatternCheck(property: JsonSchemaProperty, value: unknown): boolean {
  if (!property.pattern || typeof value !== 'string') {
    return true
  }

  try {
    const regex = new RegExp(property.pattern)
    return regex.test(value)
  } catch (error) {
    console.warn('Invalid schema pattern for property', property, error)
    return true
  }
}

function passesRangeCheck(property: JsonSchemaProperty, value: unknown): boolean {
  if (typeof value !== 'number') {
    return true
  }

  if (property.minimum !== undefined && value < property.minimum) {
    return false
  }

  if (property.maximum !== undefined && value > property.maximum) {
    return false
  }

  return true
}
