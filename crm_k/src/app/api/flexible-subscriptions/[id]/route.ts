import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getAuthUser } from '@/lib/auth'

// GET /api/flexible-subscriptions/[id] - получить конкретный гибкий абонемент
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

    const subscription = await prisma.flexibleSubscription.findUnique({
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
    if (authUser.role !== 'ADMIN' && subscription.userId !== authUser.id) {
      return NextResponse.json(
        { error: 'Доступ запрещен' },
        { status: 403 }
      )
    }

    return NextResponse.json(subscription)
  } catch (error) {
    console.error('Ошибка при получении гибкого абонемента:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}

// PUT /api/flexible-subscriptions/[id] - обновить гибкий абонемент
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

    const subscriptionId = parseInt(params.id)
    if (isNaN(subscriptionId)) {
      return NextResponse.json(
        { error: 'Неверный ID абонемента' },
        { status: 400 }
      )
    }

    // Проверяем существование абонемента
    const existingSubscription = await prisma.flexibleSubscription.findUnique({
      where: { id: subscriptionId }
    })

    if (!existingSubscription) {
      return NextResponse.json(
        { error: 'Абонемент не найден' },
        { status: 404 }
      )
    }

    // Проверяем права доступа
    if (authUser.role !== 'ADMIN' && existingSubscription.userId !== authUser.id) {
      return NextResponse.json(
        { error: 'Доступ запрещен' },
        { status: 403 }
      )
    }

    const body = await request.json()
    
    // Обновляем только основные поля абонемента
    const updatedSubscription = await prisma.flexibleSubscription.update({
      where: { id: subscriptionId },
      data: {
        name: body.name,
        description: body.description,
        isPaid: body.isPaid
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
        },
        payments: true
      }
    })

    return NextResponse.json(updatedSubscription)
  } catch (error) {
    console.error('Ошибка при обновлении гибкого абонемента:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}

// DELETE /api/flexible-subscriptions/[id] - удалить гибкий абонемент
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

    // Проверяем существование абонемента
    const existingSubscription = await prisma.flexibleSubscription.findUnique({
      where: { id: subscriptionId }
    })

    if (!existingSubscription) {
      return NextResponse.json(
        { error: 'Абонемент не найден' },
        { status: 404 }
      )
    }

    // Удаляем абонемент (каскадное удаление удалит связанные записи)
    await prisma.flexibleSubscription.delete({
      where: { id: subscriptionId }
    })

    return NextResponse.json({ message: 'Абонемент успешно удален' })
  } catch (error) {
    console.error('Ошибка при удалении гибкого абонемента:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}
