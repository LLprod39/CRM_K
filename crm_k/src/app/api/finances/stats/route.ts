import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getAuthUser } from '@/lib/auth'

// GET /api/finances/stats - получить финансовую статистику
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
    const period = searchParams.get('period') || 'all' // all, month, week, day

    const now = new Date()
    let dateFrom: Date | undefined

    switch (period) {
      case 'day':
        dateFrom = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        break
      case 'week':
        const weekStart = new Date(now)
        weekStart.setDate(now.getDate() - now.getDay())
        weekStart.setHours(0, 0, 0, 0)
        dateFrom = weekStart
        break
      case 'month':
        dateFrom = new Date(now.getFullYear(), now.getMonth(), 1)
        break
    }

    // Базовые условия для фильтрации
    const baseWhere = authUser.role === 'ADMIN' 
      ? {} 
      : {
          student: {
            userId: authUser.id
          }
        }

    const whereClause = dateFrom ? {
      ...baseWhere,
      date: {
        gte: dateFrom
      },
      status: 'PAID' as const
    } : {
      ...baseWhere,
      status: 'PAID' as const
    }

    // Получаем статистику по оплаченным занятиям
    const paidLessons = await prisma.lesson.findMany({
      where: whereClause,
      include: {
        student: true
      }
    })

    // Подсчитываем общую выручку (70% от оплаченных уроков)
    const totalRevenue = paidLessons.reduce((sum, lesson) => sum + (lesson.cost * 0.7), 0)
    
    // Подсчитываем доход от пользователя (30% от оплаченных уроков)
    const userRevenue = paidLessons.reduce((sum, lesson) => sum + (lesson.cost * 0.3), 0)

    // Статистика по месяцам (закомментировано, так как не используется)
    // const monthlyStats = await prisma.lesson.groupBy({
    //   by: ['date'],
    //   where: {
    //     status: 'PAID',
    //     date: {
    //       gte: new Date(now.getFullYear(), now.getMonth(), 1)
    //     }
    //   },
    //   _sum: {
    //     cost: true
    //   },
    //   _count: {
    //     id: true
    //   }
    // })


    // Подсчитываем задолженности (занятия со статусом UNPAID или COMPLETED)
    const debtLessons = await prisma.lesson.findMany({
      where: {
        ...baseWhere,
        status: {
          in: ['UNPAID', 'COMPLETED']
        }
      }
    })

    // Подсчитываем предоплаченные занятия (не учитываются в финансах)
    const prepaidLessons = await prisma.lesson.findMany({
      where: {
        ...baseWhere,
        status: 'PREPAID'
      }
    })

    const totalDebt = debtLessons.reduce((sum, lesson) => sum + lesson.cost, 0)
    const totalPrepaid = prepaidLessons.reduce((sum, lesson) => sum + lesson.cost, 0)

    // Статистика по статусам
    const statusStats = await prisma.lesson.groupBy({
      by: ['status'],
      where: baseWhere,
      _count: {
        id: true
      },
      _sum: {
        cost: true
      }
    })

    const stats = {
      totalRevenue,
      weeklyRevenue: period === 'week' ? totalRevenue : 0,
      dailyRevenue: period === 'day' ? totalRevenue : 0,
      completedLessons: statusStats.find(s => s.status === 'COMPLETED')?._count.id || 0,
      totalDebt,
      totalPrepaid,
      prepaidLessons: statusStats.find(s => s.status === 'PREPAID')?._count.id || 0,
      userRevenue,
      statusStats: statusStats.map(stat => ({
        status: stat.status,
        count: stat._count.id,
        totalCost: stat._sum.cost || 0
      }))
    }

    return NextResponse.json(stats)
  } catch (error) {
    console.error('Ошибка при получении финансовой статистики:', error)
    return NextResponse.json(
      { error: 'Не удалось получить финансовую статистику' },
      { status: 500 }
    )
  }
}
