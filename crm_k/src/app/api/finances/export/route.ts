import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getAuthUser } from '@/lib/auth'
import * as XLSX from 'xlsx'

// GET /api/finances/export - экспорт финансовых данных в Excel
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
    const format = searchParams.get('format') || 'xlsx' // xlsx или csv
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    let dateFrom: Date | undefined
    let dateTo: Date | undefined

    if (startDate && endDate) {
      dateFrom = new Date(startDate)
      dateTo = new Date(endDate)
    }

    // Базовые условия для фильтрации
    const baseWhere = authUser.role === 'ADMIN' 
      ? {} 
      : {
          student: {
            userId: authUser.id
          }
        }

    // Получаем все занятия с информацией об учениках
    const lessons = await prisma.lesson.findMany({
      where: {
        ...baseWhere,
        ...(dateFrom && dateTo ? {
          date: {
            gte: dateFrom,
            lte: dateTo
          }
        } : {})
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

    // Подготавливаем данные для экспорта
    const exportData = lessons.map(lesson => ({
      'Дата': lesson.date.toLocaleDateString('ru-RU'),
      'Время': lesson.date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
      'Ученик': lesson.student.fullName,
      'Телефон': lesson.student.phone,
      'Стоимость': lesson.cost,
      'Статус': getCombinedStatusText(lesson),
      'Заметки': lesson.notes || '',
      ...(authUser.role === 'ADMIN' && {
        'Владелец': lesson.student.user?.name || 'Неизвестно',
        'Email владельца': lesson.student.user?.email || 'Неизвестно'
      })
    }))

    // Создаем книгу Excel
    const workbook = XLSX.utils.book_new()
    const worksheet = XLSX.utils.json_to_sheet(exportData)

    // Настраиваем ширину колонок
    const columnWidths = [
      { wch: 12 }, // Дата
      { wch: 8 },  // Время
      { wch: 25 }, // Ученик
      { wch: 15 }, // Телефон
      { wch: 10 }, // Стоимость
      { wch: 12 }, // Статус
      { wch: 30 }  // Заметки
    ]
    worksheet['!cols'] = columnWidths

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Финансы')

    // Добавляем сводный лист
    const summaryData = [
      ['Показатель', 'Значение'],
      ['Общее количество занятий', lessons.length],
      ['Общая сумма', lessons.reduce((sum, lesson) => sum + lesson.cost, 0)],
      ['Оплаченные занятия', lessons.filter(l => l.isCompleted && l.isPaid && !l.isCancelled).length],
      ['Проведенные занятия', lessons.filter(l => l.isCompleted && !l.isPaid && !l.isCancelled).length],
      ['Отмененные занятия', lessons.filter(l => l.isCancelled).length],
      ['Запланированные занятия', lessons.filter(l => !l.isCompleted && !l.isPaid && !l.isCancelled).length],
      ['Предоплаченные занятия', lessons.filter(l => !l.isCompleted && l.isPaid && !l.isCancelled).length]
    ]

    const summarySheet = XLSX.utils.aoa_to_sheet(summaryData)
    summarySheet['!cols'] = [{ wch: 25 }, { wch: 15 }]
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Сводка')

    // Генерируем файл
    const buffer = XLSX.write(workbook, { 
      type: 'buffer', 
      bookType: format === 'csv' ? 'csv' : 'xlsx' 
    })

    const filename = `finances_export_${new Date().toISOString().split('T')[0]}.${format}`
    
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': format === 'csv' ? 'text/csv' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`
      }
    })
  } catch (error) {
    console.error('Ошибка при экспорте данных:', error)
    return NextResponse.json(
      { error: 'Не удалось экспортировать данные' },
      { status: 500 }
    )
  }
}

function getCombinedStatusText(lesson: any): string {
  const statuses = []
  if (lesson.isCompleted) statuses.push('Проведено')
  if (lesson.isPaid) statuses.push('Оплачено')
  if (lesson.isCancelled) statuses.push('Отменено')
  
  if (statuses.length === 0) return 'Запланировано'
  return statuses.join(' + ')
}
