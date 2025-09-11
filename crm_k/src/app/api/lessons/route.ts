import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { CreateLessonData } from '@/types'
import { getAuthUser } from '@/lib/auth'
import { checkTimeConflicts } from '@/lib/scheduleUtils'

// GET /api/lessons - получить все занятия
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
    const status = searchParams.get('status')
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')

    const where: {
      studentId?: number;
      isCompleted?: boolean;
      isPaid?: boolean;
      isCancelled?: boolean;
      date?: {
        gte?: Date;
        lte?: Date;
      };
      student?: {
        userId?: number;
      };
    } = {}

    if (studentId) {
      where.studentId = parseInt(studentId)
    }

    // Обработка фильтра по статусу
    if (status) {
      switch (status) {
        case 'scheduled':
          where.isCompleted = false
          where.isPaid = false
          where.isCancelled = false
          break
        case 'completed':
          where.isCompleted = true
          where.isPaid = false
          where.isCancelled = false
          break
        case 'paid':
          where.isCompleted = true
          where.isPaid = true
          where.isCancelled = false
          break
        case 'cancelled':
          where.isCancelled = true
          break
        case 'prepaid':
          where.isCompleted = false
          where.isPaid = true
          where.isCancelled = false
          break
        case 'unpaid':
          where.isCompleted = true
          where.isPaid = false
          where.isCancelled = false
          break
      }
    }

    if (dateFrom || dateTo) {
      where.date = {}
      if (dateFrom) {
        where.date.gte = new Date(dateFrom)
      }
      if (dateTo) {
        where.date.lte = new Date(dateTo)
      }
    }

    // Если не админ, показываем только занятия своих учеников
    if (authUser.role !== 'ADMIN') {
      where.student = {
        userId: authUser.id
      }
    }

    const lessons = await prisma.lesson.findMany({
      where,
      include: {
        student: {
          include: {
            user: {
              select: {
                name: true,
                email: true
              }
            }
          }
        }
      },
      orderBy: {
        date: 'asc'
      }
    })

    return NextResponse.json(lessons)
  } catch (error) {
    console.error('Ошибка при получении занятий:', error)
    return NextResponse.json(
      { error: 'Не удалось получить список занятий' },
      { status: 500 }
    )
  }
}

// POST /api/lessons - создать новое занятие
export async function POST(request: NextRequest) {
  try {
    const authUser = getAuthUser(request)
    if (!authUser) {
      return NextResponse.json(
        { error: 'Необходима аутентификация' },
        { status: 401 }
      )
    }

    const body: CreateLessonData = await request.json()
    
    // Валидация обязательных полей
    if (!body.date || !body.studentId || !body.cost) {
      return NextResponse.json(
        { error: 'Необходимо заполнить все обязательные поля' },
        { status: 400 }
      )
    }

    // Проверяем, что дата занятия не в прошлом (только для не-админов)
    const lessonDate = new Date(body.date);
    const now = new Date();
    now.setHours(0, 0, 0, 0); // Сбрасываем время для сравнения только по дате
    
    if (lessonDate < now && authUser.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Нельзя создавать занятия задним числом' },
        { status: 400 }
      )
    }

    // Проверяем, существует ли ученик и принадлежит ли он пользователю
    const student = await prisma.student.findUnique({
      where: { id: body.studentId },
      include: { user: true }
    })

    if (!student) {
      return NextResponse.json(
        { error: 'Ученик не найден' },
        { status: 404 }
      )
    }

    // Если не админ, проверяем, что ученик принадлежит пользователю
    if (authUser.role !== 'ADMIN' && student.userId !== authUser.id) {
      return NextResponse.json(
        { error: 'Доступ запрещен' },
        { status: 403 }
      )
    }

    // Проверяем конфликты времени
    const existingLessons = await prisma.lesson.findMany({
      where: {
        isCancelled: false,
        date: {
          gte: new Date(new Date(body.date).setHours(0, 0, 0, 0)),
          lt: new Date(new Date(body.date).setHours(23, 59, 59, 999))
        }
      }
    });

    const timeConflict = checkTimeConflicts(
      {
        date: new Date(body.date),
        endTime: new Date(body.endTime),
        studentId: body.studentId
      },
      existingLessons
    );

    if (timeConflict.hasConflict) {
      return NextResponse.json(
        { 
          error: 'Конфликт времени',
          details: timeConflict.message,
          conflictingLessons: timeConflict.conflictingLessons.map(lesson => ({
            id: lesson.id,
            date: lesson.date,
            endTime: lesson.endTime,
            studentId: lesson.studentId
          }))
        },
        { status: 409 }
      )
    }

    const lesson = await prisma.lesson.create({
      data: {
        date: new Date(body.date),
        endTime: new Date(body.endTime),
        studentId: body.studentId,
        cost: body.cost,
        isCompleted: body.isCompleted || false,
        isPaid: body.isPaid || false,
        isCancelled: body.isCancelled || false,
        notes: body.notes || null,
        lessonType: body.lessonType || 'individual'
      },
      include: {
        student: {
          include: {
            user: {
              select: {
                name: true,
                email: true
              }
            }
          }
        }
      }
    })

    return NextResponse.json(lesson, { status: 201 })
  } catch (error) {
    console.error('Ошибка при создании занятия:', error)
    return NextResponse.json(
      { error: 'Не удалось создать занятие' },
      { status: 500 }
    )
  }
}
