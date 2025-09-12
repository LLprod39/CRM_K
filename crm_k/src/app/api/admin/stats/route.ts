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
      recentLessons,
      allUsers
    ] = await Promise.all([
      prisma.user.count(),
      prisma.student.count(),
      prisma.lesson.count(),
      prisma.lesson.aggregate({
        where: {
          OR: [
            { isCompleted: true, isPaid: true },
            { isPaid: true }
          ]
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
      }),
      // Получаем всех пользователей с детальной статистикой
      prisma.user.findMany({
        include: {
          students: {
            include: {
              lessons: true,
              payments: true
            }
          },
          lessons: true, // Занятия, которые проводил этот учитель
          _count: {
            select: {
              students: true,
              lessons: true
            }
          }
        } as any,
        orderBy: {
          createdAt: 'desc'
        }
      })
    ])

    // Обрабатываем данные пользователей для детальной статистики
    const usersWithStats = allUsers.map((user: any) => {
      // Используем занятия, которые проводил этот учитель (по teacherId)
      const allLessons = user.lessons || []
      const completedLessons = allLessons.filter((lesson: any) => lesson.isCompleted)
      const paidLessons = allLessons.filter((lesson: any) => lesson.isPaid)
      const scheduledLessons = allLessons.filter((lesson: any) => !lesson.isCompleted && !lesson.isCancelled)
      const cancelledLessons = allLessons.filter((lesson: any) => lesson.isCancelled)
      
      const totalRevenue = allLessons
        .filter((lesson: any) => lesson.isPaid)
        .reduce((sum: number, lesson: any) => sum + lesson.cost, 0)
      
      const totalDebt = allLessons
        .filter((lesson: any) => lesson.isCompleted && !lesson.isPaid)
        .reduce((sum: number, lesson: any) => sum + lesson.cost, 0)
      
      const totalPrepaid = allLessons
        .filter((lesson: any) => lesson.isPaid && !lesson.isCompleted)
        .reduce((sum: number, lesson: any) => sum + lesson.cost, 0)

      return {
        ...user,
        stats: {
          totalStudents: user._count.students,
          totalLessons: user._count.lessons, // Занятия, которые проводил этот учитель
          completedLessons: completedLessons.length,
          paidLessons: paidLessons.length,
          scheduledLessons: scheduledLessons.length,
          cancelledLessons: cancelledLessons.length,
          totalRevenue,
          totalDebt,
          totalPrepaid,
          lastActivity: allLessons.length > 0 
            ? Math.max(...allLessons.map((l: any) => l.createdAt.getTime()))
            : user.createdAt.getTime()
        }
      }
    })

    const stats = {
      totalUsers,
      totalStudents,
      totalLessons,
      totalRevenue: totalRevenue._sum.cost || 0,
      recentUsers,
      recentStudents,
      recentLessons,
      usersWithStats
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
