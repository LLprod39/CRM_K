import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// GET /api/public/schedule - получить свободные окошки для записи
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')
    const teacherId = searchParams.get('teacherId')

    // Устанавливаем диапазон дат по умолчанию (следующие 30 дней)
    const defaultDateFrom = new Date()
    const defaultDateTo = new Date()
    defaultDateTo.setDate(defaultDateTo.getDate() + 30)

    const startDate = dateFrom ? new Date(dateFrom) : defaultDateFrom
    const endDate = dateTo ? new Date(dateTo) : defaultDateTo

    // Получаем всех учителей (если не указан конкретный)
    const teachers = teacherId 
      ? await prisma.user.findMany({
          where: { 
            id: parseInt(teacherId),
            role: 'USER'
          }
        })
      : await prisma.user.findMany({
          where: { role: 'USER' }
        })

    if (teachers.length === 0) {
      return NextResponse.json([])
    }

    // Получаем занятые слоты для каждого учителя
    const busySlots = await prisma.lesson.findMany({
      where: {
        teacherId: { in: teachers.map(t => t.id) },
        isCancelled: false,
        date: {
          gte: startDate,
          lte: endDate
        }
      },
      select: {
        teacherId: true,
        date: true,
        endTime: true,
        teacher: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: {
        date: 'asc'
      }
    })

    // Получаем обеденные перерывы
    const lunchBreaks = await prisma.lunchBreak.findMany({
      where: {
        userId: { in: teachers.map(t => t.id) },
        date: {
          gte: startDate,
          lte: endDate
        }
      },
      select: {
        userId: true,
        date: true,
        startTime: true,
        endTime: true,
        user: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    // Генерируем свободные слоты
    const availableSlots = []
    
    for (const teacher of teachers) {
      const teacherBusySlots = busySlots.filter(slot => slot.teacherId === teacher.id)
      const teacherLunchBreaks = lunchBreaks.filter(break_ => break_.userId === teacher.id)
      
      // Генерируем слоты для каждого дня в диапазоне
      for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
        const currentDate = new Date(date)
        
        // Пропускаем выходные (суббота и воскресенье)
        if (currentDate.getDay() === 0 || currentDate.getDay() === 6) {
          continue
        }

        // Генерируем временные слоты (9:00 - 18:00, каждый час)
        for (let hour = 9; hour < 18; hour++) {
          const slotStart = new Date(currentDate)
          slotStart.setHours(hour, 0, 0, 0)
          
          const slotEnd = new Date(currentDate)
          slotEnd.setHours(hour + 1, 0, 0, 0)

          // Проверяем, не занят ли слот
          const isBusy = teacherBusySlots.some(slot => {
            const slotDate = new Date(slot.date)
            const slotEndTime = new Date(slot.endTime)
            return slotDate <= slotStart && slotEndTime > slotStart
          })

          // Проверяем, не попадает ли слот на обеденный перерыв
          const isLunchBreak = teacherLunchBreaks.some(break_ => {
            const breakDate = new Date(break_.date)
            const breakStart = new Date(break_.startTime)
            const breakEnd = new Date(break_.endTime)
            
            // Устанавливаем дату для времени обеда
            breakStart.setFullYear(breakDate.getFullYear(), breakDate.getMonth(), breakDate.getDate())
            breakEnd.setFullYear(breakDate.getFullYear(), breakDate.getMonth(), breakDate.getDate())
            
            return breakStart <= slotStart && breakEnd > slotStart
          })

          // Проверяем, что слот в будущем
          const isFuture = slotStart > new Date()

          if (!isBusy && !isLunchBreak && isFuture) {
            availableSlots.push({
              teacherId: teacher.id,
              teacherName: teacher.name,
              date: slotStart.toISOString(),
              endTime: slotEnd.toISOString(),
              duration: 60, // 1 час
              location: 'office' // По умолчанию в офисе
            })
          }
        }
      }
    }

    // Сортируем по дате
    availableSlots.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

    return NextResponse.json(availableSlots)
  } catch (error) {
    console.error('Ошибка получения свободных слотов:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}

