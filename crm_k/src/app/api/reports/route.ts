import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

// GET - получить отчеты пользователя
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const dateParam = searchParams.get('date');
    const token = request.headers.get('authorization')?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json({ error: 'Токен не предоставлен' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Недействительный токен' }, { status: 401 });
    }

    const userId = decoded.userId;

    // Если указана конкретная дата
    if (dateParam) {
      const targetDate = new Date(dateParam);
      targetDate.setHours(0, 0, 0, 0);
      
      const nextDate = new Date(targetDate);
      nextDate.setDate(nextDate.getDate() + 1);

      const report = await prisma.dailyReport.findFirst({
        where: {
          userId,
          date: {
            gte: targetDate,
            lt: nextDate,
          },
        },
      });

      return NextResponse.json(report);
    }

    // Получить последние отчеты пользователя
    const reports = await prisma.dailyReport.findMany({
      where: { userId },
      orderBy: { date: 'desc' },
      take: 30, // Последние 30 отчетов
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json(reports);
  } catch (error) {
    console.error('Ошибка при получении отчетов:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}

// POST - создать новый отчет
export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json({ error: 'Токен не предоставлен' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Недействительный токен' }, { status: 401 });
    }

    const userId = decoded.userId;
    const body = await request.json();

    const {
      date,
      lessonsPlanned,
      lessonsHeld,
      lessonsCanceled,
      cashOnHand,
      totalEarned,
      paymentsReceived,
      notes,
      issues,
      studentFeedback,
    } = body;

    // Проверка обязательных полей
    if (!date) {
      return NextResponse.json({ error: 'Дата обязательна' }, { status: 400 });
    }

    // Нормализуем дату до начала дня
    const reportDate = new Date(date);
    reportDate.setHours(0, 0, 0, 0);

    // Проверяем, существует ли уже отчет на эту дату
    const existingReport = await prisma.dailyReport.findFirst({
      where: {
        userId,
        date: reportDate,
      },
    });

    if (existingReport) {
      return NextResponse.json(
        { error: 'Отчет на эту дату уже существует' },
        { status: 409 }
      );
    }

    // Создаем новый отчет
    const report = await prisma.dailyReport.create({
      data: {
        date: reportDate,
        userId,
        lessonsPlanned: lessonsPlanned || 0,
        lessonsHeld: lessonsHeld || 0,
        lessonsCanceled: lessonsCanceled || 0,
        cashOnHand: cashOnHand || 0,
        totalEarned: totalEarned || 0,
        paymentsReceived: paymentsReceived || 0,
        notes,
        issues,
        studentFeedback,
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json(report, { status: 201 });
  } catch (error) {
    console.error('Ошибка при создании отчета:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}
