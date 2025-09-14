import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getAuthUser } from '@/lib/auth'
import { UpdateStudentData } from '@/types'

// GET /api/students/[id] - получить ученика по ID
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
        { error: 'Неверный ID ученика' },
        { status: 400 }
      )
    }

    const student = await prisma.student.findUnique({
      where: { id },
      include: {
        lessons: {
          orderBy: {
            date: 'desc'
          }
        },
        user: {
          select: {
            name: true,
            email: true
          }
        }
      }
    })

    if (!student) {
      return NextResponse.json(
        { error: 'Ученик не найден' },
        { status: 404 }
      )
    }

    // Если не админ, проверяем права доступа к ученику
    if (authUser.role !== 'ADMIN') {
      // Проверяем, принадлежит ли ученик пользователю напрямую
      const isDirectOwner = student.userId === authUser.id;
      
      // Проверяем, есть ли у пользователя занятия с этим учеником (как учитель)
      const hasLessonsWithStudent = await prisma.lesson.findFirst({
        where: {
          studentId: student.id,
          teacherId: authUser.id
        }
      });
      
      // Доступ разрешен, если пользователь владелец ученика или преподает ему
      if (!isDirectOwner && !hasLessonsWithStudent) {
        return NextResponse.json(
          { error: 'Доступ запрещен' },
          { status: 403 }
        )
      }
    }

    return NextResponse.json(student)
  } catch (error) {
    console.error('Ошибка при получении ученика:', error)
    return NextResponse.json(
      { error: 'Не удалось получить данные ученика' },
      { status: 500 }
    )
  }
}

// PUT /api/students/[id] - обновить ученика
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
        { error: 'Неверный ID ученика' },
        { status: 400 }
      )
    }

    const body: UpdateStudentData = await request.json()

    // Проверяем, существует ли ученик
    const existingStudent = await prisma.student.findUnique({
      where: { id }
    })

    if (!existingStudent) {
      return NextResponse.json(
        { error: 'Ученик не найден' },
        { status: 404 }
      )
    }

    // Если не админ, проверяем права доступа к ученику
    if (authUser.role !== 'ADMIN') {
      // Проверяем, принадлежит ли ученик пользователю напрямую
      const isDirectOwner = existingStudent.userId === authUser.id;
      
      // Проверяем, есть ли у пользователя занятия с этим учеником (как учитель)
      const hasLessonsWithStudent = await prisma.lesson.findFirst({
        where: {
          studentId: existingStudent.id,
          teacherId: authUser.id
        }
      });
      
      // Доступ разрешен, если пользователь владелец ученика или преподает ему
      if (!isDirectOwner && !hasLessonsWithStudent) {
        return NextResponse.json(
          { error: 'Доступ запрещен' },
          { status: 403 }
        )
      }
    }

    const updatedStudent = await prisma.student.update({
      where: { id },
      data: {
        fullName: body.fullName,
        phone: body.phone,
        age: body.age,
        parentName: body.parentName,
        diagnosis: body.diagnosis,
        comment: body.comment
      }
    })

    return NextResponse.json(updatedStudent)
  } catch (error) {
    console.error('Ошибка при обновлении ученика:', error)
    return NextResponse.json(
      { error: 'Не удалось обновить данные ученика' },
      { status: 500 }
    )
  }
}

// DELETE /api/students/[id] - удалить ученика
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
        { error: 'Неверный ID ученика' },
        { status: 400 }
      )
    }

    // Проверяем, существует ли ученик
    const existingStudent = await prisma.student.findUnique({
      where: { id }
    })

    if (!existingStudent) {
      return NextResponse.json(
        { error: 'Ученик не найден' },
        { status: 404 }
      )
    }

    // Если не админ, проверяем права доступа к ученику
    if (authUser.role !== 'ADMIN') {
      // Проверяем, принадлежит ли ученик пользователю напрямую
      const isDirectOwner = existingStudent.userId === authUser.id;
      
      // Проверяем, есть ли у пользователя занятия с этим учеником (как учитель)
      const hasLessonsWithStudent = await prisma.lesson.findFirst({
        where: {
          studentId: existingStudent.id,
          teacherId: authUser.id
        }
      });
      
      // Доступ разрешен, если пользователь владелец ученика или преподает ему
      if (!isDirectOwner && !hasLessonsWithStudent) {
        return NextResponse.json(
          { error: 'Доступ запрещен' },
          { status: 403 }
        )
      }
    }

    await prisma.student.delete({
      where: { id }
    })

    return NextResponse.json({ message: 'Ученик успешно удален' })
  } catch (error) {
    console.error('Ошибка при удалении ученика:', error)
    return NextResponse.json(
      { error: 'Не удалось удалить ученика' },
      { status: 500 }
    )
  }
}
