import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getAuthUser } from '@/lib/auth'

export async function GET(
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

    if (authUser.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Доступ запрещен' },
        { status: 403 }
      )
    }

    const { id } = await params
    const userId = parseInt(id)

    const user = await prisma.user.findUnique({
      where: { id: userId }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Пользователь не найден' },
        { status: 404 }
      )
    }

    const [
      totalStudents,
      totalLessons,
      completedLessons,
      paidLessons,
      revenueAgg,
      debtAgg
    ] = await Promise.all([
      prisma.student.count({ where: { userId } }),
      prisma.lesson.count({ where: { teacherId: userId } }),
      prisma.lesson.count({ where: { teacherId: userId, isCompleted: true } }),
      prisma.lesson.count({ where: { teacherId: userId, isPaid: true } }),
      prisma.lesson.aggregate({
        where: { teacherId: userId, isPaid: true },
        _sum: { cost: true }
      }),
      prisma.lesson.aggregate({
        where: {
          teacherId: userId,
          isCompleted: true,
          isPaid: false
        },
        _sum: { cost: true }
      })
    ])

    return NextResponse.json({
      totalStudents,
      totalLessons,
      completedLessons,
      paidLessons,
      totalRevenue: revenueAgg._sum.cost ?? 0,
      totalDebt: debtAgg._sum.cost ?? 0
    })
  } catch (error) {
    console.error('Ошибка получения статистики пользователя:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}
