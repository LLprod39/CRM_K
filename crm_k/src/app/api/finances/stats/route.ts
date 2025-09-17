import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getAuthUser } from '@/lib/auth'
import { buildDateRange } from '../utils'

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
    const dateRange = buildDateRange(searchParams)

    const baseWhere = authUser.role === 'ADMIN' ? {} : { teacherId: authUser.id }

    const lessonWhere: Record<string, unknown> = { ...baseWhere }
    if (dateRange.gte || dateRange.lte) {
      lessonWhere.date = dateRange
    }

    const paidLessons = await prisma.lesson.findMany({
      where: {
        ...lessonWhere,
        isCompleted: true,
        isPaid: true,
        isCancelled: false
      },
      select: {
        cost: true
      }
    })

    const totalRevenue = paidLessons.reduce((sum, lesson) => sum + lesson.cost, 0)

    const debtLessons = await prisma.lesson.findMany({
      where: {
        ...lessonWhere,
        isCompleted: true,
        isPaid: false,
        isCancelled: false
      },
      select: {
        cost: true
      }
    })

    const prepaidLessons = await prisma.lesson.findMany({
      where: {
        ...lessonWhere,
        isCompleted: false,
        isPaid: true,
        isCancelled: false
      },
      select: {
        cost: true
      }
    })

    const allLessons = await prisma.lesson.findMany({
      where: lessonWhere as any
    })

    const statusGroups = {
      scheduled: allLessons.filter(l => !l.isCompleted && !l.isPaid && !l.isCancelled),
      prepaid: allLessons.filter(l => !l.isCompleted && l.isPaid && !l.isCancelled),
      cancelled: allLessons.filter(l => l.isCancelled),
      completed: allLessons.filter(l => l.isCompleted && l.isPaid && !l.isCancelled),
      debt: allLessons.filter(l => l.isCompleted && !l.isPaid && !l.isCancelled),
      unpaid: allLessons.filter(l => !l.isCompleted && !l.isPaid && !l.isCancelled)
    }

    const statusStats = Object.entries(statusGroups).map(([status, lessons]) => ({
      status: status as 'scheduled' | 'prepaid' | 'cancelled' | 'completed' | 'debt' | 'unpaid',
      count: lessons.length,
      totalCost: lessons.reduce((sum, lesson) => sum + lesson.cost, 0)
    }))

    const stats = {
      totalRevenue,
      completedLessons: statusGroups.completed.length,
      totalDebt: debtLessons.reduce((sum, lesson) => sum + lesson.cost, 0),
      totalPrepaid: prepaidLessons.reduce((sum, lesson) => sum + lesson.cost, 0),
      prepaidLessons: statusGroups.prepaid.length,
      userRevenue: totalRevenue,
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
