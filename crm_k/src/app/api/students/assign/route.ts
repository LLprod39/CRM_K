import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getAuthUser } from '@/lib/auth'

// POST /api/students/assign - назначить ученика учителю
export async function POST(request: NextRequest) {
  try {
    const authUser = getAuthUser(request)
    if (!authUser) {
      return NextResponse.json(
        { error: 'Необходима аутентификация' },
        { status: 401 }
      )
    }

    // Только админы могут назначать учеников
    if (authUser.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Доступ запрещен. Только администраторы могут назначать учеников.' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { studentId, teacherId } = body

    // Валидация
    if (!studentId || !teacherId) {
      return NextResponse.json(
        { error: 'Необходимо указать ID ученика и ID учителя' },
        { status: 400 }
      )
    }

    // Проверяем, что ученик существует
    const student = await prisma.student.findUnique({
      where: { id: studentId }
    })

    if (!student) {
      return NextResponse.json(
        { error: 'Ученик не найден' },
        { status: 404 }
      )
    }

    // Проверяем, что учитель существует и не является админом
    const teacher = await prisma.user.findUnique({
      where: { id: teacherId }
    })

    if (!teacher) {
      return NextResponse.json(
        { error: 'Учитель не найден' },
        { status: 404 }
      )
    }

    if (teacher.role === 'ADMIN') {
      return NextResponse.json(
        { error: 'Нельзя назначить ученика администратору. Выберите учителя из списка.' },
        { status: 400 }
      )
    }

    // Назначаем ученика учителю
    const updatedStudent = await prisma.student.update({
      where: { id: studentId },
      data: {
        userId: teacherId,
        isAssigned: true
      } as any,
      include: {
        user: {
          select: {
            name: true,
            email: true
          }
        }
      }
    })

    return NextResponse.json({
      message: 'Ученик успешно назначен учителю',
      student: updatedStudent
    })
  } catch (error) {
    console.error('Ошибка при назначении ученика:', error)
    return NextResponse.json(
      { error: 'Не удалось назначить ученика' },
      { status: 500 }
    )
  }
}

// DELETE /api/students/assign - отменить назначение ученика (сделать "нечейным")
export async function DELETE(request: NextRequest) {
  try {
    const authUser = getAuthUser(request)
    if (!authUser) {
      return NextResponse.json(
        { error: 'Необходима аутентификация' },
        { status: 401 }
      )
    }

    // Только админы могут отменять назначения
    if (authUser.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Доступ запрещен. Только администраторы могут отменять назначения.' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { studentId } = body

    // Валидация
    if (!studentId) {
      return NextResponse.json(
        { error: 'Необходимо указать ID ученика' },
        { status: 400 }
      )
    }

    // Проверяем, что ученик существует
    const student = await prisma.student.findUnique({
      where: { id: studentId }
    })

    if (!student) {
      return NextResponse.json(
        { error: 'Ученик не найден' },
        { status: 404 }
      )
    }

    // Отменяем назначение (делаем "нечейным")
    const updatedStudent = await prisma.student.update({
      where: { id: studentId },
      data: {
        userId: null,
        isAssigned: false
      } as any
    })

    return NextResponse.json({
      message: 'Назначение ученика отменено',
      student: updatedStudent
    })
  } catch (error) {
    console.error('Ошибка при отмене назначения ученика:', error)
    return NextResponse.json(
      { error: 'Не удалось отменить назначение ученика' },
      { status: 500 }
    )
  }
}
