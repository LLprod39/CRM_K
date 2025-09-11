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
    
    if (!date) {
      return NextResponse.json({ error: 'Дата не указана' }, { status: 400 });
    }

    const targetDate = new Date(date);
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    const lunchBreak = await prisma.lunchBreak.findFirst({
      where: {
        userId: user.id,
        date: {
          gte: startOfDay,
          lte: endOfDay
        }
      }
    });

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
