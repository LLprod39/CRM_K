import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getAuthUser } from '@/lib/auth'

// GET /api/finances/payment-history - получить историю платежей (прошедших и оплаченных занятий)
export async function GET(request: NextRequest) {
  try {
    const authUser = getAuthUser(request)
    if (!authUser) {
      return NextResponse.json(
        { error: 'Необходима аутентификация' },
        { status: 401 }
      )
    }

    // Получаем оплаченные занятия (проведенные и оплаченные)
    const whereClause: any = {
      isPaid: true,
      isCompleted: true,
      isCancelled: false
    }

    // Если не админ, показываем только занятия, которые он проводил
    if (authUser.role !== 'ADMIN') {
      whereClause.teacherId = authUser.id
    }

    const lessons = await prisma.lesson.findMany({
      where: whereClause,
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
        teacher: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        date: 'desc'
      }
    })

    // Группируем занятия по ученикам и рассчитываем статистику
    const studentPaymentHistory = new Map()

    for (const lesson of lessons) {
      const studentId = lesson.student.id
      
      if (!studentPaymentHistory.has(studentId)) {
        studentPaymentHistory.set(studentId, {
          student: lesson.student,
          paidLessonsCount: 0,
          totalPaidAmount: 0,
          lessons: []
        })
      }

      const studentData = studentPaymentHistory.get(studentId)
      studentData.paidLessonsCount += 1
      studentData.totalPaidAmount += lesson.cost
      studentData.lessons.push(lesson)
    }

    // Преобразуем Map в массив и сортируем по общей сумме платежей (от большего к меньшему)
    const result = Array.from(studentPaymentHistory.values()).sort((a, b) => b.totalPaidAmount - a.totalPaidAmount)

    return NextResponse.json(result)
  } catch (error) {
    console.error('Ошибка при получении истории платежей:', error)
    return NextResponse.json(
      { error: 'Не удалось получить историю платежей' },
      { status: 500 }
    )
  }
}
