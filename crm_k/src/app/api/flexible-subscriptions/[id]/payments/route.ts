import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getAuthUser } from '@/lib/auth'

// GET /api/flexible-subscriptions/[id]/payments - получить платежи по абонементу
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

    // Проверяем существование абонемента и права доступа
    const subscription = await prisma.flexibleSubscription.findUnique({
      where: { id: subscriptionId }
    })

    if (!subscription) {
      return NextResponse.json(
        { error: 'Абонемент не найден' },
        { status: 404 }
      )
    }

    if (authUser.role !== 'ADMIN' && subscription.userId !== authUser.id) {
      return NextResponse.json(
        { error: 'Доступ запрещен' },
        { status: 403 }
      )
    }

    const payments = await prisma.flexibleSubscriptionPayment.findMany({
      where: { subscriptionId },
      orderBy: { date: 'desc' }
    })

    return NextResponse.json(payments)
  } catch (error) {
    console.error('Ошибка при получении платежей по абонементу:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}

// POST /api/flexible-subscriptions/[id]/payments - добавить платеж по абонементу
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

    // Только администраторы могут добавлять платежи
    if (authUser.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Доступ запрещен. Только администраторы могут добавлять платежи.' },
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

    const body = await request.json()
    
    // Валидация обязательных полей
    if (!body.amount || !body.date) {
      return NextResponse.json(
        { error: 'Необходимо указать сумму и дату платежа' },
        { status: 400 }
      )
    }

    // Проверяем существование абонемента
    const subscription = await prisma.flexibleSubscription.findUnique({
      where: { id: subscriptionId }
    })

    if (!subscription) {
      return NextResponse.json(
        { error: 'Абонемент не найден' },
        { status: 404 }
      )
    }

    // Создаем платеж
    const payment = await prisma.flexibleSubscriptionPayment.create({
      data: {
        subscriptionId,
        amount: parseFloat(body.amount),
        date: new Date(body.date),
        description: body.description || `Платеж по абонементу "${subscription.name}"`
      }
    })

    // Проверяем, полностью ли оплачен абонемент
    const totalPaid = await prisma.flexibleSubscriptionPayment.aggregate({
      where: { subscriptionId },
      _sum: { amount: true }
    })

    const isFullyPaid = (totalPaid._sum.amount || 0) >= subscription.totalCost

    // Обновляем статус оплаты абонемента
    if (isFullyPaid && !subscription.isPaid) {
      await prisma.flexibleSubscription.update({
        where: { id: subscriptionId },
        data: { isPaid: true }
      })
    }

    return NextResponse.json(payment, { status: 201 })
  } catch (error) {
    console.error('Ошибка при добавлении платежа по абонементу:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}
