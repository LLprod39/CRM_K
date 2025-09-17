import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getAuthUser } from '@/lib/auth'
import { isValidStatusTransition, getCancellationInfo, getLessonStatus } from '@/lib/lessonStatusUtils'
import { UpdateLessonData } from '@/types'
import { updateStudentBalance } from '@/lib/balanceUtils'
import { checkLessonConflicts, checkSlotAvailability, releaseSlot } from '@/lib/lessonConflictUtils'

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

    // Если не админ, проверяем права доступа к занятию
    if (authUser.role !== 'ADMIN') {
      // Проверяем, принадлежит ли ученик пользователю напрямую
      const isStudentOwner = lesson.student.userId === authUser.id;
      
      // Проверяем, является ли пользователь учителем этого занятия
      const isTeacher = lesson.teacherId === authUser.id;
      
      // Доступ разрешен, если пользователь владелец ученика или учитель занятия
      if (!isStudentOwner && !isTeacher) {
        return NextResponse.json(
          { error: 'Доступ запрещен' },
          { status: 403 }
        )
      }
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

    // Если изменяется дата, проверяем, что она не в прошлом (только для не-админов)
    if (body.date) {
      const lessonDate = new Date(body.date);
      const now = new Date();
      now.setHours(0, 0, 0, 0); // Сбрасываем время для сравнения только по дате
      
      if (lessonDate < now && authUser.role !== 'ADMIN') {
        return NextResponse.json(
          { error: 'Нельзя изменять дату занятия на прошедшую' },
          { status: 400 }
        )
      }
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

    // Проверяем права доступа к занятию
    const isStudentOwner = existingLesson.student.userId === authUser.id;
    const isTeacher = existingLesson.teacherId === authUser.id;
    
    if (authUser.role !== 'ADMIN') {
      // Доступ разрешен, если пользователь владелец ученика или учитель занятия
      if (!isStudentOwner && !isTeacher) {
        return NextResponse.json(
          { error: 'Доступ запрещен' },
          { status: 403 }
        )
      }
    }

    // Валидация переходов статусов согласно новой логике (только если статусы действительно меняются)
    const statusChanged = (
      body.isCompleted !== undefined ||
      body.isPaid !== undefined ||
      body.isCancelled !== undefined
    );

    if (statusChanged) {
      const currentStatus = getLessonStatus(
        existingLesson.isCompleted,
        existingLesson.isPaid,
        existingLesson.isCancelled,
        existingLesson.date
      );
      
      const newStatus = getLessonStatus(
        body.isCompleted ?? existingLesson.isCompleted,
        body.isPaid ?? existingLesson.isPaid,
        body.isCancelled ?? existingLesson.isCancelled,
        existingLesson.date
      );

      if (!isValidStatusTransition(currentStatus, newStatus)) {
        return NextResponse.json(
          { error: `Недопустимый переход статуса с "${currentStatus}" на "${newStatus}"` },
          { status: 400 }
        )
      }
    }

    // Ограничиваем изменение статуса для учителей - только если они также не владельцы ученика
    if (authUser.role !== 'ADMIN' && !isStudentOwner && isTeacher) {
      // Учитель может изменить только статус отмены и завершения занятия
      const allowedChanges = (
        (body.cost === undefined || body.cost === existingLesson.cost) &&
        (body.studentId === undefined || body.studentId === existingLesson.studentId) &&
        (body.date === undefined) &&
        (body.endTime === undefined)
      )

      if (!allowedChanges) {
        return NextResponse.json(
          { error: 'Учитель может изменить только статус занятия и комментарий' },
          { status: 403 }
        )
      }
    }

    // Если отменяем занятие, проверяем правила отмены
    if (body.isCancelled === true && !existingLesson.isCancelled) {
      const cancellationResult = getCancellationInfo(existingLesson.date, existingLesson.cost)
      
      // Логируем результат отмены для админов
      if (authUser.role === 'ADMIN') {
        console.log(`Отмена занятия ${id}: ${cancellationResult.refundDescription}`)
      }
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

    // Если изменяется время или учитель, проверяем конфликты
    const isTimeChanged = body.date || body.endTime
    const isTeacherChanged = body.teacherId && body.teacherId !== existingLesson.teacherId
    
    if (isTimeChanged || isTeacherChanged) {
      const newDate = body.date ? new Date(body.date) : existingLesson.date
      const newEndTime = body.endTime ? new Date(body.endTime) : existingLesson.endTime
      const newTeacherId = body.teacherId || existingLesson.teacherId
      const newStudentId = body.studentId || existingLesson.studentId

      // Проверяем доступность слота
      const slotAvailability = await checkSlotAvailability(newTeacherId, newDate, newEndTime)
      if (!slotAvailability.isAvailable) {
        return NextResponse.json({ 
          error: `Слот недоступен: ${slotAvailability.reason}` 
        }, { status: 400 })
      }

      // Проверяем конфликты
      const conflictCheck = await checkLessonConflicts({
        date: newDate,
        endTime: newEndTime,
        teacherId: newTeacherId,
        studentIds: [newStudentId],
        lessonType: existingLesson.lessonType as 'individual' | 'group',
        excludeLessonId: id
      })

      if (!conflictCheck.canCreate) {
        return NextResponse.json({ 
          error: 'Конфликт времени занятий',
          details: conflictCheck.conflicts
        }, { status: 400 })
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
        notes: body.notes,
        comment: body.comment
      },
      include: {
        student: true
      }
    })

    // Обновляем баланс ученика после изменения статуса занятия
    await updateStudentBalance(body.studentId ?? existingLesson.studentId)

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

    // Если не админ, проверяем права доступа к занятию
    if (authUser.role !== 'ADMIN') {
      // Проверяем, принадлежит ли ученик пользователю напрямую
      const isStudentOwner = existingLesson.student.userId === authUser.id;
      
      // Проверяем, является ли пользователь учителем этого занятия
      const isTeacher = existingLesson.teacherId === authUser.id;
      
      // Доступ разрешен, если пользователь владелец ученика или учитель занятия
      if (!isStudentOwner && !isTeacher) {
        return NextResponse.json(
          { error: 'Доступ запрещен' },
          { status: 403 }
        )
      }
    }

    await prisma.lesson.delete({
      where: { id }
    })

    // Освобождаем слот после удаления занятия
    await releaseSlot(existingLesson.teacherId, existingLesson.date, existingLesson.endTime)

    return NextResponse.json({ message: 'Занятие успешно удалено' })
  } catch (error) {
    console.error('Ошибка при удалении занятия:', error)
    return NextResponse.json(
      { error: 'Не удалось удалить занятие' },
      { status: 500 }
    )
  }
}
