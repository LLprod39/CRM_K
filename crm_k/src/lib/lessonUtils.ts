// Утилиты для работы с занятиями

/**
 * Автоматически обновляет статусы прошедших занятий
 * @param token - токен аутентификации
 * @returns Promise с результатом обновления
 */
export async function autoUpdateLessonStatuses(token: string) {
  try {
    const response = await fetch('/api/lessons/auto-update-status', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const result = await response.json()
    return result
  } catch (error) {
    console.error('Ошибка при автоматическом обновлении статусов занятий:', error)
    return null
  }
}

/**
 * Проверяет, нужно ли обновить статус занятия
 * @param lessonDate - дата занятия
 * @param isCompleted - проведено ли занятие
 * @param isPaid - оплачено ли занятие
 * @param isCancelled - отменено ли занятие
 * @returns true, если статус нужно обновить
 */
export function shouldUpdateLessonStatus(lessonDate: Date, isCompleted: boolean, isPaid: boolean, isCancelled: boolean): boolean {
  const now = new Date()
  const lessonDateTime = new Date(lessonDate)
  
  // Занятие прошло, не отменено и не проведено
  return lessonDateTime < now && !isCancelled && !isCompleted
}

/**
 * Определяет новые статусы для прошедшего занятия
 * @param isPaid - текущий статус оплаты
 * @returns объект с новыми статусами
 */
export function getNewStatusesForPastLesson(isPaid: boolean): { isCompleted: boolean; isPaid: boolean } {
  return {
    isCompleted: true, // Все прошедшие занятия становятся проведенными
    isPaid: true // Все прошедшие занятия становятся оплаченными
  }
}
