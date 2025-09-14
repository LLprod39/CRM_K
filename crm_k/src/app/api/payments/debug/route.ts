import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getAuthUser } from '@/lib/auth'

// GET /api/payments/debug - получить все платежи для отладки
export async function GET(request: NextRequest) {
  try {
    const authUser = getAuthUser(request)
    if (!authUser) {
      return NextResponse.json(
        { error: 'Необходима аутентификация' },
        { status: 401 }
      )
    }

    // Только администраторы могут видеть отладочную информацию
    if (authUser.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Доступ запрещен' },
        { status: 403 }
      )
    }

    const payments = await prisma.payment.findMany({
      include: {
        student: {
          include: {
            user: true
          }
        },
        lessons: {
          include: {
            lesson: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 20 // Показываем только последние 20 платежей
    })

    return NextResponse.json({
      total: payments.length,
      payments: payments.map(payment => ({
        id: payment.id,
        studentId: payment.studentId,
        studentName: payment.student.fullName,
        amount: payment.amount,
        date: payment.date,
        description: payment.description,
        type: (payment as any).type,
        createdAt: payment.createdAt,
        hasLessons: payment.lessons.length > 0,
        lessonsCount: payment.lessons.length,
        lessons: payment.lessons.map(pl => ({
          lessonId: pl.lessonId,
          lessonDate: pl.lesson.date,
          lessonCost: pl.lesson.cost
        }))
      }))
    })
  } catch (error) {
    console.error('Ошибка при получении платежей:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}
