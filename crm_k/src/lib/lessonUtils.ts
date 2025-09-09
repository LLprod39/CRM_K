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
 * @param currentStatus - текущий статус
 * @returns true, если статус нужно обновить
 */
export function shouldUpdateLessonStatus(lessonDate: Date, currentStatus: string): boolean {
  const now = new Date()
  const lessonDateTime = new Date(lessonDate)
  
  // Занятие прошло и имеет статус, который нужно обновить
  return lessonDateTime < now && ['SCHEDULED', 'PREPAID'].includes(currentStatus)
}

/**
 * Определяет новый статус для прошедшего занятия
 * @param currentStatus - текущий статус
 * @returns новый статус
 */
export function getNewStatusForPastLesson(currentStatus: string): 'COMPLETED' | 'PAID' {
  if (currentStatus === 'PREPAID') {
    return 'PAID'
  }
  // Запланированные занятия сразу становятся оплаченными (проведено + оплачено)
  return 'PAID'
}
