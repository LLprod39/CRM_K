import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getAuthUser } from '@/lib/auth'
import { CreateFlexibleSubscriptionData } from '@/types'

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
            weekDays: true
          }
        },
        payments: true
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

    const body: CreateFlexibleSubscriptionData = await request.json()
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
    const totalCost = body.weekSchedules.reduce((total, week) => {
      return total + week.weekDays.reduce((weekTotal, day) => weekTotal + day.cost, 0)
    }, 0)

    // Создаем абонемент с расписанием
    console.log('Начинаем создание абонемента в базе данных')
    const subscription = await (prisma as any).flexibleSubscription.create({
      data: {
        name: body.name,
        studentId: body.studentId,
        userId: body.userId,
        startDate: new Date(body.startDate),
        endDate: new Date(body.endDate),
        totalCost,
        description: body.description,
        weekSchedules: {
          create: body.weekSchedules.map(week => ({
            weekNumber: week.weekNumber,
            startDate: new Date(week.startDate),
            endDate: new Date(week.endDate),
            weekDays: {
              create: week.weekDays.map(day => ({
                dayOfWeek: day.dayOfWeek,
                startTime: new Date(day.startTime),
                endTime: new Date(day.endTime),
                cost: day.cost,
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
