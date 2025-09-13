import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getAuthUser } from '@/lib/auth'
import { CreatePaymentData } from '@/types'

// GET /api/payments - получить список платежей
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

    // Базовые условия для фильтрации
    const baseWhere = authUser.role === 'ADMIN' 
      ? {} 
      : {
          student: {
            lessons: {
              some: {
                teacherId: authUser.id
              }
            }
          }
        }

    const whereClause = studentId 
      ? {
          ...baseWhere,
          studentId: parseInt(studentId)
        }
      : baseWhere

    const payments = await prisma.payment.findMany({
      where: whereClause as any,
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
        },
        lessons: {
          include: {
            lesson: true
          }
        }
      },
      orderBy: {
        date: 'desc'
      }
    })

    return NextResponse.json(payments)
  } catch (error) {
    console.error('Ошибка при получении платежей:', error)
    return NextResponse.json(
      { error: 'Не удалось получить платежи' },
      { status: 500 }
    )
  }
}

// POST /api/payments - создать новый платеж
export async function POST(request: NextRequest) {
  try {
    const authUser = getAuthUser(request)
    if (!authUser) {
      return NextResponse.json(
        { error: 'Необходима аутентификация' },
        { status: 401 }
      )
    }

    const body: CreatePaymentData = await request.json()
    const { studentId, amount, date, description, lessonIds } = body

    // Валидация данных
    if (!studentId || !amount || !date) {
      return NextResponse.json(
        { error: 'Необходимо указать ID ученика, сумму и дату' },
        { status: 400 }
      )
    }

    if (amount <= 0) {
      return NextResponse.json(
        { error: 'Сумма платежа должна быть больше нуля' },
        { status: 400 }
      )
    }

    // Проверяем, что ученик существует и принадлежит пользователю
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: {
        user: true
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

    // Проверяем, что указанные уроки существуют и принадлежат ученику
    if (lessonIds && lessonIds.length > 0) {
      const lessons = await prisma.lesson.findMany({
        where: {
          id: { in: lessonIds },
          studentId: studentId
        }
      })

      if (lessons.length !== lessonIds.length) {
        return NextResponse.json(
          { error: 'Некоторые уроки не найдены или не принадлежат ученику' },
          { status: 400 }
        )
      }
    }

    // Создаем платеж в транзакции
    const result = await prisma.$transaction(async (tx) => {
      // Создаем платеж
      const payment = await tx.payment.create({
        data: {
          studentId,
          amount,
          date: new Date(date),
          description
        }
      })

      // Если указаны уроки, связываем их с платежом
      if (lessonIds && lessonIds.length > 0) {
        await tx.paymentLesson.createMany({
          data: lessonIds.map(lessonId => ({
            paymentId: payment.id,
            lessonId: lessonId
          }))
        })

        // Обновляем статус уроков согласно новой логике
        await tx.lesson.updateMany({
          where: {
            id: { in: lessonIds }
          },
          data: {
            isPaid: true
          }
        })
      }

      return payment
    })

    // Получаем созданный платеж с полной информацией
    const createdPayment = await prisma.payment.findUnique({
      where: { id: result.id },
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
        },
        lessons: {
          include: {
            lesson: true
          }
        }
      }
    })

    return NextResponse.json(createdPayment, { status: 201 })
  } catch (error) {
    console.error('Ошибка при создании платежа:', error)
    return NextResponse.json(
      { error: 'Не удалось создать платеж' },
      { status: 500 }
    )
  }
}
