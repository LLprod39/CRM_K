import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getAuthUser } from '@/lib/auth'
import { releaseSlot } from '@/lib/lessonConflictUtils'

function formatIso(value?: Date | string | null) {
  if (!value) {
    return value ?? null
  }

  if (typeof value === 'string') {
    return value
  }

  return value.toISOString().replace('.000Z', 'Z')
}

function formatLunchBreakResponse(
  lunchBreak: any,
  overrides?: { date?: string; startTime?: string; endTime?: string }
) {
  return {
    ...lunchBreak,
    date: overrides?.date ?? formatIso(lunchBreak.date),
    startTime: overrides?.startTime ?? formatIso(lunchBreak.startTime),
    endTime: overrides?.endTime ?? formatIso(lunchBreak.endTime)
  }
}

function getDayRange(dateValue: string) {
  const target = new Date(dateValue)
  const start = new Date(target)
  start.setHours(0, 0, 0, 0)
  const end = new Date(target)
  end.setHours(23, 59, 59, 999)
  return { start, end }
}

export async function GET(request: NextRequest) {
  try {
    const authUser = getAuthUser(request)
    if (!authUser) {
      return NextResponse.json({ error: 'Необходима аутентификация' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const dateParam = searchParams.get('date')

    if (!dateParam) {
      return NextResponse.json({ error: 'Дата не указана' }, { status: 400 })
    }

    const { start, end } = getDayRange(dateParam)

    const lunchBreaks = await prisma.lunchBreak.findMany({
      where: authUser.role === 'ADMIN'
        ? {
            date: {
              gte: start,
              lte: end
            }
          }
        : {
            userId: authUser.id,
            date: {
              gte: start,
              lte: end
            }
          },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    const response = authUser.role === 'ADMIN'
      ? {
          lunchBreak: lunchBreaks.length > 0 ? formatLunchBreakResponse(lunchBreaks[0]) : null,
          lunchBreaks: lunchBreaks.map(item => formatLunchBreakResponse(item))
        }
      : {
          lunchBreak: lunchBreaks.length > 0 ? formatLunchBreakResponse(lunchBreaks[0]) : null
        }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Ошибка при получении времени обеда:', error)
    return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const authUser = getAuthUser(request)
    if (!authUser) {
      return NextResponse.json({ error: 'Необходима аутентификация' }, { status: 401 })
    }

    const body = await request.json()
    const { date, startTime, endTime, userId } = body

    if (!date || !startTime || !endTime) {
      return NextResponse.json({ error: 'Не все обязательные поля заполнены' }, { status: 400 })
    }

    let targetUserId = authUser.id

    if (authUser.role === 'ADMIN') {
      if (!userId || userId === authUser.id) {
        return NextResponse.json({ error: 'Администратор не может добавлять собственные обеды' }, { status: 403 })
      }

      const targetUser = await prisma.user.findUnique({ where: { id: userId } })
      if (!targetUser || targetUser.role === 'ADMIN') {
        return NextResponse.json({ error: 'Пользователь для назначения не найден' }, { status: 400 })
      }

      targetUserId = userId
    }

    const { start, end } = getDayRange(date)

    const existingLunchBreak = await prisma.lunchBreak.findFirst({
      where: {
        userId: targetUserId,
        date: {
          gte: start,
          lte: end
        }
      }
    })

    const lunchBreakData = {
      date: new Date(date),
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      userId: targetUserId
    }

    const lunchBreak = existingLunchBreak
      ? await prisma.lunchBreak.update({
          where: { id: existingLunchBreak.id },
          data: lunchBreakData
        })
      : await prisma.lunchBreak.create({ data: lunchBreakData })

    return NextResponse.json({
      lunchBreak: formatLunchBreakResponse(lunchBreak, { date, startTime, endTime })
    })
  } catch (error) {
    console.error('Ошибка при создании/обновлении времени обеда:', error)
    return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const authUser = getAuthUser(request)
    if (!authUser) {
      return NextResponse.json({ error: 'Необходима аутентификация' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date')
    const lunchBreakId = searchParams.get('lunchBreakId')

    let lunchBreak

    if (lunchBreakId && authUser.role === 'ADMIN') {
      lunchBreak = await prisma.lunchBreak.findUnique({
        where: { id: parseInt(lunchBreakId, 10) }
      })
    } else {
      if (!date) {
        return NextResponse.json({ error: 'Дата не указана' }, { status: 400 })
      }

      const { start, end } = getDayRange(date)
      lunchBreak = await prisma.lunchBreak.findFirst({
        where: {
          userId: authUser.id,
          date: {
            gte: start,
            lte: end
          }
        }
      })
    }

    if (!lunchBreak) {
      return NextResponse.json({ error: 'Время обеда не найдено' }, { status: 404 })
    }

    await prisma.lunchBreak.delete({ where: { id: lunchBreak.id } })

    // Освобождаем слот после удаления обеденного перерыва
    await releaseSlot(lunchBreak.userId, lunchBreak.startTime, lunchBreak.endTime)

    return NextResponse.json({ message: 'Время обеда удалено' })
  } catch (error) {
    console.error('Ошибка при удалении времени обеда:', error)
    return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const authUser = getAuthUser(request)
    if (!authUser) {
      return NextResponse.json({ error: 'Необходима аутентификация' }, { status: 401 })
    }

    if (authUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Только администратор может редактировать обеды' }, { status: 403 })
    }

    const body = await request.json()
    const { lunchBreakId, date, startTime, endTime } = body

    if (!lunchBreakId || !date || !startTime || !endTime) {
      return NextResponse.json({ error: 'Не все обязательные поля заполнены' }, { status: 400 })
    }

    const existingLunchBreak = await prisma.lunchBreak.findUnique({
      where: { id: lunchBreakId }
    })

    if (!existingLunchBreak) {
      return NextResponse.json({ error: 'Обед не найден' }, { status: 404 })
    }

    const updatedLunchBreak = await prisma.lunchBreak.update({
      where: { id: lunchBreakId },
      data: {
        date: new Date(date),
        startTime: new Date(startTime),
        endTime: new Date(endTime)
      }
    })

    return NextResponse.json({
      lunchBreak: formatLunchBreakResponse(updatedLunchBreak, { date, startTime, endTime })
    })
  } catch (error) {
    console.error('Ошибка при обновлении времени обеда:', error)
    return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 })
  }
}
