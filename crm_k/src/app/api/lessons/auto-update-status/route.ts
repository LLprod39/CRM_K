import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getAuthUser } from '@/lib/auth'
import { getLessonStatus, getStatusAfterCompletion } from '@/lib/lessonStatusUtils'

// POST /api/lessons/auto-update-status - автоматическое обновление статусов прошедших занятий
export async function POST(request: NextRequest) {
  try {
    const authUser = getAuthUser(request)
    if (!authUser) {
      return NextResponse.json(
        { error: 'Необходима аутентификация' },
        { status: 401 }
      )
    }

    const now = new Date()
    
    // Базовые условия для фильтрации
    const baseWhere = authUser.role === 'ADMIN' 
      ? {} 
      : {
          student: {
            userId: authUser.id
          }
        }

    // Находим все занятия, которые должны быть обновлены согласно новой логике:
    // 1. Запланированные занятия, которые уже прошли -> становятся задолженностью (если не оплачены)
    // 2. Предоплаченные занятия, которые уже прошли -> становятся проведенными (остаются оплаченными)
    const lessonsToUpdate = await prisma.lesson.findMany({
      where: {
        ...baseWhere,
        date: {
          lt: now // Занятие уже прошло
        },
        isCancelled: false, // Не отмененные
        isCompleted: false, // Еще не проведенные
        OR: [
          // Запланированные занятия (не проведены и не оплачены) -> Задолженность
          { isPaid: false },
          // Предоплаченные занятия (не проведены, но оплачены) -> Проведено (остается оплаченным)
          { isPaid: true }
        ]
      },
      include: {
        student: true
      }
    })

    console.log(`Найдено ${lessonsToUpdate.length} занятий для обновления:`, lessonsToUpdate.map(l => ({ 
      id: l.id, 
      isCompleted: l.isCompleted, 
      isPaid: l.isPaid, 
      isCancelled: l.isCancelled,
      date: l.date 
    })))

    let updatedCount = 0
    const results = []

    for (const lesson of lessonsToUpdate) {
      // Определяем новые значения статусов согласно новой логике
      const oldStatus = getLessonStatus(lesson)
      const statusAfterCompletion = getStatusAfterCompletion(lesson)
      
      const newIsCompleted = statusAfterCompletion.isCompleted
      const newIsPaid = statusAfterCompletion.isPaid
      const newStatus = statusAfterCompletion.newStatus

      try {
        console.log(`Обновляем занятие ${lesson.id}: ${oldStatus} -> ${newStatus}`)
        await prisma.lesson.update({
          where: { id: lesson.id },
          data: { 
            isCompleted: newIsCompleted,
            isPaid: newIsPaid,
            updatedAt: new Date()
          }
        })

        updatedCount++
        results.push({
          lessonId: lesson.id,
          studentName: lesson.student.fullName,
          oldStatus: oldStatus,
          newStatus: newStatus,
          lessonDate: lesson.date
        })
        console.log(`✅ Занятие ${lesson.id} успешно обновлено`)
      } catch (error) {
        console.error(`❌ Ошибка при обновлении занятия ${lesson.id}:`, error)
      }
    }

    return NextResponse.json({
      success: true,
      message: `Обновлено ${updatedCount} занятий`,
      updatedCount,
      results
    })

  } catch (error) {
    console.error('Ошибка при автоматическом обновлении статусов занятий:', error)
    return NextResponse.json(
      { error: 'Не удалось обновить статусы занятий' },
      { status: 500 }
    )
  }
}
