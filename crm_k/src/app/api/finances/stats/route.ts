import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// GET /api/finances/stats - получить финансовую статистику
export async function GET(request: NextRequest) {
  try {
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

    const whereClause = dateFrom ? {
      date: {
        gte: dateFrom
      },
      status: 'PAID' as const
    } : {
      status: 'PAID' as const
    }

    // Получаем статистику по оплаченным занятиям
    const paidLessons = await prisma.lesson.findMany({
      where: whereClause,
      include: {
        student: true
      }
    })

    // Подсчитываем общую выручку
    const totalRevenue = paidLessons.reduce((sum, lesson) => sum + lesson.cost, 0)

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

    // Статистика по ученикам
    const studentStats = await prisma.lesson.groupBy({
      by: ['studentId'],
      where: {
        status: 'PAID'
      },
      _sum: {
        cost: true
      },
      _count: {
        id: true
      }
    })

    // Получаем информацию об учениках для статистики
    const topStudents = await Promise.all(
      studentStats
        .sort((a, b) => (b._sum.cost || 0) - (a._sum.cost || 0))
        .slice(0, 5)
        .map(async (stat) => {
          const student = await prisma.student.findUnique({
            where: { id: stat.studentId }
          })
          return {
            student,
            totalPaid: stat._sum.cost || 0,
            lessonsCount: stat._count.id
          }
        })
    )

    // Подсчитываем задолженности (занятия со статусом COMPLETED, но не PAID)
    const debtLessons = await prisma.lesson.findMany({
      where: {
        status: 'COMPLETED'
      }
    })

    const totalDebt = debtLessons.reduce((sum, lesson) => sum + lesson.cost, 0)

    // Статистика по статусам
    const statusStats = await prisma.lesson.groupBy({
      by: ['status'],
      _count: {
        id: true
      },
      _sum: {
        cost: true
      }
    })

    const stats = {
      totalRevenue,
      monthlyRevenue: period === 'month' ? totalRevenue : 0,
      weeklyRevenue: period === 'week' ? totalRevenue : 0,
      dailyRevenue: period === 'day' ? totalRevenue : 0,
      completedLessons: statusStats.find(s => s.status === 'COMPLETED')?._count.id || 0,
      totalDebt,
      topStudents: topStudents.filter(item => item.student !== null),
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
