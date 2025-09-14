import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

// GET /api/lunch-breaks - получить время обеда для конкретной даты
export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Токен не предоставлен' }, { status: 401 });
    }

    const user = await verifyToken(token);
    if (!user) {
      return NextResponse.json({ error: 'Неверный токен' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    
    if (!date) {
      return NextResponse.json({ error: 'Дата не указана' }, { status: 400 });
    }

    const targetDate = new Date(date);
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    // Если админ, получаем все обеды на эту дату, иначе только свои
    const whereClause = user.role === 'ADMIN' 
      ? {
          date: {
            gte: startOfDay,
            lte: endOfDay
          }
        }
      : {
          userId: user.id,
          date: {
            gte: startOfDay,
            lte: endOfDay
          }
        };

    const lunchBreaks = await prisma.lunchBreak.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    // Для обратной совместимости, если не админ, возвращаем первый обед
    const lunchBreak = user.role === 'ADMIN' ? lunchBreaks : lunchBreaks[0] || null;

    return NextResponse.json({ 
      lunchBreak,
      lunchBreaks: user.role === 'ADMIN' ? lunchBreaks : undefined
    });
  } catch (error) {
    console.error('Ошибка при получении времени обеда:', error);
    return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 });
  }
}

// POST /api/lunch-breaks - создать или обновить время обеда
export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Токен не предоставлен' }, { status: 401 });
    }

    const user = await verifyToken(token);
    if (!user) {
      return NextResponse.json({ error: 'Неверный токен' }, { status: 401 });
    }

    // Проверяем, что пользователь существует в базе данных
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id }
    });

    if (!dbUser) {
      return NextResponse.json({ error: 'Пользователь не найден в базе данных' }, { status: 404 });
    }

    // Админ не может добавлять собственные обеды
    if (user.role === 'ADMIN') {
      return NextResponse.json({ error: 'Администратор не может добавлять собственные обеды' }, { status: 403 });
    }

    const { date, startTime, endTime } = await request.json();

    if (!date || !startTime || !endTime) {
      return NextResponse.json({ error: 'Не все обязательные поля заполнены' }, { status: 400 });
    }

    const targetDate = new Date(date);
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);


    // Проверяем, есть ли уже время обеда на эту дату
    const existingLunchBreak = await prisma.lunchBreak.findFirst({
      where: {
        userId: user.id,
        date: {
          gte: startOfDay,
          lte: endOfDay
        }
      }
    });

    const lunchBreakData = {
      date: targetDate,
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      userId: user.id
    };

    let lunchBreak;
    if (existingLunchBreak) {
      // Обновляем существующее время обеда
      lunchBreak = await prisma.lunchBreak.update({
        where: { id: existingLunchBreak.id },
        data: lunchBreakData
      });
    } else {
      // Создаем новое время обеда
      lunchBreak = await prisma.lunchBreak.create({
        data: lunchBreakData
      });
    }

    return NextResponse.json({ lunchBreak });
  } catch (error) {
    console.error('Ошибка при создании/обновлении времени обеда:', error);
    return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 });
  }
}

// DELETE /api/lunch-breaks - удалить время обеда
export async function DELETE(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Токен не предоставлен' }, { status: 401 });
    }

    const user = await verifyToken(token);
    if (!user) {
      return NextResponse.json({ error: 'Неверный токен' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    const lunchBreakId = searchParams.get('lunchBreakId');
    
    if (!date) {
      return NextResponse.json({ error: 'Дата не указана' }, { status: 400 });
    }

    const targetDate = new Date(date);
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    let lunchBreak;
    
    if (lunchBreakId && user.role === 'ADMIN') {
      // Админ может удалить конкретный обед по ID
      lunchBreak = await prisma.lunchBreak.findUnique({
        where: { id: parseInt(lunchBreakId) }
      });
    } else {
      // Обычный пользователь может удалить только свой обед
      lunchBreak = await prisma.lunchBreak.findFirst({
        where: {
          userId: user.id,
          date: {
            gte: startOfDay,
            lte: endOfDay
          }
        }
      });
    }

    if (!lunchBreak) {
      return NextResponse.json({ error: 'Время обеда не найдено' }, { status: 404 });
    }


    await prisma.lunchBreak.delete({
      where: { id: lunchBreak.id }
    });

    return NextResponse.json({ message: 'Время обеда удалено' });
  } catch (error) {
    console.error('Ошибка при удалении времени обеда:', error);
    return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 });
  }
}

// PUT /api/lunch-breaks - обновить время обеда (только для админа)
export async function PUT(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Токен не предоставлен' }, { status: 401 });
    }

    const user = await verifyToken(token);
    if (!user) {
      return NextResponse.json({ error: 'Неверный токен' }, { status: 401 });
    }

    // Только админ может редактировать обеды
    if (user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Только администратор может редактировать обеды' }, { status: 403 });
    }

    const { lunchBreakId, date, startTime, endTime } = await request.json();

    if (!lunchBreakId || !date || !startTime || !endTime) {
      return NextResponse.json({ error: 'Не все обязательные поля заполнены' }, { status: 400 });
    }

    const targetDate = new Date(date);
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    // Находим обед для редактирования
    const existingLunchBreak = await prisma.lunchBreak.findUnique({
      where: { id: lunchBreakId },
      include: { user: true }
    });

    if (!existingLunchBreak) {
      return NextResponse.json({ error: 'Обед не найден' }, { status: 404 });
    }


    // Обновляем обед
    const updatedLunchBreak = await prisma.lunchBreak.update({
      where: { id: lunchBreakId },
      data: {
        date: targetDate,
        startTime: new Date(startTime),
        endTime: new Date(endTime)
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
    });

    return NextResponse.json({ lunchBreak: updatedLunchBreak });
  } catch (error) {
    console.error('Ошибка при обновлении времени обеда:', error);
    return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 });
  }
}
