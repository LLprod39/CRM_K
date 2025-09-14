import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getAuthUser } from '@/lib/auth'

// GET /api/payments/[id] - получить конкретный платеж
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

    const resolvedParams = await params
    const paymentId = parseInt(resolvedParams.id)
    if (isNaN(paymentId)) {
      return NextResponse.json(
        { error: 'Неверный ID платежа' },
        { status: 400 }
      )
    }

    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
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

    if (!payment) {
      return NextResponse.json(
        { error: 'Платеж не найден' },
        { status: 404 }
      )
    }

    // Проверяем права доступа
    if (authUser.role !== 'ADMIN') {
      // Проверяем, что пользователь имеет доступ к ученику
      const hasAccess = await (prisma as any).lesson.findFirst({
        where: {
          studentId: payment.studentId,
          teacherId: authUser.id
        }
      })

      if (!hasAccess) {
        return NextResponse.json(
          { error: 'Доступ запрещен' },
          { status: 403 }
        )
      }
    }

    return NextResponse.json(payment)
  } catch (error) {
    console.error('Ошибка при получении платежа:', error)
    return NextResponse.json(
      { error: 'Не удалось получить платеж' },
      { status: 500 }
    )
  }
}

// DELETE /api/payments/[id] - удалить платеж
export async function DELETE(
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

    // Только администраторы могут удалять платежи
    if (authUser.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Доступ запрещен. Только администраторы могут удалять платежи.' },
        { status: 403 }
      )
    }

    const resolvedParams = await params
    const paymentId = parseInt(resolvedParams.id)
    if (isNaN(paymentId)) {
      return NextResponse.json(
        { error: 'Неверный ID платежа' },
        { status: 400 }
      )
    }

    // Проверяем, что платеж существует
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        lessons: true
      }
    })

    if (!payment) {
      return NextResponse.json(
        { error: 'Платеж не найден' },
        { status: 404 }
      )
    }

    // Удаляем платеж в транзакции
    await prisma.$transaction(async (tx) => {
      // Если есть связанные уроки, обновляем их статус
      if (payment.lessons && payment.lessons.length > 0) {
        const lessonIds = payment.lessons.map(pl => pl.lessonId)
        
        // Удаляем связи между платежом и уроками
        await tx.paymentLesson.deleteMany({
          where: { paymentId: paymentId }
        })

        // Обновляем статус уроков на неоплаченные
        await tx.lesson.updateMany({
          where: {
            id: { in: lessonIds }
          },
          data: {
            isPaid: false
          }
        })
      }

      // Удаляем сам платеж
      await tx.payment.delete({
        where: { id: paymentId }
      })
    })

    return NextResponse.json({ message: 'Платеж успешно удален' })
  } catch (error) {
    console.error('Ошибка при удалении платежа:', error)
    return NextResponse.json(
      { error: 'Не удалось удалить платеж' },
      { status: 500 }
    )
  }
}
