import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getAuthUser } from '@/lib/auth'
import { CreateFlexibleSubscriptionData, FlexibleSubscriptionDayFormData } from '@/types'

// GET /api/flexible-subscriptions - получить все гибкие абонементы
export async function GET(request: NextRequest) {
  try {
    const authUser = getAuthUser(request)
    if (!authUser) {
      return NextResponse.json(
        { error: 'Необходима аутентификация' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const studentId = searchParams.get('studentId')

    // Определяем фильтр в зависимости от роли пользователя
    const whereClause: any = {}
    
    if (authUser.role !== 'ADMIN') {
      // Показываем абонементы для учеников, с которыми пользователь проводил занятия
      whereClause.student = {
        lessons: {
          some: {
            teacherId: authUser.id
          }
        }
      }
    }
    
    if (studentId) {
      whereClause.studentId = parseInt(studentId)
    }

    const subscriptions = await (prisma as any).flexibleSubscription.findMany({
      where: whereClause,
      include: {
        student: {
          include: {
            user: true
          }
        },
        user: true,
        weekSchedules: {
          include: {
            weekDays: {
              include: {
                paidDays: true
              }
            }
          }
        },
        payments: true,
        paidDays: {
          include: {
            day: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(subscriptions)
  } catch (error) {
    console.error('Ошибка при получении гибких абонементов:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}

// POST /api/flexible-subscriptions - создать новый гибкий абонемент
export async function POST(request: NextRequest) {
  try {
    console.log('Получен запрос на создание гибкого абонемента')
    
    const authUser = getAuthUser(request)
    if (!authUser) {
      console.log('Пользователь не аутентифицирован')
      return NextResponse.json(
        { error: 'Необходима аутентификация' },
        { status: 401 }
      )
    }

    console.log('Пользователь аутентифицирован:', authUser.role)

    // Только администраторы могут создавать абонементы
    if (authUser.role !== 'ADMIN') {
      console.log('Доступ запрещен для роли:', authUser.role)
      return NextResponse.json(
        { error: 'Доступ запрещен. Только администраторы могут создавать абонементы.' },
        { status: 403 }
      )
    }

    const body: any = await request.json()
    console.log('Получены данные для создания абонемента:', body)
    
    // Валидация обязательных полей
    if (!body.name || !body.studentId || !body.userId || !body.startDate || !body.endDate) {
      console.log('Валидация не прошла - отсутствуют обязательные поля:', {
        name: !!body.name,
        studentId: !!body.studentId,
        userId: !!body.userId,
        startDate: !!body.startDate,
        endDate: !!body.endDate
      })
      return NextResponse.json(
        { error: 'Необходимо заполнить все обязательные поля' },
        { status: 400 }
      )
    }

    if (!body.weekSchedules || body.weekSchedules.length === 0) {
      console.log('Валидация не прошла - отсутствует расписание недель')
      return NextResponse.json(
        { error: 'Необходимо добавить хотя бы одну неделю расписания' },
        { status: 400 }
      )
    }

    // Валидация дат в расписании недель
    for (const week of body.weekSchedules) {
      if (!week.startDate || !week.endDate) {
        console.log('Валидация не прошла - отсутствуют даты недели:', week)
        return NextResponse.json(
          { error: 'Необходимо заполнить даты начала и окончания для всех недель' },
          { status: 400 }
        )
      }
      
      // Проверяем валидность дат
      const startDate = new Date(week.startDate)
      const endDate = new Date(week.endDate)
      
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        console.log('Валидация не прошла - неверные даты недели:', week)
        return NextResponse.json(
          { error: 'Неверный формат дат в расписании недель' },
          { status: 400 }
        )
      }
      
      // Проверяем даты дней недели
      for (const day of week.weekDays) {
        if (!day.startTime || !day.endTime) {
          console.log('Валидация не прошла - отсутствует время дня:', day)
          return NextResponse.json(
            { error: 'Необходимо заполнить время начала и окончания для всех дней' },
            { status: 400 }
          )
        }
        
        // Проверяем валидность времени
        const startTime = new Date(`2000-01-01T${day.startTime}`)
        const endTime = new Date(`2000-01-01T${day.endTime}`)
        
        if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
          console.log('Валидация не прошла - неверное время дня:', day)
          return NextResponse.json(
            { error: 'Неверный формат времени в расписании дней' },
            { status: 400 }
          )
        }
      }
    }

    // Проверяем, что ученик существует
    const student = await prisma.student.findUnique({
      where: { id: body.studentId }
    })

    if (!student) {
      return NextResponse.json(
        { error: 'Ученик не найден' },
        { status: 404 }
      )
    }

    // Проверяем, что пользователь существует
    const user = await prisma.user.findUnique({
      where: { id: body.userId }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Пользователь не найден' },
        { status: 404 }
      )
    }

    // Вычисляем общую стоимость
    const totalCost = body.weekSchedules.reduce((total: number, week: any) => {
      return total + week.weekDays.reduce((weekTotal: number, day: any) => weekTotal + (parseFloat(day.cost) || 0), 0)
    }, 0)

    // Создаем абонемент с расписанием в транзакции
    console.log('Начинаем создание абонемента в базе данных')
    const subscription = await prisma.$transaction(async (tx) => {
      // Создаем абонемент
      const newSubscription = await (tx as any).flexibleSubscription.create({
        data: {
          name: body.name,
          studentId: body.studentId,
          userId: body.userId,
          startDate: new Date(body.startDate),
          endDate: new Date(body.endDate),
          totalCost,
          paymentStatus: body.paymentStatus || 'UNPAID',
          description: body.description,
          weekSchedules: {
            create: body.weekSchedules.map((week: any) => ({
              weekNumber: week.weekNumber,
              startDate: new Date(week.startDate),
              endDate: new Date(week.endDate),
              weekDays: {
                create: week.weekDays.map((day: any) => ({
                  dayOfWeek: day.dayOfWeek,
                  startTime: new Date(`2000-01-01T${day.startTime}`),
                  endTime: new Date(`2000-01-01T${day.endTime}`),
                  cost: parseFloat(day.cost) || 0,
                  location: day.location || 'office',
                  notes: day.notes
                }))
              }
            }))
          }
        },
        include: {
          student: {
            include: {
              user: true
            }
          },
          user: true,
          weekSchedules: {
            include: {
              weekDays: true
            }
          }
        }
      })

      // Если статус PARTIAL, создаем записи об оплаченных днях
      if (body.paymentStatus === 'PARTIAL' && body.paidDayIds && body.paidDayIds.length > 0) {
        console.log('Создаем записи об оплаченных днях:', body.paidDayIds)
        
        // Получаем все дни абонемента с информацией о неделях
        const allDays = await (tx as any).flexibleSubscriptionDay.findMany({
          where: {
            week: {
              subscriptionId: newSubscription.id
            }
          },
          include: {
            week: true
          },
          orderBy: [
            { week: { weekNumber: 'asc' } },
            { dayOfWeek: 'asc' }
          ]
        })

        // Создаем записи об оплаченных днях на основе позиции в неделе
        const paidDaysData: any[] = []
        
        // Группируем дни по неделям
        const daysByWeek = allDays.reduce((acc: any, day: any) => {
          const weekNumber = day.week.weekNumber
          if (!acc[weekNumber]) {
            acc[weekNumber] = []
          }
          acc[weekNumber].push(day)
          return acc
        }, {})

        // Обрабатываем каждый временный ID
        body.paidDayIds.forEach((tempId: string | number, index: number) => {
          console.log('Обрабатываем tempId:', tempId, 'тип:', typeof tempId, 'индекс:', index)
          
          let weekIndex: number, dayIndex: number
          
          if (typeof tempId === 'string' && tempId.includes('-')) {
            // tempId имеет формат "weekIndex-dayIndex"
            const parts = tempId.split('-').map(Number)
            weekIndex = parts[0]
            dayIndex = parts[1]
          } else if (typeof tempId === 'number') {
            // tempId - это число (timestamp или другой числовой ID)
            // Используем индекс в массиве для определения позиции
            weekIndex = 0 // Всегда первая неделя
            dayIndex = index // Используем индекс в массиве paidDayIds
            console.log(`Числовой tempId, используем позицию ${weekIndex}-${dayIndex} (индекс: ${index})`)
          } else {
            console.log('Неизвестный формат tempId:', tempId)
            return
          }
          
          const weekNumber = weekIndex + 1 // weekIndex начинается с 0, weekNumber с 1
          console.log(`Обрабатываем позицию: weekIndex=${weekIndex}, dayIndex=${dayIndex}, weekNumber=${weekNumber}`)
          
          if (daysByWeek[weekNumber] && daysByWeek[weekNumber][dayIndex]) {
            const day = daysByWeek[weekNumber][dayIndex]
            console.log(`Найден день: ID ${day.id}, день недели ${day.dayOfWeek}`)
            paidDaysData.push({
              subscriptionId: newSubscription.id,
              dayId: day.id,
              isPaid: true,
              paymentAmount: day.cost
            })
          } else {
            console.log(`День не найден для позиции weekNumber=${weekNumber}, dayIndex=${dayIndex}`)
          }
        })

        if (paidDaysData.length > 0) {
          // Удаляем дублирующиеся записи по dayId
          const uniquePaidDaysData = paidDaysData.filter((item, index, self) => 
            index === self.findIndex(t => t.dayId === item.dayId)
          )
          
          if (uniquePaidDaysData.length !== paidDaysData.length) {
            console.log(`Удалено ${paidDaysData.length - uniquePaidDaysData.length} дублирующихся записей`)
          }
          
          await (tx as any).flexibleSubscriptionPaidDay.createMany({
            data: uniquePaidDaysData
          })
          console.log('Создано записей об оплаченных днях:', uniquePaidDaysData.length)
        }
      }

      return newSubscription
    })

    console.log('Абонемент успешно создан:', subscription.id)
    return NextResponse.json(subscription, { status: 201 })
  } catch (error) {
    console.error('Ошибка при создании гибкого абонемента:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}
