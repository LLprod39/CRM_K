import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getAuthUser } from '@/lib/auth'
import { UpdateLessonData } from '@/types'

// GET /api/lessons/[id] - получить занятие по ID
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

    const resolvedParams = await params;
    const id = parseInt(resolvedParams.id)
    
    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'Неверный ID занятия' },
        { status: 400 }
      )
    }

    const lesson = await prisma.lesson.findUnique({
      where: { id },
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

    if (!lesson) {
      return NextResponse.json(
        { error: 'Занятие не найдено' },
        { status: 404 }
      )
    }

    // Если не админ, проверяем, что занятие принадлежит пользователю
    if (authUser.role !== 'ADMIN' && lesson.student.userId !== authUser.id) {
      return NextResponse.json(
        { error: 'Доступ запрещен' },
        { status: 403 }
      )
    }

    return NextResponse.json(lesson)
  } catch (error) {
    console.error('Ошибка при получении занятия:', error)
    return NextResponse.json(
      { error: 'Не удалось получить данные занятия' },
      { status: 500 }
    )
  }
}

// PUT /api/lessons/[id] - обновить занятие
export async function PUT(
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

    const resolvedParams = await params;
    const id = parseInt(resolvedParams.id)
    
    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'Неверный ID занятия' },
        { status: 400 }
      )
    }

    const body: UpdateLessonData = await request.json()

    // Проверяем, существует ли занятие
    const existingLesson = await prisma.lesson.findUnique({
      where: { id },
      include: {
        student: true
      }
    })

    if (!existingLesson) {
      return NextResponse.json(
        { error: 'Занятие не найдено' },
        { status: 404 }
      )
    }

    // Если не админ, проверяем, что занятие принадлежит пользователю
    if (authUser.role !== 'ADMIN' && existingLesson.student.userId !== authUser.id) {
      return NextResponse.json(
        { error: 'Доступ запрещен' },
        { status: 403 }
      )
    }

    // Если изменяется studentId, проверяем существование ученика
    if (body.studentId && body.studentId !== existingLesson.studentId) {
      const student = await prisma.student.findUnique({
        where: { id: body.studentId }
      })

      if (!student) {
        return NextResponse.json(
          { error: 'Ученик не найден' },
          { status: 404 }
        )
      }
    }

    const updatedLesson = await prisma.lesson.update({
      where: { id },
      data: {
        date: body.date ? new Date(body.date) : undefined,
        studentId: body.studentId,
        cost: body.cost,
        isCompleted: body.isCompleted,
        isPaid: body.isPaid,
        isCancelled: body.isCancelled,
        notes: body.notes
      },
      include: {
        student: true
      }
    })

    return NextResponse.json(updatedLesson)
  } catch (error) {
    console.error('Ошибка при обновлении занятия:', error)
    return NextResponse.json(
      { error: 'Не удалось обновить данные занятия' },
      { status: 500 }
    )
  }
}

// DELETE /api/lessons/[id] - удалить занятие
export async function DELETE(
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

    const resolvedParams = await params;
    const id = parseInt(resolvedParams.id)
    
    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'Неверный ID занятия' },
        { status: 400 }
      )
    }

    // Проверяем, существует ли занятие
    const existingLesson = await prisma.lesson.findUnique({
      where: { id },
      include: {
        student: true
      }
    })

    if (!existingLesson) {
      return NextResponse.json(
        { error: 'Занятие не найдено' },
        { status: 404 }
      )
    }

    // Если не админ, проверяем, что занятие принадлежит пользователю
    if (authUser.role !== 'ADMIN' && existingLesson.student.userId !== authUser.id) {
      return NextResponse.json(
        { error: 'Доступ запрещен' },
        { status: 403 }
      )
    }

    await prisma.lesson.delete({
      where: { id }
    })

    return NextResponse.json({ message: 'Занятие успешно удалено' })
  } catch (error) {
    console.error('Ошибка при удалении занятия:', error)
    return NextResponse.json(
      { error: 'Не удалось удалить занятие' },
      { status: 500 }
    )
  }
}
