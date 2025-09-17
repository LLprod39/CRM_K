import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getAuthUser } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const authUser = getAuthUser(request)
    if (!authUser) {
      return NextResponse.json(
        { error: 'Необходима аутентификация' },
        { status: 401 }
      )
    }

    const baseWhere = authUser.role === 'ADMIN' ? {} : { teacherId: authUser.id }

    const lessons = await prisma.lesson.findMany({
      where: {
        ...baseWhere,
        isCompleted: false,
        isPaid: true,
        isCancelled: false
      },
      include: {
        student: {
          select: {
            id: true,
            fullName: true,
            userId: true
          }
        }
      },
      orderBy: {
        date: 'asc'
      }
    })

    return NextResponse.json(lessons)
  } catch (error) {
    console.error('Ошибка при получении предоплаченных занятий:', error)
    return NextResponse.json(
      { error: 'Не удалось получить предоплаченные занятия' },
      { status: 500 }
    )
  }
}
