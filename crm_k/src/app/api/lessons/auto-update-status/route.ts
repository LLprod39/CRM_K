import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getAuthUser } from '@/lib/auth'

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

    // Находим все занятия, которые должны быть обновлены:
    // 1. Запланированные занятия, которые уже прошли -> становятся оплаченными (проведено + оплачено)
    // 2. Предоплаченные занятия, которые уже прошли -> становятся оплаченными
    const lessonsToUpdate = await prisma.lesson.findMany({
      where: {
        ...baseWhere,
        date: {
          lt: now // Занятие уже прошло
        },
        status: {
          in: ['SCHEDULED', 'PREPAID'] // Только запланированные и предоплаченные
        }
      },
      include: {
        student: true
      }
    })

    console.log(`Найдено ${lessonsToUpdate.length} занятий для обновления:`, lessonsToUpdate.map(l => ({ id: l.id, status: l.status, date: l.date })))

    let updatedCount = 0
    const results = []

    for (const lesson of lessonsToUpdate) {
      let newStatus: 'COMPLETED' | 'PAID'
      
      // Если занятие было предоплачено, то оно становится оплаченным
      // Если было запланировано, то сразу становится оплаченным (проведено + оплачено)
      if (lesson.status === 'PREPAID') {
        newStatus = 'PAID'
      } else {
        // Запланированные занятия сразу становятся оплаченными
        newStatus = 'PAID'
      }

      try {
        console.log(`Обновляем занятие ${lesson.id}: ${lesson.status} -> ${newStatus}`)
        await prisma.lesson.update({
          where: { id: lesson.id },
          data: { 
            status: newStatus,
            updatedAt: new Date()
          }
        })

        updatedCount++
        results.push({
          lessonId: lesson.id,
          studentName: lesson.student.fullName,
          oldStatus: lesson.status,
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
