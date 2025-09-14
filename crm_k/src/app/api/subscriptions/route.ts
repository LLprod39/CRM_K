import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getAuthUser } from '@/lib/auth'

// GET /api/subscriptions - получить все абонементы (обычные и гибкие)
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

    // Получаем гибкие абонементы
    const flexibleSubscriptions = await (prisma as any).flexibleSubscription.findMany({
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

    // Получаем обычные абонементы (предоплаты)
    console.log('Ищем обычные абонементы с фильтром:', whereClause);
    const regularSubscriptions = await prisma.payment.findMany({
      where: {
        ...whereClause,
        type: 'prepayment' // Только предоплаты считаются абонементами
      },
      include: {
        student: {
          include: {
            user: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })
    console.log('Найдено обычных абонементов:', regularSubscriptions.length);

    // Объединяем результаты
    const allSubscriptions = [
      ...flexibleSubscriptions.map((sub: any) => ({
        id: sub.id,
        type: 'flexible',
        name: sub.name,
        student: sub.student,
        teacher: sub.user,
        startDate: sub.startDate,
        endDate: sub.endDate,
        totalCost: sub.totalCost,
        isPaid: sub.isPaid,
        description: sub.description,
        createdAt: sub.createdAt,
        weekSchedules: sub.weekSchedules,
        payments: sub.payments
      })),
      ...regularSubscriptions.map((payment: any) => ({
        id: `regular_${payment.id}`,
        type: 'regular',
        name: `Обычный абонемент`,
        student: payment.student,
        teacher: null, // У обычных абонементов нет прямого указания учителя
        startDate: (payment as any).period?.startDate || payment.date,
        endDate: (payment as any).period?.endDate || payment.date,
        totalCost: payment.amount,
        isPaid: true, // Предоплаты всегда считаются оплаченными
        description: payment.description,
        createdAt: payment.createdAt,
        weekSchedules: [],
        payments: [payment]
      }))
    ]

    // Сортируем по дате создания
    allSubscriptions.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

    return NextResponse.json(allSubscriptions)
  } catch (error) {
    console.error('Ошибка при получении абонементов:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}
