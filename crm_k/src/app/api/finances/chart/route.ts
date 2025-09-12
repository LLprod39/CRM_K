import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getAuthUser } from '@/lib/auth'

// GET /api/finances/chart - получить данные для графика доходов по дням
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
          dateFrom.setDate(now.getDate() - 7)
          dateFrom.setHours(0, 0, 0, 0)
          break
        case 'month':
          dateFrom = new Date(now)
          dateFrom.setDate(now.getDate() - 30)
          dateFrom.setHours(0, 0, 0, 0)
          break
        case 'year':
          dateFrom = new Date(now.getFullYear(), 0, 1)
          dateTo = new Date(now.getFullYear(), 11, 31, 23, 59, 59)
          break
        default:
          dateFrom = new Date(now)
          dateFrom.setDate(now.getDate() - 30)
          dateFrom.setHours(0, 0, 0, 0)
      }
    }

    // Базовые условия для фильтрации
    const baseWhere = authUser.role === 'ADMIN' 
      ? {} 
      : {
          teacherId: authUser.id
        }

    // Получаем оплаченные занятия за период
    const paidLessons = await prisma.lesson.findMany({
      where: {
        ...baseWhere,
        isCompleted: true,
        isPaid: true,
        isCancelled: false,
        date: {
          gte: dateFrom,
          lte: dateTo
        }
      },
      select: {
        date: true,
        cost: true
      }
    })

    // Группируем данные по дням
    const dailyData = new Map<string, { revenue: number, lessons: number }>()
    
    // Инициализируем все дни в периоде нулевыми значениями
    const currentDate = new Date(dateFrom)
    while (currentDate <= dateTo) {
      const dateKey = currentDate.toISOString().split('T')[0]
      dailyData.set(dateKey, { revenue: 0, lessons: 0 })
      currentDate.setDate(currentDate.getDate() + 1)
    }

    // Заполняем реальными данными
    paidLessons.forEach(lesson => {
      const dateKey = lesson.date.toISOString().split('T')[0]
      const existing = dailyData.get(dateKey) || { revenue: 0, lessons: 0 }
      dailyData.set(dateKey, {
        revenue: existing.revenue + lesson.cost,
        lessons: existing.lessons + 1
      })
    })

    // Преобразуем в массив для графика
    const chartData = Array.from(dailyData.entries())
      .map(([date, data]) => ({
        date: new Date(date).toLocaleDateString('ru-RU', { 
          month: 'short', 
          day: 'numeric' 
        }),
        revenue: data.revenue,
        lessons: data.lessons
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

    return NextResponse.json(chartData)
  } catch (error) {
    console.error('Ошибка при получении данных графика:', error)
    return NextResponse.json(
      { error: 'Не удалось получить данные графика' },
      { status: 500 }
    )
  }
}
