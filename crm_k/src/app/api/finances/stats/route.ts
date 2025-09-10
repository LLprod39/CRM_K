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
      isCompleted: true,
      isPaid: true,
      isCancelled: false
    } : {
      ...baseWhere,
      isCompleted: true,
      isPaid: true,
      isCancelled: false
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


    // Подсчитываем задолженности (проведенные, но не оплаченные занятия)
    const debtLessons = await prisma.lesson.findMany({
      where: {
        ...baseWhere,
        isCompleted: true,
        isPaid: false,
        isCancelled: false
      }
    })

    // Подсчитываем предоплаченные занятия (не проведенные, но оплаченные)
    const prepaidLessons = await prisma.lesson.findMany({
      where: {
        ...baseWhere,
        isCompleted: false,
        isPaid: true,
        isCancelled: false
      }
    })

    const totalDebt = debtLessons.reduce((sum, lesson) => sum + lesson.cost, 0)
    const totalPrepaid = prepaidLessons.reduce((sum, lesson) => sum + lesson.cost, 0)

    // Получаем все занятия для статистики по статусам
    const allLessons = await prisma.lesson.findMany({
      where: baseWhere
    })

    // Группируем по статусам вручную
    const statusGroups = {
      scheduled: allLessons.filter(l => !l.isCompleted && !l.isPaid && !l.isCancelled),
      completed: allLessons.filter(l => l.isCompleted && !l.isPaid && !l.isCancelled),
      paid: allLessons.filter(l => l.isCompleted && l.isPaid && !l.isCancelled),
      cancelled: allLessons.filter(l => l.isCancelled),
      prepaid: allLessons.filter(l => !l.isCompleted && l.isPaid && !l.isCancelled),
      unpaid: allLessons.filter(l => l.isCompleted && !l.isPaid && !l.isCancelled)
    }

    const statusStats = Object.entries(statusGroups).map(([status, lessons]) => ({
      status: status as 'scheduled' | 'completed' | 'paid' | 'cancelled' | 'prepaid' | 'unpaid',
      count: lessons.length,
      totalCost: lessons.reduce((sum, lesson) => sum + lesson.cost, 0)
    }))

    const stats = {
      totalRevenue,
      weeklyRevenue: period === 'week' ? totalRevenue : 0,
      dailyRevenue: period === 'day' ? totalRevenue : 0,
      completedLessons: statusGroups.completed.length,
      totalDebt,
      totalPrepaid,
      prepaidLessons: statusGroups.prepaid.length,
      userRevenue,
      statusStats
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
