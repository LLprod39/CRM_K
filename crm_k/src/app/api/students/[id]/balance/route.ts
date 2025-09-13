import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getAuthUser } from '@/lib/auth'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = getAuthUser(request)
    if (!authUser) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }

    const { id } = await params
    const studentId = parseInt(id)

    if (isNaN(studentId)) {
      return NextResponse.json(
        { error: 'Неверный ID ученика' },
        { status: 400 }
      )
    }

    // Проверяем права доступа
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: {
        user: true,
        lessons: {
          include: {
            teacher: true
          }
        },
        payments: true
      }
    })

    if (!student) {
      return NextResponse.json(
        { error: 'Ученик не найден' },
        { status: 404 }
      )
    }

    // Проверяем права доступа (только админ или владелец ученика)
    if (authUser.role !== 'ADMIN' && student.userId !== authUser.id) {
      return NextResponse.json(
        { error: 'Нет прав доступа' },
        { status: 403 }
      )
    }

    // Рассчитываем баланс
    const prepaidLessons = student.lessons.filter(lesson => 
      lesson.isPaid && !lesson.isCompleted && !lesson.isCancelled
    )
    
    const debtLessons = student.lessons.filter(lesson => 
      lesson.isCompleted && !lesson.isPaid && !lesson.isCancelled
    )

    const prepaidAmount = prepaidLessons.reduce((sum, lesson) => sum + lesson.cost, 0)
    const debtAmount = debtLessons.reduce((sum, lesson) => sum + lesson.cost, 0)
    const balance = prepaidAmount - debtAmount

    // Получаем историю платежей
    const paymentHistory = student.payments.map(payment => ({
      id: payment.id,
      amount: payment.amount,
      date: payment.date,
      description: payment.description,
      type: payment.type
    })).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

    const balanceInfo = {
      student: {
        id: student.id,
        fullName: student.fullName,
        parentName: student.parentName,
        phone: student.phone
      },
      balance,
      prepaidAmount,
      debtAmount,
      prepaidLessonsCount: prepaidLessons.length,
      debtLessonsCount: debtLessons.length,
      paymentHistory,
      lastPaymentDate: paymentHistory.length > 0 ? paymentHistory[0].date : null
    }

    return NextResponse.json(balanceInfo)
  } catch (error) {
    console.error('Ошибка при получении баланса ученика:', error)
    return NextResponse.json(
      { error: 'Не удалось получить баланс ученика' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = getAuthUser(request)
    if (!authUser || authUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Нет прав доступа' }, { status: 403 })
    }

    const { id } = await params
    const studentId = parseInt(id)
    const { balance } = await request.json()

    if (isNaN(studentId) || typeof balance !== 'number') {
      return NextResponse.json(
        { error: 'Неверные данные' },
        { status: 400 }
      )
    }

    // Обновляем баланс ученика
    const updatedStudent = await prisma.student.update({
      where: { id: studentId },
      data: { balance },
      include: {
        user: true
      }
    })

    return NextResponse.json({
      message: 'Баланс обновлен',
      student: {
        id: updatedStudent.id,
        fullName: updatedStudent.fullName,
        balance: updatedStudent.balance
      }
    })
  } catch (error) {
    console.error('Ошибка при обновлении баланса ученика:', error)
    return NextResponse.json(
      { error: 'Не удалось обновить баланс ученика' },
      { status: 500 }
    )
  }
}
