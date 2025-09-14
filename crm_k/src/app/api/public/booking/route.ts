import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// POST /api/public/booking - создать заявку на запись
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Валидация обязательных полей
    const { parentName, parentPhone, childName, childAge, preferredDate, teacherId, message } = body
    
    if (!parentName || !parentPhone || !childName || !childAge || !preferredDate) {
      return NextResponse.json(
        { error: 'Необходимо заполнить все обязательные поля' },
        { status: 400 }
      )
    }

    // Проверяем, что учитель существует (если указан)
    if (teacherId) {
      const teacher = await prisma.user.findUnique({
        where: { 
          id: parseInt(teacherId),
          role: 'USER'
        }
      })
      
      if (!teacher) {
        return NextResponse.json(
          { error: 'Учитель не найден' },
          { status: 404 }
        )
      }
    }

    // Здесь можно добавить логику сохранения заявки
    // Например, создать запись в таблице заявок или отправить email
    
    // Пока просто возвращаем успешный ответ
    const bookingRequest = {
      id: Date.now(), // Временный ID
      parentName,
      parentPhone,
      childName,
      childAge: parseInt(childAge),
      preferredDate: new Date(preferredDate),
      teacherId: teacherId ? parseInt(teacherId) : null,
      message: message || '',
      status: 'pending',
      createdAt: new Date()
    }

    // TODO: Сохранить заявку в базу данных
    // await prisma.bookingRequest.create({ data: bookingRequest })

    return NextResponse.json({
      success: true,
      message: 'Заявка успешно отправлена! Мы свяжемся с вами в ближайшее время.',
      bookingId: bookingRequest.id
    }, { status: 201 })

  } catch (error) {
    console.error('Ошибка создания заявки на запись:', error)
    return NextResponse.json(
      { error: 'Не удалось отправить заявку' },
      { status: 500 }
    )
  }
}

