import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { PeriodStats } from '@/types'

// GET /api/finances/period - получить статистику за период
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || 'month'
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    let dateFrom: Date
    let dateTo: Date = new Date()

    if (startDate && endDate) {
      // Кастомный период
      dateFrom = new Date(startDate)
      dateTo = new Date(endDate)
    } else {
      // Предустановленные периоды
      const now = new Date()
      
      switch (period) {
        case 'day':
          dateFrom = new Date(now.getFullYear(), now.getMonth(), now.getDate())
          dateTo = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59)
          break
        case 'week':
          dateFrom = new Date(now)
          dateFrom.setDate(now.getDate() - now.getDay())
          dateFrom.setHours(0, 0, 0, 0)
          dateTo = new Date(dateFrom)
          dateTo.setDate(dateFrom.getDate() + 6)
          dateTo.setHours(23, 59, 59)
          break
        case 'month':
          dateFrom = new Date(now.getFullYear(), now.getMonth(), 1)
          dateTo = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)
          break
        case 'year':
          dateFrom = new Date(now.getFullYear(), 0, 1)
          dateTo = new Date(now.getFullYear(), 11, 31, 23, 59, 59)
          break
        default:
          dateFrom = new Date(now.getFullYear(), now.getMonth(), 1)
          dateTo = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)
      }
    }

    // Получаем оплаченные занятия за период
    const paidLessons = await prisma.lesson.findMany({
      where: {
        status: 'PAID',
        date: {
          gte: dateFrom,
          lte: dateTo
        }
      }
    })

    const revenue = paidLessons.reduce((sum, lesson) => sum + lesson.cost, 0)
    const lessonsCount = paidLessons.length
    const averageCheck = lessonsCount > 0 ? revenue / lessonsCount : 0

    const stats: PeriodStats = {
      period: startDate && endDate ? 'custom' : (period as 'day' | 'week' | 'month' | 'year'),
      startDate: dateFrom,
      endDate: dateTo,
      revenue,
      lessonsCount,
      averageCheck
    }

    return NextResponse.json(stats)
  } catch (error) {
    console.error('Ошибка при получении статистики за период:', error)
    return NextResponse.json(
      { error: 'Не удалось получить статистику за период' },
      { status: 500 }
    )
  }
}
