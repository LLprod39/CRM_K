import type { FormType } from '@/domain/entities'

export type JsonSchemaProperty = {
  type?: 'string' | 'integer' | 'number' | 'boolean' | 'object'
  enum?: string[]
  minLength?: number
  maximum?: number
  minimum?: number
  pattern?: string
  format?: 'date-time' | 'email'
}

export type JsonSchemaDefinition = {
  type: 'object'
  required?: string[]
  properties?: Record<string, JsonSchemaProperty>
}

export const lessonBookingSchema: JsonSchemaDefinition = {
  type: 'object',
  required: ['studentName', 'parentPhone', 'preferredDate', 'lessonType'],
  properties: {
    studentName: { type: 'string', minLength: 2 },
    parentPhone: { type: 'string', pattern: '^\\+7[0-9]{10}$' },
    parentName: { type: 'string' },
    studentAge: { type: 'integer', minimum: 1, maximum: 18 },
    preferredDate: { type: 'string', format: 'date-time' },
    preferredTime: { type: 'string', pattern: '^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$' },
    lessonType: {
      type: 'string',
      enum: ['individual', 'group', 'consultation'],
    },
    teacherId: { type: 'integer' },
    notes: { type: 'string' },
    diagnosis: { type: 'string' },
  },
}

export const studentRegistrationSchema: JsonSchemaDefinition = {
  type: 'object',
  required: ['fullName', 'phone', 'age', 'parentName'],
  properties: {
    fullName: { type: 'string', minLength: 2 },
    phone: { type: 'string', pattern: '^\\+7[0-9]{10}$' },
    age: { type: 'integer', minimum: 1, maximum: 18 },
    parentName: { type: 'string', minLength: 2 },
    diagnosis: { type: 'string' },
    comment: { type: 'string' },
    userId: { type: 'integer' },
  },
}

export const consultationSchema: JsonSchemaDefinition = {
  type: 'object',
  required: ['contactName', 'contactPhone', 'preferredDate'],
  properties: {
    contactName: { type: 'string', minLength: 2 },
    contactPhone: { type: 'string', pattern: '^\\+7[0-9]{10}$' },
    preferredDate: { type: 'string', format: 'date-time' },
    preferredTime: { type: 'string', pattern: '^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$' },
    topic: { type: 'string' },
    notes: { type: 'string' },
  },
}

const schemaRegistry: Record<FormType, JsonSchemaDefinition> = {
  lesson_booking: lessonBookingSchema,
  student_registration: studentRegistrationSchema,
  consultation: consultationSchema,
}

export function getSchemaForForm(formType: FormType): JsonSchemaDefinition {
  return schemaRegistry[formType]
}

export function listSupportedFormTypes(): FormType[] {
  return Object.keys(schemaRegistry) as FormType[]
}
