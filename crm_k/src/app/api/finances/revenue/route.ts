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

    const lessonWhere: Record<string, unknown> = {
      ...baseWhere,
      isCompleted: true,
      isPaid: true,
      isCancelled: false
    }

    if (dateRange.gte || dateRange.lte) {
      lessonWhere.date = dateRange
    }

    const lessons = await prisma.lesson.findMany({
      where: lessonWhere as any,
      select: {
        date: true,
        cost: true
      }
    })

    const revenueMap = new Map<string, number>()

    for (const lesson of lessons) {
      const key = lesson.date.toISOString().split('T')[0]
      const current = revenueMap.get(key) || 0
      revenueMap.set(key, current + lesson.cost)
    }

    const chartData = Array.from(revenueMap.entries())
      .map(([date, revenue]) => ({ date, revenue }))
      .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0))

    return NextResponse.json(chartData)
  } catch (error) {
    console.error('Ошибка при получении данных по выручке:', error)
    return NextResponse.json(
      { error: 'Не удалось получить данные по выручке' },
      { status: 500 }
    )
  }
}
