import { Lesson, LessonStatus } from '@/types'

// Константы для правил отмены
export const CANCELLATION_THRESHOLD_HOURS = 5

/**
 * Определяет статус занятия на основе булевых полей
 */
export function getLessonStatus(lesson: Lesson): LessonStatus {
  if (lesson.isCancelled) return 'cancelled'
  if (lesson.isCompleted && lesson.isPaid) return 'completed' // Проведено + Оплачено = Оплачено (доход)
  if (lesson.isCompleted && !lesson.isPaid) return 'debt' // Проведено без оплаты = Задолженность
  if (!lesson.isCompleted && lesson.isPaid) return 'prepaid' // Предоплачено
  if (!lesson.isCompleted && !lesson.isPaid) return 'scheduled' // Запланировано
  return 'unpaid' // Не оплачено (резервный статус)
}

/**
 * Получает текстовое описание статуса
 */
export function getLessonStatusText(status: LessonStatus): string {
  const statusMap = {
    scheduled: 'Запланировано',
    prepaid: 'Предоплачено',
    cancelled: 'Отменено',
    completed: 'Проведено',
    debt: 'Задолженность',
    unpaid: 'Не оплачено'
  }
  return statusMap[status] || 'Неизвестно'
}

/**
 * Проверяет, можно ли отменить занятие с возвратом средств
 */
export function canCancelWithRefund(lessonDate: Date): boolean {
  const now = new Date()
  const timeDiff = lessonDate.getTime() - now.getTime()
  const hoursDiff = timeDiff / (1000 * 60 * 60)
  
  return hoursDiff >= CANCELLATION_THRESHOLD_HOURS
}

/**
 * Определяет, что происходит при отмене занятия
 */
export function getCancellationResult(lesson: Lesson): {
  canRefund: boolean
  refundAmount: number
  reason: string
} {
  const canRefund = canCancelWithRefund(lesson.date)
  
  if (canRefund) {
    return {
      canRefund: true,
      refundAmount: lesson.cost,
      reason: 'Отмена за 5+ часов - возврат в предоплату'
    }
  } else {
    return {
      canRefund: false,
      refundAmount: 0,
      reason: 'Отмена менее чем за 5 часов - сумма уходит в доход'
    }
  }
}

/**
 * Определяет новый статус после проведения занятия
 */
export function getStatusAfterCompletion(lesson: Lesson): {
  isCompleted: boolean
  isPaid: boolean
  newStatus: LessonStatus
} {
  if (lesson.isPaid) {
    // Если было предоплачено - остается оплаченным (доход)
    return {
      isCompleted: true,
      isPaid: true,
      newStatus: 'completed'
    }
  } else {
    // Если не было оплаты - становится задолженностью
    return {
      isCompleted: true,
      isPaid: false,
      newStatus: 'debt'
    }
  }
}

/**
 * Определяет новый статус после внесения оплаты
 */
export function getStatusAfterPayment(lesson: Lesson): {
  isPaid: boolean
  newStatus: LessonStatus
} {
  if (lesson.isCompleted) {
    // Если занятие уже проведено - становится полностью оплаченным
    return {
      isPaid: true,
      newStatus: 'completed'
    }
  } else {
    // Если занятие еще не проведено - становится предоплаченным
    return {
      isPaid: true,
      newStatus: 'prepaid'
    }
  }
}

/**
 * Валидирует переход между статусами
 */
export function validateStatusTransition(
  currentLesson: Lesson,
  newIsCompleted?: boolean,
  newIsPaid?: boolean,
  newIsCancelled?: boolean
): {
  isValid: boolean
  error?: string
  newStatus: LessonStatus
} {
  const currentStatus = getLessonStatus(currentLesson)
  
  // Если пытаемся отменить занятие
  if (newIsCancelled === true && !currentLesson.isCancelled) {
    return {
      isValid: true,
      newStatus: 'cancelled'
    }
  }
  
  // Если пытаемся провести занятие
  if (newIsCompleted === true && !currentLesson.isCompleted) {
    const result = getStatusAfterCompletion(currentLesson)
    return {
      isValid: true,
      newStatus: result.newStatus
    }
  }
  
  // Если пытаемся внести оплату
  if (newIsPaid === true && !currentLesson.isPaid) {
    const result = getStatusAfterPayment(currentLesson)
    return {
      isValid: true,
      newStatus: result.newStatus
    }
  }
  
  // Если пытаемся снять оплату
  if (newIsPaid === false && currentLesson.isPaid) {
    if (currentLesson.isCompleted) {
      return {
        isValid: false,
        error: 'Нельзя снять оплату с проведенного занятия',
        newStatus: currentStatus
      }
    } else {
      return {
        isValid: true,
        newStatus: 'scheduled'
      }
    }
  }
  
  // Если пытаемся отменить проведение
  if (newIsCompleted === false && currentLesson.isCompleted) {
    return {
      isValid: false,
      error: 'Нельзя отменить проведение занятия',
      newStatus: currentStatus
    }
  }
  
  return {
    isValid: true,
    newStatus: currentStatus
  }
}

/**
 * Получает цвет для статуса в UI
 */
export function getStatusColor(status: LessonStatus): string {
  const colorMap = {
    scheduled: 'bg-blue-100 text-blue-800',
    prepaid: 'bg-yellow-100 text-yellow-800',
    cancelled: 'bg-red-100 text-red-800',
    completed: 'bg-green-100 text-green-800',
    debt: 'bg-orange-100 text-orange-800',
    unpaid: 'bg-gray-100 text-gray-800'
  }
  return colorMap[status] || 'bg-gray-100 text-gray-800'
}

/**
 * Получает иконку для статуса
 */
export function getStatusIcon(status: LessonStatus): string {
  const iconMap = {
    scheduled: '📅',
    prepaid: '💰',
    cancelled: '❌',
    completed: '✅',
    debt: '⚠️',
    unpaid: '⏳'
  }
  return iconMap[status] || '❓'
}

/**
 * Получает комбинированный статус занятия (для обратной совместимости)
 */
export function getCombinedLessonStatus(lesson: Lesson): string {
  const statuses = []
  if (lesson.isCompleted) statuses.push('Проведено')
  if (lesson.isPaid) statuses.push('Оплачено')
  if (lesson.isCancelled) statuses.push('Отменено')
  
  if (statuses.length === 0) return 'Запланировано'
  return statuses.join(' + ')
}
