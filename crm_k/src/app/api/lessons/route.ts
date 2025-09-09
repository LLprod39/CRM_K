import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { CreateLessonData } from '@/types'

// GET /api/lessons - получить все занятия
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const studentId = searchParams.get('studentId')
    const status = searchParams.get('status')
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')

    const where: {
      studentId?: number;
      status?: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED' | 'PAID';
      date?: {
        gte?: Date;
        lte?: Date;
      };
    } = {}

    if (studentId) {
      where.studentId = parseInt(studentId)
    }

    if (status && ['SCHEDULED', 'COMPLETED', 'CANCELLED', 'PAID'].includes(status)) {
      where.status = status as 'SCHEDULED' | 'COMPLETED' | 'CANCELLED' | 'PAID'
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

    const lessons = await prisma.lesson.findMany({
      where,
      include: {
        student: true
      },
      orderBy: {
        date: 'desc'
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
    const body: CreateLessonData = await request.json()
    
    // Валидация обязательных полей
    if (!body.date || !body.studentId || !body.cost) {
      return NextResponse.json(
        { error: 'Необходимо заполнить все обязательные поля' },
        { status: 400 }
      )
    }

    // Проверяем, существует ли ученик
    const student = await prisma.student.findUnique({
      where: { id: body.studentId }
    })

    if (!student) {
      return NextResponse.json(
        { error: 'Ученик не найден' },
        { status: 404 }
      )
    }

    const lesson = await prisma.lesson.create({
      data: {
        date: new Date(body.date),
        studentId: body.studentId,
        cost: body.cost,
        status: body.status || 'SCHEDULED',
        notes: body.notes || null
      },
      include: {
        student: true
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
