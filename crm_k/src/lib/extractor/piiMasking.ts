/**
 * Утилиты для маскирования персональных данных (PII) в логах
 */

export interface MaskingConfig {
  phonePattern?: RegExp
  emailPattern?: RegExp
  namePattern?: RegExp
  maskChar?: string
}

const defaultConfig: MaskingConfig = {
  phonePattern: /(\+7|8)?[\s\-]?\(?(\d{3})\)?[\s\-]?(\d{3})[\s\-]?(\d{2})[\s\-]?(\d{2})/g,
  emailPattern: /([a-zA-Z0-9._%+-]+)@([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g,
  namePattern: /\b([А-ЯЁ][а-яё]+)\s+([А-ЯЁ][а-яё]+)\b/g,
  maskChar: '*'
}

/**
 * Маскирует персональные данные в объекте
 */
export function maskPII<T extends Record<string, any>>(
  obj: T,
  config: MaskingConfig = {}
): T {
  const finalConfig = { ...defaultConfig, ...config }
  
  if (!obj || typeof obj !== 'object') {
    return obj
  }

  const masked = { ...obj } as any

  for (const [key, value] of Object.entries(masked)) {
    if (typeof value === 'string') {
      masked[key] = maskString(value, finalConfig)
    } else if (typeof value === 'object' && value !== null) {
      masked[key] = maskPII(value, finalConfig)
    }
  }

  return masked
}

/**
 * Маскирует персональные данные в строке
 */
export function maskString(str: string, config: MaskingConfig = {}): string {
  const finalConfig = { ...defaultConfig, ...config }
  let masked = str

  // Маскируем телефоны
  if (finalConfig.phonePattern) {
    masked = masked.replace(finalConfig.phonePattern, (match) => {
      return match.replace(/\d/g, finalConfig.maskChar!)
    })
  }

  // Маскируем email
  if (finalConfig.emailPattern) {
    masked = masked.replace(finalConfig.emailPattern, (match, user, domain) => {
      const maskedUser = user.charAt(0) + finalConfig.maskChar!.repeat(user.length - 1)
      return `${maskedUser}@${domain}`
    })
  }

  // Маскируем имена (только фамилии и имена, оставляем отчества)
  if (finalConfig.namePattern) {
    masked = masked.replace(finalConfig.namePattern, (match, firstName, lastName) => {
      const maskedFirstName = firstName.charAt(0) + finalConfig.maskChar!.repeat(firstName.length - 1)
      const maskedLastName = lastName.charAt(0) + finalConfig.maskChar!.repeat(lastName.length - 1)
      return `${maskedFirstName} ${maskedLastName}`
    })
  }

  return masked
}

/**
 * Создает безопасную версию объекта для логирования
 */
export function createSafeLogObject<T extends Record<string, any>>(
  obj: T,
  sensitiveFields: string[] = ['phone', 'email', 'fullName', 'parentName', 'studentName']
): Record<string, any> {
  const safe: Record<string, any> = {}

  for (const [key, value] of Object.entries(obj)) {
    if (sensitiveFields.includes(key)) {
      safe[key] = '[MASKED]'
    } else if (typeof value === 'object' && value !== null) {
      safe[key] = createSafeLogObject(value, sensitiveFields)
    } else {
      safe[key] = value
    }
  }

  return safe
}

/**
 * Проверяет, содержит ли строка потенциально чувствительные данные
 */
export function containsSensitiveData(str: string): boolean {
  const phonePattern = /(\+7|8)?[\s\-]?\(?(\d{3})\)?[\s\-]?(\d{3})[\s\-]?(\d{2})[\s\-]?(\d{2})/
  const emailPattern = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/
  const namePattern = /\b([А-ЯЁ][а-яё]+)\s+([А-ЯЁ][а-яё]+)\b/

  return phonePattern.test(str) || emailPattern.test(str) || namePattern.test(str)
}

/**
 * Создает статистику автокоммита без чувствительных данных
 */
export function createAutoCommitStats(
  result: {
    success: boolean
    createdEntities?: { students?: any[]; lessons?: any[]; payments?: any[] }
    deduplicationInfo?: { duplicateFound: boolean; windowSec: number }
    retryInfo?: { attempts: number; maxAttempts: number }
  }
): Record<string, any> {
  return {
    success: result.success,
    entityCounts: {
      students: result.createdEntities?.students?.length || 0,
      lessons: result.createdEntities?.lessons?.length || 0,
      payments: result.createdEntities?.payments?.length || 0,
    },
    deduplication: {
      duplicateFound: result.deduplicationInfo?.duplicateFound || false,
      windowSec: result.deduplicationInfo?.windowSec || 0,
    },
    retryInfo: {
      attempts: result.retryInfo?.attempts || 1,
      maxAttempts: result.retryInfo?.maxAttempts || 1,
    },
    timestamp: new Date().toISOString(),
  }
}
