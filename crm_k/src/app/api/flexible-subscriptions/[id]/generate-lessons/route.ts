import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getAuthUser } from '@/lib/auth'

// POST /api/flexible-subscriptions/[id]/generate-lessons - сгенерировать уроки из абонемента
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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

    const resolvedParams = await params
    const subscriptionId = parseInt(resolvedParams.id)
    if (isNaN(subscriptionId)) {
      return NextResponse.json(
        { error: 'Неверный ID абонемента' },
        { status: 400 }
      )
    }

    // Получаем абонемент с полными данными
    const subscription = await (prisma as any).flexibleSubscription.findUnique({
      where: { id: subscriptionId },
      include: {
        student: true,
        weekSchedules: {
          include: {
            weekDays: true
          }
        },
        paidDays: {
          include: {
            day: true
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

    // Создаем карту оплаченных дней для быстрого поиска
    const paidDaysMap = new Map()
    subscription.paidDays.forEach((paidDay: any) => {
      paidDaysMap.set(paidDay.dayId, paidDay)
    })

    // Генерируем уроки для каждой недели
    const lessonsToCreate = []
    
    console.log('Начинаем генерацию уроков для абонемента:', {
      subscriptionId,
      startDate: subscription.startDate,
      endDate: subscription.endDate,
      weekSchedulesCount: subscription.weekSchedules.length,
      paymentStatus: subscription.paymentStatus,
      paidDaysCount: subscription.paidDays.length
    })
    
    for (const week of subscription.weekSchedules) {
      console.log('Обрабатываем неделю:', {
        weekNumber: week.weekNumber,
        weekStartDate: week.startDate,
        weekEndDate: week.endDate,
        daysCount: week.weekDays.length
      })
      
      for (const day of week.weekDays) {
        // Вычисляем дату урока
        const lessonDate = calculateLessonDate(week.startDate, day.dayOfWeek, day.startTime)
        const inRange = lessonDate >= subscription.startDate && lessonDate <= subscription.endDate
        
        console.log('День недели:', {
          dayId: day.id,
          dayOfWeek: day.dayOfWeek,
          startTime: day.startTime,
          lessonDate: lessonDate.toISOString(),
          subscriptionStart: subscription.startDate.toISOString(),
          subscriptionEnd: subscription.endDate.toISOString(),
          inRange: inRange
        })
        
        if (inRange) {
          // Определяем статус платежа урока
          let lessonPaymentStatus = 'UNPAID'
          
          if (subscription.paymentStatus === 'PAID') {
            // Если абонемент полностью оплачен, все уроки оплачены
            lessonPaymentStatus = 'PAID'
          } else if (subscription.paymentStatus === 'PARTIAL') {
            // Если абонемент частично оплачен, проверяем конкретный день
            const paidDay = paidDaysMap.get(day.id)
            console.log('Проверяем оплату дня:', { dayId: day.id, paidDay: paidDay, isPaid: paidDay?.isPaid })
            if (paidDay && paidDay.isPaid) {
              lessonPaymentStatus = 'PAID'
            }
          }

          const lessonToCreate = {
            date: lessonDate,
            endTime: new Date(lessonDate.getTime() + (new Date(day.endTime).getTime() - new Date(day.startTime).getTime())),
            studentId: subscription.studentId,
            teacherId: subscription.userId,
            cost: day.cost,
            paymentStatus: lessonPaymentStatus,
            isPaid: lessonPaymentStatus === 'PAID', // Для совместимости
            notes: day.notes,
            lessonType: 'individual',
            location: day.location
          }
          
          console.log('Создаем урок:', { date: lessonDate.toISOString(), paymentStatus: lessonPaymentStatus })
          lessonsToCreate.push(lessonToCreate)
        } else {
          console.log('Урок не попадает в диапазон дат абонемента, пропускаем')
        }
      }
    }
    
    console.log('Итого уроков для создания:', lessonsToCreate.length)

    if (lessonsToCreate.length === 0) {
      return NextResponse.json(
        { error: 'Не удалось сгенерировать уроки для указанного периода' },
        { status: 400 }
      )
    }

    // Создаем все уроки
    await prisma.lesson.createMany({
      data: lessonsToCreate
    })

    return NextResponse.json({
      message: `Создано ${lessonsToCreate.length} уроков`,
      createdLessons: lessonsToCreate.length
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
