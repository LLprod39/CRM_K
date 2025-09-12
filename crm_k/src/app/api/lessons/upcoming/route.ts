import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getAuthUser } from '@/lib/auth'

// GET /api/lessons/upcoming - получить предстоящие занятия для конкретного ученика
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
    const studentId = searchParams.get('studentId')

    if (!studentId) {
      return NextResponse.json(
        { error: 'ID ученика обязателен' },
        { status: 400 }
      )
    }

    // Проверяем, что ученик существует и принадлежит пользователю
    const student = await prisma.student.findUnique({
      where: { id: parseInt(studentId) },
      include: { user: true }
    })

    if (!student) {
      return NextResponse.json(
        { error: 'Ученик не найден' },
        { status: 404 }
      )
    }

    // Если не админ, проверяем, что у пользователя есть занятия с этим учеником
    if (authUser.role !== 'ADMIN') {
      const hasLessonsWithStudent = await prisma.lesson.findFirst({
        where: {
          studentId: parseInt(studentId),
          teacherId: authUser.id
        } as any
      })
      
      if (!hasLessonsWithStudent) {
        return NextResponse.json(
          { error: 'Доступ запрещен' },
          { status: 403 }
        )
      }
    }

    // Получаем предстоящие занятия (не завершенные, не отмененные, дата >= сегодня)
    const now = new Date()
    now.setHours(0, 0, 0, 0) // Сбрасываем время для сравнения только по дате

    const upcomingLessons = await prisma.lesson.findMany({
      where: {
        studentId: parseInt(studentId),
        isCompleted: false,
        isCancelled: false,
        date: {
          gte: now
        }
      },
      include: {
        student: {
          select: {
            id: true,
            fullName: true,
            age: true,
            diagnosis: true,
            comment: true
          }
        }
      },
      orderBy: {
        date: 'asc'
      }
    })

    return NextResponse.json(upcomingLessons)
  } catch (error) {
    console.error('Ошибка при получении предстоящих занятий:', error)
    return NextResponse.json(
      { error: 'Не удалось получить предстоящие занятия' },
      { status: 500 }
    )
  }
}

