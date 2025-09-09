import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { DebtInfo } from '@/types'
import { getAuthUser } from '@/lib/auth'

// GET /api/finances/debts - получить список задолженностей
export async function GET(request: NextRequest) {
  try {
    const authUser = getAuthUser(request)
    if (!authUser) {
      return NextResponse.json(
        { error: 'Необходима аутентификация' },
        { status: 401 }
      )
    }

    // Базовые условия для фильтрации
    const baseWhere = authUser.role === 'ADMIN' 
      ? {} 
      : {
          student: {
            userId: authUser.id
          }
        }

    // Получаем все проведенные, но не оплаченные занятия
    const unpaidLessons = await prisma.lesson.findMany({
      where: {
        ...baseWhere,
        status: 'COMPLETED'
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
      },
      orderBy: {
        date: 'desc'
      }
    })

    // Группируем по ученикам
    const debtMap = new Map<number, DebtInfo>()

    for (const lesson of unpaidLessons) {
      const studentId = lesson.studentId
      
      if (!debtMap.has(studentId)) {
        // Получаем последнюю дату оплаты для этого ученика
        const lastPaidLesson = await prisma.lesson.findFirst({
          where: {
            ...baseWhere,
            studentId: studentId,
            status: 'PAID'
          },
          orderBy: {
            date: 'desc'
          }
        })

        debtMap.set(studentId, {
          student: lesson.student,
          totalDebt: 0,
          unpaidLessons: 0,
          lastPaymentDate: lastPaidLesson?.date
        })
      }

      const debtInfo = debtMap.get(studentId)!
      debtInfo.totalDebt += lesson.cost
      debtInfo.unpaidLessons += 1
    }

    const debts = Array.from(debtMap.values())
      .sort((a, b) => b.totalDebt - a.totalDebt)

    return NextResponse.json(debts)
  } catch (error) {
    console.error('Ошибка при получении задолженностей:', error)
    return NextResponse.json(
      { error: 'Не удалось получить список задолженностей' },
      { status: 500 }
    )
  }
}
