import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getAuthUser } from '@/lib/auth'

interface PrepaymentData {
  studentId: number;
  amount: number;
  date: string;
  description?: string;
  period: {
    startDate: string;
    endDate: string;
  };
}

// POST /api/payments/prepayment - создать предоплату
export async function POST(request: NextRequest) {
  try {
    const authUser = getAuthUser(request)
    if (!authUser) {
      return NextResponse.json(
        { error: 'Необходима аутентификация' },
        { status: 401 }
      )
    }

    // Только администраторы могут создавать предоплаты
    if (authUser.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Доступ запрещен. Только администраторы могут создавать предоплаты.' },
        { status: 403 }
      )
    }

    const body: PrepaymentData = await request.json()
    console.log('Получены данные для создания предоплаты:', JSON.stringify(body, null, 2))
    
    // Валидация обязательных полей
    if (!body.studentId || !body.amount || !body.date || !body.period.startDate || !body.period.endDate) {
      return NextResponse.json(
        { error: 'Необходимо заполнить все обязательные поля' },
        { status: 400 }
      )
    }

    if (body.amount <= 0) {
      return NextResponse.json(
        { error: 'Сумма должна быть больше 0' },
        { status: 400 }
      )
    }

    // Проверяем, что ученик существует
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

    // Проверяем даты периода
    const startDate = new Date(body.period.startDate)
    const endDate = new Date(body.period.endDate)
    
    if (endDate <= startDate) {
      return NextResponse.json(
        { error: 'Дата окончания должна быть позже даты начала' },
        { status: 400 }
      )
    }

    // Получаем неоплаченные занятия в указанном периоде
    const unpaidLessons = await prisma.lesson.findMany({
      where: {
        studentId: body.studentId,
        isPaid: false,
        isCancelled: false,
        date: {
          gte: startDate,
          lte: endDate
        }
      },
      orderBy: {
        date: 'asc'
      }
    })

    if (unpaidLessons.length === 0) {
      return NextResponse.json(
        { error: 'В указанном периоде нет неоплаченных занятий' },
        { status: 400 }
      )
    }

    // Рассчитываем общую стоимость неоплаченных занятий
    const totalCost = unpaidLessons.reduce((sum, lesson) => sum + lesson.cost, 0)

    // Создаем предоплату и обновляем статус занятий в транзакции
    const result = await prisma.$transaction(async (tx) => {
      // Создаем платеж
      const payment = await (tx as any).payment.create({
        data: {
          studentId: body.studentId,
          amount: body.amount,
          date: new Date(body.date),
          description: body.description || `Предоплата за период с ${body.period.startDate} по ${body.period.endDate}`,
          type: 'prepayment'
        }
      })

      // Связываем платеж с занятиями
      await tx.paymentLesson.createMany({
        data: unpaidLessons.map(lesson => ({
          paymentId: payment.id,
          lessonId: lesson.id
        }))
      })

      // Обновляем статус занятий на предоплаченные
      await tx.lesson.updateMany({
        where: {
          id: { in: unpaidLessons.map(lesson => lesson.id) }
        },
        data: {
          isPaid: true
        }
      })

      // Получаем обновленные занятия с полной информацией
      const updatedLessons = await tx.lesson.findMany({
        where: {
          id: { in: unpaidLessons.map(lesson => lesson.id) }
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

      return {
        payment,
        lessons: updatedLessons,
        totalCost,
        lessonsCount: unpaidLessons.length
      }
    })

    return NextResponse.json({
      message: `Предоплата успешно создана. Обновлено ${result.lessonsCount} занятий.`,
      payment: result.payment,
      lessons: result.lessons,
      totalCost: result.totalCost,
      lessonsCount: result.lessonsCount
    }, { status: 201 })

  } catch (error) {
    console.error('Ошибка при создании предоплаты:', error)
    return NextResponse.json(
      { error: 'Не удалось создать предоплату' },
      { status: 500 }
    )
  }
}
