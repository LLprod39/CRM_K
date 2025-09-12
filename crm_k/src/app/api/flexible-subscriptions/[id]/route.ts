import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getAuthUser } from '@/lib/auth'
import { CreateFlexibleSubscriptionData } from '@/types'

// GET /api/flexible-subscriptions/[id] - получить конкретный абонемент
export async function GET(
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

    const subscriptionId = parseInt(params.id)
    if (isNaN(subscriptionId)) {
      return NextResponse.json(
        { error: 'Неверный ID абонемента' },
        { status: 400 }
      )
    }

    const subscription = await (prisma as any).flexibleSubscription.findUnique({
      where: { id: subscriptionId },
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
      }
    })

    if (!subscription) {
      return NextResponse.json(
        { error: 'Абонемент не найден' },
        { status: 404 }
      )
    }

    // Проверяем права доступа
    if (authUser.role !== 'ADMIN') {
      // Проверяем, есть ли у пользователя занятия с этим учеником
      const hasLessons = await (prisma as any).lesson.findFirst({
        where: {
          studentId: subscription.studentId,
          teacherId: authUser.id
        }
      })

      if (!hasLessons) {
        return NextResponse.json(
          { error: 'Доступ запрещен' },
          { status: 403 }
        )
      }
    }

    return NextResponse.json(subscription)
  } catch (error) {
    console.error('Ошибка при получении абонемента:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}

// PUT /api/flexible-subscriptions/[id] - обновить абонемент
export async function PUT(
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

    // Только администраторы могут редактировать абонементы
    if (authUser.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Доступ запрещен. Только администраторы могут редактировать абонементы.' },
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

    // Проверяем, что абонемент существует
    const existingSubscription = await (prisma as any).flexibleSubscription.findUnique({
      where: { id: subscriptionId }
    })

    if (!existingSubscription) {
      return NextResponse.json(
        { error: 'Абонемент не найден' },
        { status: 404 }
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

    // Удаляем старые расписания и создаем новые
    await (prisma as any).flexibleSubscriptionWeek.deleteMany({
      where: { subscriptionId }
    })

    // Обновляем абонемент
    const subscription = await (prisma as any).flexibleSubscription.update({
      where: { id: subscriptionId },
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

    return NextResponse.json(subscription)
  } catch (error) {
    console.error('Ошибка при обновлении абонемента:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}

// DELETE /api/flexible-subscriptions/[id] - удалить абонемент
export async function DELETE(
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

    // Только администраторы могут удалять абонементы
    if (authUser.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Доступ запрещен. Только администраторы могут удалять абонементы.' },
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

    // Проверяем, что абонемент существует
    const existingSubscription = await (prisma as any).flexibleSubscription.findUnique({
      where: { id: subscriptionId }
    })

    if (!existingSubscription) {
      return NextResponse.json(
        { error: 'Абонемент не найден' },
        { status: 404 }
      )
    }

    // Удаляем абонемент (каскадное удаление удалит связанные записи)
    await (prisma as any).flexibleSubscription.delete({
      where: { id: subscriptionId }
    })

    return NextResponse.json({ message: 'Абонемент успешно удален' })
  } catch (error) {
    console.error('Ошибка при удалении абонемента:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}