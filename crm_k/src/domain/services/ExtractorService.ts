import type { ConversationDraft } from '@prisma/client'
import { normalizeDraftData } from '@/lib/extractor/normalization'
import { validateDraft } from '@/lib/extractor/validation'
import { getSchemaForForm } from '@/lib/schemas'
import { generatePatchWithLLM } from '@/lib/extractor/patchGenerator'
import { getCachedPatch, setCachedPatch } from '@/lib/extractor/patchCache'
import type { DraftContext, ExtractorPatch, FormType, ExtractorConfig } from '../entities'
import type { 
  IConversationDraftRepository, 
  IExtractorConfigRepository,
  IStudentRepository,
  ILessonRepository,
  IPaymentRepository
} from '../repositories'
import { maskPII } from '../../lib/extractor/piiMasking'

export interface ProcessMessageParams {
  conversationId: string
  formType: FormType
  messageId: string
  content: string
  senderType: 'user' | 'bot'
  patch?: ExtractorPatch | null
  autoCommit?: boolean
  metadata?: Record<string, unknown>
}

export interface ProcessMessageResult {
  draft: ConversationDraft
  version?: number
  changedFields: string[]
  missingFields: string[]
  reasons: string[]
  violations: string[]
  isComplete: boolean
  overallConfidence?: number
  fieldConfidences?: Record<string, number>
  autoCommitAttempted?: boolean
  autoCommitResult?: AutoCommitResult
}

export interface AutoCommitResult {
  success: boolean
  message: string
  createdEntities?: {
    students?: any[]
    lessons?: any[]
    payments?: any[]
  }
  deduplicationInfo?: {
    duplicateFound: boolean
    duplicateId?: string
    windowSec: number
  }
  retryInfo?: {
    attempts: number
    maxAttempts: number
    lastError?: string
  }
}

export interface IExtractorService {
  processMessage(params: ProcessMessageParams): Promise<ProcessMessageResult>
  getDraftByConversation(conversationId: string): Promise<DraftContext | null>
}

export class ExtractorService implements IExtractorService {
  constructor(
    private readonly draftRepository: IConversationDraftRepository,
    private readonly configRepository?: IExtractorConfigRepository,
    private readonly studentRepository?: IStudentRepository,
    private readonly lessonRepository?: ILessonRepository,
    private readonly paymentRepository?: IPaymentRepository,
  ) {}

  async processMessage(params: ProcessMessageParams): Promise<ProcessMessageResult> {
    const startedAt = Date.now()

    const draft = await this.draftRepository.getOrCreateDraft({
      conversationId: params.conversationId,
      formType: params.formType,
      autoCommit: params.autoCommit,
    })

    await this.draftRepository.recordMessage({
      draftId: draft.id,
      messageId: params.messageId,
      content: params.content,
      senderType: params.senderType,
    })

    await this.draftRepository.createLog({
      draftId: draft.id,
      messageId: params.messageId,
      operation: 'receive',
      inputData: {
        senderType: params.senderType,
        content: params.content,
        metadata: params.metadata,
      },
    })

    const schema = getSchemaForForm(params.formType)
    const currentDraft = (draft.draftData as Record<string, unknown> | null) ?? {}
    const normalizedBefore = normalizeDraftData(schema, currentDraft)
    const validationBefore = validateDraft(schema, normalizedBefore)
    const missingBefore = validationBefore.missingFields

    const cacheKey = `${params.conversationId}:${params.messageId}:${params.content}`

    let patch = params.patch ?? null

    if (!patch) {
      patch = getCachedPatch(cacheKey)
    }

    const historyContext = await this.draftRepository.getDraftContext(draft.id)
    const sortedMessages = historyContext?.messages
      ?.slice()
      .sort((a, b) => new Date(a.processedAt).getTime() - new Date(b.processedAt).getTime()) ?? []
    const trimmedHistory = sortedMessages.slice(-12).map((message) => ({
      sender: message.senderType === 'bot' ? 'bot' as const : 'user' as const,
      content: message.content,
      timestamp: message.processedAt.toISOString(),
    }))

    let config: ExtractorConfig | undefined = undefined
    if (this.configRepository) {
      try {
        config = await this.configRepository.getConfig()
      } catch (error) {
        console.error('Extractor config load error:', error)
      }
    }

    if (!patch) {
      patch = await generatePatchWithLLM({
        schema,
        formType: params.formType,
        draftData: currentDraft,
        history: trimmedHistory,
        missingFields: missingBefore,
        model: config?.extractorModel,
        fieldMinConf: config?.fieldMinConf,
        overallMinConf: config?.autoCommitMinConf,
        systemPrompt: config?.systemPrompt,
        userPromptPreamble: config?.userPrompt,
        temperature: config?.generationTemperature,
        maxOutputTokens: config?.maxOutputTokens,
      })

      if (!patch) {
        const elapsed = Date.now() - startedAt
        await this.draftRepository.createLog({
          draftId: draft.id,
          messageId: params.messageId,
          operation: 'extract_generate',
          errorMessage: 'LLM patch generation failed',
          inputData: {
            missingFields: missingBefore,
            messages: trimmedHistory,
          },
          processingTime: elapsed,
        })
        const cachedFallback = getCachedPatch(cacheKey)
        if (!cachedFallback) {
          throw new Error('Failed to generate patch via LLM')
        }
        patch = cachedFallback
      } else {
        setCachedPatch(cacheKey, patch)
        await this.draftRepository.createLog({
          draftId: draft.id,
          messageId: params.messageId,
          operation: 'extract_generate',
          inputData: {
            missingFields: missingBefore,
            messages: trimmedHistory,
            config: {
              model: config?.extractorModel,
              temperature: config?.generationTemperature,
              maxOutputTokens: config?.maxOutputTokens,
            },
          },
          outputData: patch,
        })
      }
    } else {
      setCachedPatch(cacheKey, patch)
    }

    const { updatedDraft, changedFields } = this.applyPatch(currentDraft, patch)

    const normalizedDraft = normalizeDraftData(schema, updatedDraft)
    const validation = validateDraft(schema, normalizedDraft)

    const missingFields = Array.from(
      new Set([...(patch.missingFields ?? []), ...validation.missingFields]),
    )
    const violations = validation.violations

    const overallConfidence =
      patch.overallConfidence ?? this.calculateOverallConfidence(patch)

    const updated = await this.draftRepository.updateDraft({
      draftId: draft.id,
      draftData: normalizedDraft,
      isComplete: missingFields.length === 0,
    })

    const version = await this.draftRepository.createVersion({
      draftId: draft.id,
      patchData: patch,
      confidence: overallConfidence ?? 0,
      messageId: params.messageId,
    })

    const elapsed = Date.now() - startedAt

    await this.draftRepository.createLog({
      draftId: draft.id,
      messageId: params.messageId,
      operation: 'extract',
      inputData: {
        senderType: params.senderType,
        content: params.content,
      },
      outputData: {
        changedFields,
        missingFields,
        violations,
        reasons: patch.reasons,
        overallConfidence,
      },
      confidence: overallConfidence,
      processingTime: elapsed,
    })

    const result: ProcessMessageResult = {
      draft: updated,
      version: version.version,
      changedFields,
      missingFields,
      reasons: patch.reasons ?? [],
      violations,
      isComplete: updated.isComplete,
      overallConfidence,
      fieldConfidences: patch.fieldConfidences,
    }

    // Автокоммит если включен и данные готовы
    if (config?.autoCommit && updated.isComplete && overallConfidence && overallConfidence >= config.autoCommitMinConf) {
      try {
        const autoCommitResult = await this.performAutoCommit(
          draft.id,
          normalizedDraft,
          params.formType,
          config
        )
        result.autoCommitAttempted = true
        result.autoCommitResult = autoCommitResult
      } catch (error) {
        console.error('Auto-commit failed:', error)
        result.autoCommitAttempted = true
        result.autoCommitResult = {
          success: false,
          message: error instanceof Error ? error.message : 'Неизвестная ошибка автокоммита'
        }
      }
    }

    // Асинхронно создаем уведомление оператору
    if (config) {
      this.createOperatorNotification(
        params.conversationId,
        draft.id,
        result,
        config
      ).catch(error => {
        console.error('Failed to create operator notification:', error)
      })
    }

    return result
  }

  async getDraftByConversation(conversationId: string): Promise<DraftContext | null> {
    const draft = await this.draftRepository.getDraftByConversation(conversationId)

    if (!draft) {
      return null
    }

    const { versions, submissions, messages, extractorLogs, ...draftBase } = draft

    return {
      draft: draftBase,
      versions,
      submissions,
      messages,
      logs: extractorLogs,
    }
  }
  private applyPatch(
    baseDraft: Record<string, unknown> | null,
    patch: ExtractorPatch,
  ) {
    const draftCopy = this.cloneDraft(baseDraft)
    const changedFields: string[] = []

    for (const operation of patch.operations) {
      if (!operation.path.startsWith('/')) {
        continue
      }

      const segments = this.parsePointer(operation.path)
      if (!segments.length) {
        continue
      }

      const fieldKey = segments.join('.')

      if (operation.op === 'set') {
        this.setValue(draftCopy, segments, operation.value)
        changedFields.push(fieldKey)
      } else if (operation.op === 'unset') {
        if (this.unsetValue(draftCopy, segments)) {
          changedFields.push(fieldKey)
        }
      }
    }

    return {
      updatedDraft: draftCopy,
      changedFields,
    }
  }

  private cloneDraft(baseDraft: Record<string, unknown> | null) {
    if (baseDraft == null) {
      return {}
    }

    if (typeof structuredClone === 'function') {
      return structuredClone(baseDraft)
    }

    return JSON.parse(JSON.stringify(baseDraft))
  }

  private parsePointer(path: string): string[] {
    return path
      .split('/')
      .slice(1)
      .map((segment) => segment.replace(/~1/g, '/').replace(/~0/g, '~'))
      .filter((segment) => segment.length > 0)
  }

  private setValue(target: Record<string, unknown>, path: string[], value: unknown) {
    let current: Record<string, unknown> = target

    for (let i = 0; i < path.length - 1; i += 1) {
      const key = path[i]
      const next = current[key]
      if (typeof next !== 'object' || next === null) {
        const nested: Record<string, unknown> = {}
        current[key] = nested
        current = nested
      } else {
        current = next as Record<string, unknown>
      }
    }

    current[path[path.length - 1]] = value as never
  }

  private unsetValue(target: Record<string, unknown>, path: string[]) {
    let current: Record<string, unknown> | null = target

    for (let i = 0; i < path.length - 1; i += 1) {
      const key = path[i]
      const next = current?.[key]
      if (typeof next !== 'object' || next === null) {
        return false
      }
      current = next as Record<string, unknown>
    }

    if (!current) {
      return false
    }

    const finalKey = path[path.length - 1]
    if (Object.prototype.hasOwnProperty.call(current, finalKey)) {
      delete current[finalKey]
      return true
    }

    return false
  }

  private calculateOverallConfidence(patch: ExtractorPatch) {
    const confidences = patch.operations
      .map((operation) => operation.confidence)
      .filter((value): value is number => typeof value === 'number' && !Number.isNaN(value))

    if (!confidences.length) {
      return undefined
    }

    const total = confidences.reduce((sum, value) => sum + value, 0)
    return Number((total / confidences.length).toFixed(4))
  }

  /**
   * Создает уведомление оператору о результатах экстракции
   */
  private async createOperatorNotification(
    conversationId: string,
    draftId: string,
    result: ProcessMessageResult,
    config: ExtractorConfig
  ): Promise<void> {
    try {
      const { prisma } = await import('@/lib/db')
      
      // Определяем тип уведомления и приоритет
      let notificationType: 'low_confidence' | 'missing_fields' | 'validation_error' | 'ready_for_review' = 'ready_for_review'
      let priority: 'low' | 'normal' | 'high' = 'normal'
      let message = ''

      if (result.overallConfidence !== undefined && result.overallConfidence < 0.7) {
        notificationType = 'low_confidence'
        priority = 'high'
        message = `Низкая уверенность экстракции (${Math.round(result.overallConfidence * 100)}%). Требуется проверка оператора.`
      } else if (result.missingFields.length > 0) {
        notificationType = 'missing_fields'
        priority = 'normal'
        message = `Отсутствуют обязательные поля: ${result.missingFields.join(', ')}. Требуется дополнительная информация.`
      } else if (result.violations.length > 0) {
        notificationType = 'validation_error'
        priority = 'high'
        message = `Обнаружены ошибки валидации: ${result.violations.join(', ')}. Требуется исправление.`
      } else if (result.isComplete) {
        notificationType = 'ready_for_review'
        priority = 'normal'
        message = `Данные готовы к подтверждению. Уверенность: ${Math.round((result.overallConfidence || 0) * 100)}%.`
      }

      // Создаем уведомление только если есть что уведомить
      if (notificationType !== 'ready_for_review' || result.isComplete) {
        await prisma.extractorNotification.create({
          data: {
            type: notificationType,
            message,
            confidence: result.overallConfidence || 0,
            conversationId,
            draftId,
            priority,
            status: 'pending',
            metadata: {
              missingFields: result.missingFields,
              violations: result.violations,
              fieldConfidences: result.fieldConfidences,
              changedFields: result.changedFields
            }
          }
        })

        console.log(`Created operator notification: ${notificationType} for conversation ${conversationId}`)
      }
    } catch (error) {
      console.error('Failed to create operator notification:', error)
      // Не прерываем выполнение основного процесса
    }
  }

  /**
   * Выполняет автокоммит черновика с дедупликацией и оптимистическими блокировками
   */
  private async performAutoCommit(
    draftId: string,
    draftData: Record<string, unknown>,
    formType: FormType,
    config: ExtractorConfig
  ): Promise<AutoCommitResult> {
    const maxRetries = 3
    let lastError: string | undefined
    let attempts = 0

    while (attempts < maxRetries) {
      attempts++
      
      try {
        // Проверяем дедупликацию
        const deduplicationInfo = await this.checkDeduplication(draftData, formType, config.upsertDedupeWindowSec)
        
        if (deduplicationInfo.duplicateFound) {
          return {
            success: true,
            message: `Найдена дублирующая запись (ID: ${deduplicationInfo.duplicateId}). Автокоммит пропущен.`,
            deduplicationInfo
          }
        }

        // Создаем сущности с оптимистической блокировкой
        const createdEntities = await this.createEntitiesFromDraft(draftData, formType, config)
        
        // Помечаем черновик как закоммиченный
        await this.draftRepository.updateDraft({
          draftId,
          isCommitted: true,
          committedAt: new Date(),
          committedBy: 'auto-commit'
        })

        // Логируем успешный автокоммит
        await this.logAutoCommit(draftId, createdEntities, config)

        return {
          success: true,
          message: 'Автокоммит выполнен успешно',
          createdEntities,
          deduplicationInfo,
          retryInfo: { attempts, maxAttempts: maxRetries }
        }

      } catch (error) {
        lastError = error instanceof Error ? error.message : 'Неизвестная ошибка'
        
        // Если это ошибка блокировки, ждем перед повтором
        if (this.isLockError(error)) {
          await this.delay(100 * attempts) // Экспоненциальная задержка
          continue
        }
        
        // Для других ошибок не повторяем
        break
      }
    }

    return {
      success: false,
      message: `Автокоммит не удался после ${attempts} попыток: ${lastError}`,
      retryInfo: { attempts, maxAttempts: maxRetries, lastError }
    }
  }

  /**
   * Проверяет дедупликацию на основе данных черновика
   */
  private async checkDeduplication(
    draftData: Record<string, unknown>,
    formType: FormType,
    windowSec: number
  ): Promise<{ duplicateFound: boolean; duplicateId?: string; windowSec: number }> {
    const windowStart = new Date(Date.now() - windowSec * 1000)
    
    try {
      if (formType === 'student_registration') {
        const phone = draftData.phone as string
        if (phone && this.studentRepository) {
          const existingStudents = await this.studentRepository.findAll()
          const duplicate = existingStudents.find(student => 
            student.phone === phone && 
            student.createdAt >= windowStart
          )
          
          if (duplicate) {
            return {
              duplicateFound: true,
              duplicateId: duplicate.id.toString(),
              windowSec
            }
          }
        }
      } else if (formType === 'lesson_booking') {
        const studentName = draftData.studentName as string
        const parentPhone = draftData.parentPhone as string
        const preferredDate = draftData.preferredDate as string
        
        if (studentName && parentPhone && preferredDate && this.lessonRepository) {
          const lessonDate = new Date(preferredDate)
          const dayStart = new Date(lessonDate.getFullYear(), lessonDate.getMonth(), lessonDate.getDate())
          const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000)
          
          const existingLessons = await this.lessonRepository.findByDateRange(dayStart, dayEnd)
          const duplicate = existingLessons.find(lesson => 
            lesson.student?.fullName === studentName &&
            lesson.student?.phone === parentPhone &&
            lesson.createdAt >= windowStart
          )
          
          if (duplicate) {
            return {
              duplicateFound: true,
              duplicateId: duplicate.id.toString(),
              windowSec
            }
          }
        }
      }
    } catch (error) {
      console.error('Deduplication check failed:', error)
    }

    return { duplicateFound: false, windowSec }
  }

  /**
   * Создает сущности CRM из данных черновика
   */
  private async createEntitiesFromDraft(
    draftData: Record<string, unknown>,
    formType: FormType,
    config: ExtractorConfig
  ): Promise<{ students?: any[]; lessons?: any[]; payments?: any[] }> {
    const createdEntities: { students?: any[]; lessons?: any[]; payments?: any[] } = {}

    if (formType === 'student_registration') {
      if (!this.studentRepository) {
        throw new Error('Student repository not available')
      }

      const studentData = {
        fullName: draftData.fullName as string,
        phone: draftData.phone as string,
        age: draftData.age as number,
        parentName: draftData.parentName as string,
        diagnosis: draftData.diagnosis as string | undefined,
        comment: draftData.comment as string | undefined,
      }

      const student = await this.studentRepository.create(studentData)
      createdEntities.students = [student]

    } else if (formType === 'lesson_booking') {
      if (!this.studentRepository || !this.lessonRepository) {
        throw new Error('Required repositories not available')
      }

      // Сначала создаем или находим студента
      let student
      const existingStudents = await this.studentRepository.findAll()
      const existingStudent = existingStudents.find(s => s.phone === draftData.parentPhone)
      
      if (existingStudent) {
        student = existingStudent
      } else {
        const studentData = {
          fullName: draftData.studentName as string,
          phone: draftData.parentPhone as string,
          age: draftData.studentAge as number || 5, // Дефолтный возраст
          parentName: draftData.parentName as string || 'Не указано',
        }
        student = await this.studentRepository.create(studentData)
        createdEntities.students = [student]
      }

      // Создаем урок
      const lessonDate = new Date(draftData.preferredDate as string)
      const endTime = new Date(lessonDate.getTime() + 60 * 60 * 1000) // +1 час

      const lessonData = {
        date: lessonDate,
        endTime,
        studentId: student.id,
        cost: 2000, // Дефолтная стоимость
        isCompleted: false,
        isPaid: false,
        isCancelled: false,
        notes: draftData.notes as string | undefined,
        lessonType: (draftData.lessonType as 'individual' | 'group') || 'individual',
      }

      const lesson = await this.lessonRepository.create(lessonData)
      createdEntities.lessons = [lesson]
    }

    return createdEntities
  }

  /**
   * Логирует автокоммит с маскированием PII
   */
  private async logAutoCommit(
    draftId: string,
    createdEntities: { students?: any[]; lessons?: any[]; payments?: any[] },
    config: ExtractorConfig
  ): Promise<void> {
    try {
      const maskedEntities = {
        students: createdEntities.students?.map(student => maskPII(student)),
        lessons: createdEntities.lessons?.map(lesson => maskPII(lesson)),
        payments: createdEntities.payments?.map(payment => maskPII(payment)),
      }

      await this.draftRepository.createLog({
        draftId,
        messageId: 'auto-commit',
        operation: 'commit',
        inputData: {
          config: {
            autoCommitMinConf: config.autoCommitMinConf,
            upsertDedupeWindowSec: config.upsertDedupeWindowSec,
          }
        },
        outputData: {
          createdEntities: maskedEntities,
          entityCounts: {
            students: createdEntities.students?.length || 0,
            lessons: createdEntities.lessons?.length || 0,
            payments: createdEntities.payments?.length || 0,
          }
        },
        confidence: 1.0, // Автокоммит всегда с максимальной уверенностью
      })
    } catch (error) {
      console.error('Failed to log auto-commit:', error)
    }
  }

  /**
   * Проверяет, является ли ошибка ошибкой блокировки
   */
  private isLockError(error: unknown): boolean {
    if (error instanceof Error) {
      const message = error.message.toLowerCase()
      return message.includes('lock') || 
             message.includes('deadlock') || 
             message.includes('timeout') ||
             message.includes('concurrent')
    }
    return false
  }

  /**
   * Задержка для экспоненциального backoff
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * Коммитит черновик в CRM (создает сущности) - ручной коммит
   */
  async commitDraft(draftId: string, userId: string): Promise<{
    success: boolean
    message: string
    createdEntities?: any
  }> {
    try {
      const draft = await this.draftRepository.getDraftById(draftId)
      if (!draft) {
        return { success: false, message: 'Черновик не найден' }
      }

      if (!draft.isComplete) {
        return { success: false, message: 'Черновик не завершен' }
      }

      const config = this.configRepository ? await this.configRepository.getConfig() : undefined
      if (!config) {
        return { success: false, message: 'Конфигурация экстрактора не найдена' }
      }

      const autoCommitResult = await this.performAutoCommit(
        draftId,
        draft.draftData as Record<string, unknown>,
        draft.formType as FormType,
        config
      )

      return {
        success: autoCommitResult.success,
        message: autoCommitResult.message,
        createdEntities: autoCommitResult.createdEntities
      }
    } catch (error) {
      console.error('Error committing draft:', error)
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Неизвестная ошибка'
      }
    }
  }
}



