import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getAuthUser } from '@/lib/auth'

interface FlexiblePrepaymentData {
  subscriptionId: number;
  amount: number;
  date: string;
  description?: string;
  paidDayIds?: number[]; // ID дней, которые оплачиваются
}

// POST /api/flexible-subscriptions/[id]/prepayment - создать предоплату для гибкого абонемента
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

    // Только администраторы могут создавать предоплаты
    if (authUser.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Доступ запрещен. Только администраторы могут создавать предоплаты.' },
        { status: 403 }
      )
    }

    const resolvedParams = await params
    const subscriptionId = parseInt(resolvedParams.id)
    const body: FlexiblePrepaymentData = await request.json()
    
    console.log('Получены данные для создания предоплаты гибкого абонемента:', JSON.stringify(body, null, 2))
    
    // Валидация обязательных полей
    if (!body.amount || !body.date) {
      return NextResponse.json(
        { error: 'Необходимо заполнить сумму и дату платежа' },
        { status: 400 }
      )
    }

    if (body.amount <= 0) {
      return NextResponse.json(
        { error: 'Сумма должна быть больше 0' },
        { status: 400 }
      )
    }

    // Проверяем, что абонемент существует
    const subscription = await (prisma as any).flexibleSubscription.findUnique({
      where: { id: subscriptionId },
      include: {
        student: true,
        weekSchedules: {
          include: {
            weekDays: {
              include: {
                paidDays: true
              }
            }
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

    // Получаем все дни абонемента
    const allDays = subscription.weekSchedules.flatMap(week => week.weekDays)
    
    // Определяем какие дни оплачиваются
    let daysToPay: any[] = []
    
    if (body.paidDayIds && body.paidDayIds.length > 0) {
      // Частичная оплата - оплачиваем только выбранные дни
      daysToPay = allDays.filter(day => body.paidDayIds!.includes(day.id))
    } else {
      // Полная оплата - оплачиваем все неоплаченные дни
      daysToPay = allDays.filter(day => !day.paidDays.some(pd => pd.isPaid))
    }

    if (daysToPay.length === 0) {
      return NextResponse.json(
        { error: 'Нет дней для оплаты' },
        { status: 400 }
      )
    }

    // Рассчитываем общую стоимость оплачиваемых дней
    const totalCost = daysToPay.reduce((sum, day) => sum + day.cost, 0)

    // Создаем предоплату и обновляем статус в транзакции
    const result = await (prisma as any).$transaction(async (tx) => {
      // Создаем платеж для гибкого абонемента
      const payment = await (tx as any).flexibleSubscriptionPayment.create({
        data: {
          subscriptionId: subscriptionId,
          amount: body.amount,
          date: new Date(body.date),
          description: body.description || `Предоплата за ${daysToPay.length} дней абонемента "${subscription.name}"`
        }
      })

      // Создаем записи об оплаченных днях
      const paidDaysData = daysToPay.map(day => ({
        subscriptionId: subscriptionId,
        dayId: day.id,
        isPaid: true,
        paymentAmount: day.cost
      }))

      await (tx as any).flexibleSubscriptionPaidDay.createMany({
        data: paidDaysData,
        skipDuplicates: true // Пропускаем если уже существует
      })

      // Обновляем статус абонемента
      let newPaymentStatus = subscription.paymentStatus
      
      if (body.paidDayIds && body.paidDayIds.length > 0) {
        // Частичная оплата
        newPaymentStatus = 'PARTIAL'
      } else {
        // Полная оплата
        newPaymentStatus = 'PAID'
      }

      await (tx as any).flexibleSubscription.update({
        where: { id: subscriptionId },
        data: {
          paymentStatus: newPaymentStatus,
          isPaid: newPaymentStatus === 'PAID' // Обновляем старое поле для совместимости
        }
      })

      return {
        payment,
        paidDays: paidDaysData,
        totalCost,
        daysCount: daysToPay.length,
        newPaymentStatus
      }
    })

    return NextResponse.json({
      message: `Предоплата успешно создана. Оплачено ${result.daysCount} дней.`,
      payment: result.payment,
      paidDays: result.paidDays,
      totalCost: result.totalCost,
      daysCount: result.daysCount,
      newPaymentStatus: result.newPaymentStatus
    }, { status: 201 })

  } catch (error) {
    console.error('Ошибка при создании предоплаты для гибкого абонемента:', error)
    return NextResponse.json(
      { error: 'Не удалось создать предоплату' },
      { status: 500 }
    )
  }
}
