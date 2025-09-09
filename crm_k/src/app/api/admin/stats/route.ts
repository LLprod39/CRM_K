import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { getAuthUser } from '@/lib/auth'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    // Проверяем аутентификацию
    const authUser = getAuthUser(request)
    if (!authUser || authUser.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Доступ запрещен' },
        { status: 403 }
      )
    }

    // Получаем общую статистику
    const [
      totalUsers,
      totalStudents,
      totalLessons,
      totalRevenue,
      recentUsers,
      recentStudents,
      recentLessons
    ] = await Promise.all([
      prisma.user.count(),
      prisma.student.count(),
      prisma.lesson.count(),
      prisma.lesson.aggregate({
        where: {
          status: {
            in: ['COMPLETED', 'PAID']
          }
        },
        _sum: {
          cost: true
        }
      }),
      prisma.user.findMany({
        take: 5,
        orderBy: {
          createdAt: 'desc'
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true
        }
      }),
      prisma.student.findMany({
        take: 5,
        orderBy: {
          createdAt: 'desc'
        },
        include: {
          user: {
            select: {
              name: true,
              email: true
            }
          }
        }
      }),
      prisma.lesson.findMany({
        take: 10,
        orderBy: {
          createdAt: 'desc'
        },
        include: {
          student: {
            select: {
              fullName: true
            }
          }
        }
      })
    ])

    const stats = {
      totalUsers,
      totalStudents,
      totalLessons,
      totalRevenue: totalRevenue._sum.cost || 0,
      recentUsers,
      recentStudents,
      recentLessons
    }

    return NextResponse.json(stats)
  } catch (error) {
    console.error('Ошибка получения админ статистики:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
