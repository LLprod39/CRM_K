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
      whereClause.userId = authUser.id
    }
    
    if (studentId) {
      whereClause.studentId = parseInt(studentId)
    }

    const subscriptions = await prisma.flexibleSubscription.findMany({
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
    const authUser = getAuthUser(request)
    if (!authUser) {
      return NextResponse.json(
        { error: 'Необходима аутентификация' },
        { status: 401 }
      )
    }

    // Только администраторы могут создавать абонементы
    if (authUser.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Доступ запрещен. Только администраторы могут создавать абонементы.' },
        { status: 403 }
      )
    }

    const body: CreateFlexibleSubscriptionData = await request.json()
    
    // Валидация обязательных полей
    if (!body.name || !body.studentId || !body.userId || !body.startDate || !body.endDate) {
      return NextResponse.json(
        { error: 'Необходимо заполнить все обязательные поля' },
        { status: 400 }
      )
    }

    if (!body.weekSchedules || body.weekSchedules.length === 0) {
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
    const subscription = await prisma.flexibleSubscription.create({
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

    return NextResponse.json(subscription, { status: 201 })
  } catch (error) {
    console.error('Ошибка при создании гибкого абонемента:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}
