import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getAuthUser } from '@/lib/auth'

// GET /api/finances/prepayment-history - получить историю предоплаты с балансами
export async function GET(request: NextRequest) {
  try {
    const authUser = getAuthUser(request)
    if (!authUser) {
      return NextResponse.json(
        { error: 'Необходима аутентификация' },
        { status: 401 }
      )
    }

    // Получаем предоплаченные занятия (оплаченные, но не проведенные)
    const whereClause: any = {
      isPaid: true,
      isCompleted: false,
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

    // Группируем занятия по ученикам и рассчитываем балансы
    const studentBalances = new Map()

    for (const lesson of lessons) {
      const studentId = lesson.student.id
      
      if (!studentBalances.has(studentId)) {
        // Получаем все занятия ученика для расчета баланса
        const allStudentLessons = await prisma.lesson.findMany({
          where: { studentId },
          select: {
            id: true,
            cost: true,
            isPaid: true,
            isCompleted: true,
            isCancelled: true,
            date: true
          }
        })

        // Рассчитываем предоплату (оплаченные, но не проведенные уроки)
        const prepaidLessons = allStudentLessons.filter(l => 
          l.isPaid && !l.isCompleted && !l.isCancelled
        )
        
        // Рассчитываем задолженность (проведенные, но не оплаченные уроки)
        const debtLessons = allStudentLessons.filter(l => 
          l.isCompleted && !l.isPaid && !l.isCancelled
        )

        const prepaidAmount = prepaidLessons.reduce((sum, l) => sum + l.cost, 0)
        const debtAmount = debtLessons.reduce((sum, l) => sum + l.cost, 0)
        const balance = prepaidAmount - debtAmount

        studentBalances.set(studentId, {
          student: lesson.student,
          balance,
          prepaidAmount,
          debtAmount,
          prepaidLessonsCount: prepaidLessons.length,
          debtLessonsCount: debtLessons.length,
          lessons: []
        })
      }

      // Добавляем занятие к ученику
      studentBalances.get(studentId).lessons.push(lesson)
    }

    // Преобразуем Map в массив и сортируем по балансу (от большего к меньшему)
    const result = Array.from(studentBalances.values()).sort((a, b) => b.balance - a.balance)

    return NextResponse.json(result)
  } catch (error) {
    console.error('Ошибка при получении истории предоплаты:', error)
    return NextResponse.json(
      { error: 'Не удалось получить историю предоплаты' },
      { status: 500 }
    )
  }
}