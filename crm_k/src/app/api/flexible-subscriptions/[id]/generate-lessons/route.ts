import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getAuthUser } from '@/lib/auth'

// POST /api/flexible-subscriptions/[id]/generate-lessons - сгенерировать уроки из абонемента
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authUser = getAuthUser(request)
    if (!authUser) {
      return NextResponse.json(
        { error: 'Необходима аутентификация' },
        { status: 401 }
      )
    }

    // Только администраторы могут генерировать уроки
    if (authUser.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Доступ запрещен. Только администраторы могут генерировать уроки.' },
        { status: 403 }
      )
    }

    const subscriptionId = parseInt(params.id)
    if (isNaN(subscriptionId)) {
      return NextResponse.json(
        { error: 'Неверный ID абонемента' },
        { status: 400 }
      )
    }

    // Получаем абонемент с полными данными
    const subscription = await prisma.flexibleSubscription.findUnique({
      where: { id: subscriptionId },
      include: {
        student: true,
        weekSchedules: {
          include: {
            weekDays: true
          }
        }
      }
    })

    if (!subscription) {
      return NextResponse.json(
        { error: 'Абонемент не найден' },
        { status: 404 }
      )
    }

    // Генерируем уроки для каждой недели
    const lessonsToCreate = []
    
    for (const week of subscription.weekSchedules) {
      for (const day of week.weekDays) {
        // Вычисляем дату урока
        const lessonDate = calculateLessonDate(week.startDate, day.dayOfWeek, day.startTime)
        
        if (lessonDate >= subscription.startDate && lessonDate <= subscription.endDate) {
          lessonsToCreate.push({
            date: lessonDate,
            endTime: new Date(lessonDate.getTime() + (new Date(day.endTime).getTime() - new Date(day.startTime).getTime())),
            studentId: subscription.studentId,
            cost: day.cost,
            isPaid: subscription.isPaid,
            notes: day.notes,
            lessonType: 'individual',
            location: day.location
          })
        }
      }
    }

    if (lessonsToCreate.length === 0) {
      return NextResponse.json(
        { error: 'Не удалось сгенерировать уроки для указанного периода' },
        { status: 400 }
      )
    }

    // Проверяем конфликты времени
    const existingLessons = await prisma.lesson.findMany({
      where: {
        isCancelled: false,
        date: {
          gte: subscription.startDate,
          lte: subscription.endDate
        }
      }
    })

    const conflictingLessons = []
    const validLessons = []

    for (const lesson of lessonsToCreate) {
      const hasConflict = existingLessons.some(existing => {
        const existingStart = new Date(existing.date)
        const existingEnd = existing.endTime ? new Date(existing.endTime) : new Date(existingStart.getTime() + 60 * 60 * 1000)
        const newStart = new Date(lesson.date)
        const newEnd = new Date(lesson.endTime)
        
        return (newStart < existingEnd && newEnd > existingStart)
      })

      if (hasConflict) {
        conflictingLessons.push(lesson)
      } else {
        validLessons.push(lesson)
      }
    }

    // Создаем только валидные уроки
    if (validLessons.length > 0) {
      await prisma.lesson.createMany({
        data: validLessons
      })
    }

    return NextResponse.json({
      message: `Создано ${validLessons.length} уроков`,
      createdLessons: validLessons.length,
      conflictingLessons: conflictingLessons.length,
      conflicts: conflictingLessons.map(lesson => ({
        date: lesson.date,
        time: lesson.date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
      }))
    })
  } catch (error) {
    console.error('Ошибка при генерации уроков из абонемента:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}

/**
 * Вычисляет дату урока на основе даты начала недели, дня недели и времени
 */
function calculateLessonDate(weekStartDate: Date, dayOfWeek: number, startTime: Date): Date {
  const weekStart = new Date(weekStartDate)
  const targetDate = new Date(weekStart)
  
  // Находим нужный день недели
  const currentDayOfWeek = weekStart.getDay() // 0=воскресенье, 1=понедельник, ..., 6=суббота
  const daysToAdd = (dayOfWeek - currentDayOfWeek + 7) % 7
  
  targetDate.setDate(weekStart.getDate() + daysToAdd)
  
  // Устанавливаем время
  const time = new Date(startTime)
  targetDate.setHours(time.getHours(), time.getMinutes(), time.getSeconds(), time.getMilliseconds())
  
  return targetDate
}
