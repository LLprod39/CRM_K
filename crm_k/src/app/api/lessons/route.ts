import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getAuthUser } from '@/lib/auth'
import { updateStudentBalance } from '@/lib/balanceUtils'

function parseDateRange(params: URLSearchParams) {
  const startParam = params.get('startDate')
  const endParam = params.get('endDate')

  const range: { gte?: Date; lte?: Date } = {}

  if (startParam) {
    const parsed = new Date(startParam)
    if (!isNaN(parsed.getTime())) {
      range.gte = parsed
    }
  }

  if (endParam) {
    const parsed = new Date(endParam)
    if (!isNaN(parsed.getTime())) {
      parsed.setHours(23, 59, 59, 999)
      range.lte = parsed
    }
  }

  return range
}

export async function GET(request: NextRequest) {
  try {
    const authUser = getAuthUser(request)
    if (!authUser) {
      return NextResponse.json({ error: 'Необходима аутентификация' }, { status: 401 })
    }

    const searchParams = new URL(request.url).searchParams
    const where: any = {}

    const studentId = searchParams.get('studentId')
    if (studentId) {
      where.studentId = parseInt(studentId, 10)
    }

    const status = searchParams.get('status')
    if (status) {
      switch (status) {
        case 'scheduled':
          Object.assign(where, { isCompleted: false, isPaid: false, isCancelled: false })
          break
        case 'prepaid':
          Object.assign(where, { isCompleted: false, isPaid: true, isCancelled: false })
          break
        case 'cancelled':
          where.isCancelled = true
          break
        case 'completed':
          Object.assign(where, { isCompleted: true, isPaid: true, isCancelled: false })
          break
        case 'debt':
          Object.assign(where, { isCompleted: true, isPaid: false, isCancelled: false })
          break
      }
    }

    const dateRange = parseDateRange(searchParams)
    if (dateRange.gte || dateRange.lte) {
      where.date = dateRange
    }

    if (authUser.role !== 'ADMIN') {
      where.teacherId = authUser.id
    }

    const lessons = await prisma.lesson.findMany({
      where,
      include: {
        student: {
          include: {
            user: {
              select: { id: true, name: true, email: true }
            }
          }
        },
        teacher: {
          select: { id: true, name: true, email: true }
        }
      },
      orderBy: { date: 'asc' }
    })

    return NextResponse.json(lessons)
  } catch (error) {
    console.error('Ошибка при получении занятий:', error)
    return NextResponse.json({ error: 'Не удалось получить список занятий' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const authUser = getAuthUser(request)
    if (!authUser) {
      return NextResponse.json({ error: 'Необходима аутентификация' }, { status: 401 })
    }

    const body = await request.json()
    const lessonType: 'individual' | 'group' = body.lessonType === 'group' ? 'group' : 'individual'

    if (!body.date || !body.endTime || !body.cost) {
      return NextResponse.json({ error: 'Не все обязательные поля заполнены' }, { status: 400 })
    }

    const studentIds: number[] = lessonType === 'group' ? body.studentIds || [] : [body.studentId]
    if (studentIds.length === 0 || studentIds.some(id => typeof id !== 'number')) {
      return NextResponse.json({ error: 'Необходимо указать учеников' }, { status: 400 })
    }

    const students = await prisma.student.findMany({ where: { id: { in: studentIds } } })
    if (students.length !== studentIds.length) {
      return NextResponse.json({ error: 'Некоторые ученики не найдены' }, { status: 404 })
    }

    if (authUser.role !== 'ADMIN') {
      const unauthorized = students.filter(student => student.userId !== authUser.id)
      if (unauthorized.length > 0) {
        return NextResponse.json({ error: 'Нет доступа к указанным ученикам' }, { status: 403 })
      }
    }

    const teacherId = authUser.role === 'ADMIN'
      ? body.userId || students[0]?.userId || authUser.id
      : authUser.id

    const lessonBase = {
      date: new Date(body.date),
      endTime: new Date(body.endTime),
      cost: body.cost,
      isCompleted: body.isCompleted ?? false,
      isPaid: body.isPaid ?? false,
      isCancelled: body.isCancelled ?? false,
      notes: body.notes ?? null,
      comment: body.comment ?? null,
      lessonType,
      teacherId
    }

    if (lessonType === 'group') {
      const created = await Promise.all(
        studentIds.map(studentId =>
          prisma.lesson.create({
            data: {
              ...lessonBase,
              studentId
            }
          })
        )
      )
      return NextResponse.json(created[0], { status: 201 })
    }

    const lesson = await prisma.lesson.create({
      data: {
        ...lessonBase,
        studentId: studentIds[0]
      }
    })

    return NextResponse.json(lesson, { status: 201 })
  } catch (error) {
    console.error('Ошибка при создании занятия:', error)
    return NextResponse.json({ error: 'Не удалось создать занятие' }, { status: 500 })
  }
}

