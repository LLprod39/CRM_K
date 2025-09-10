import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getAuthUser } from '@/lib/auth'

// GET /api/payments/unpaid-lessons?studentId=123 - получить неоплаченные уроки ученика
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

    if (!studentId) {
      return NextResponse.json(
        { error: 'Необходимо указать ID ученика' },
        { status: 400 }
      )
    }

    const studentIdNum = parseInt(studentId)
    if (isNaN(studentIdNum)) {
      return NextResponse.json(
        { error: 'Неверный ID ученика' },
        { status: 400 }
      )
    }

    // Проверяем, что ученик существует и принадлежит пользователю
    const student = await prisma.student.findUnique({
      where: { id: studentIdNum },
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

    // Если не админ, проверяем, что ученик принадлежит пользователю
    if (authUser.role !== 'ADMIN' && student.userId !== authUser.id) {
      return NextResponse.json(
        { error: 'Доступ запрещен' },
        { status: 403 }
      )
    }

    // Получаем неоплаченные уроки (проведенные, но не оплаченные)
    const unpaidLessons = await prisma.lesson.findMany({
      where: {
        studentId: studentIdNum,
        isCompleted: true,
        isPaid: false,
        isCancelled: false
      },
      orderBy: {
        date: 'desc'
      }
    })

    // Подсчитываем общую сумму задолженности
    const totalDebt = unpaidLessons.reduce((sum, lesson) => sum + lesson.cost, 0)

    return NextResponse.json({
      student,
      unpaidLessons,
      totalDebt,
      count: unpaidLessons.length
    })
  } catch (error) {
    console.error('Ошибка при получении неоплаченных уроков:', error)
    return NextResponse.json(
      { error: 'Не удалось получить неоплаченные уроки' },
      { status: 500 }
    )
  }
}
