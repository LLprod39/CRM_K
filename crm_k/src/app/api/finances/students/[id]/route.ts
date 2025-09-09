import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getAuthUser } from '@/lib/auth'
import { StudentFinancialReport } from '@/types'

// GET /api/finances/students/[id] - получить финансовый отчет по ученику
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
    const studentId = parseInt(resolvedParams.id)

    if (isNaN(studentId)) {
      return NextResponse.json(
        { error: 'Неверный ID ученика' },
        { status: 400 }
      )
    }

    // Получаем информацию об ученике
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: {
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

    // Если не админ, проверяем, что ученик принадлежит пользователю
    if (authUser.role !== 'ADMIN' && student.userId !== authUser.id) {
      return NextResponse.json(
        { error: 'Доступ запрещен' },
        { status: 403 }
      )
    }

    // Получаем все занятия ученика
    const allLessons = await prisma.lesson.findMany({
      where: { studentId },
      orderBy: { date: 'desc' }
    })

    // Подсчитываем статистику
    const paidLessons = allLessons.filter(lesson => lesson.status === 'PAID')
    const completedLessons = allLessons.filter(lesson => lesson.status === 'COMPLETED')
    const unpaidLessons = allLessons.filter(lesson => lesson.status === 'COMPLETED')

    const totalPaid = paidLessons.reduce((sum, lesson) => sum + lesson.cost, 0)
    const totalDebt = unpaidLessons.reduce((sum, lesson) => sum + lesson.cost, 0)
    const averageCheck = paidLessons.length > 0 ? totalPaid / paidLessons.length : 0

    // История платежей
    const paymentHistory = paidLessons.map(lesson => ({
      date: lesson.date,
      amount: lesson.cost,
      lessonId: lesson.id
    }))

    // Последняя дата платежа
    const lastPaymentDate = paidLessons.length > 0 ? paidLessons[0].date : undefined

    const report: StudentFinancialReport = {
      student,
      totalPaid,
      totalDebt,
      lessonsCompleted: completedLessons.length,
      lessonsPaid: paidLessons.length,
      averageCheck,
      lastPaymentDate,
      paymentHistory
    }

    return NextResponse.json(report)
  } catch (error) {
    console.error('Ошибка при получении финансового отчета ученика:', error)
    return NextResponse.json(
      { error: 'Не удалось получить финансовый отчет' },
      { status: 500 }
    )
  }
}
