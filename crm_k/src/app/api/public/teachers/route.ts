import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// GET /api/public/teachers - получить публичную информацию об учителях
export async function GET(request: NextRequest) {
  try {
    const teachers = await prisma.user.findMany({
      where: {
        role: 'USER' // Только учителя, не админы
      },
      select: {
        id: true,
        name: true,
        // Не включаем email для публичного доступа
        createdAt: true,
        _count: {
          select: {
            students: true,
            lessons: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Добавляем дополнительную информацию для каждого учителя
    const teachersWithStats = await Promise.all(
      teachers.map(async (teacher) => {
        // Получаем статистику занятий учителя
        const completedLessons = await prisma.lesson.count({
          where: {
            teacherId: teacher.id,
            isCompleted: true,
            isCancelled: false
          }
        })

        const upcomingLessons = await prisma.lesson.count({
          where: {
            teacherId: teacher.id,
            isCompleted: false,
            isCancelled: false,
            date: {
              gte: new Date()
            }
          }
        })

        return {
          ...teacher,
          stats: {
            completedLessons,
            upcomingLessons,
            totalStudents: teacher._count.students
          }
        }
      })
    )

    return NextResponse.json(teachersWithStats)
  } catch (error) {
    console.error('Ошибка получения публичной информации об учителях:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}

