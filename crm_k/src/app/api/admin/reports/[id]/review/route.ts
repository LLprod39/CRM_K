import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

interface RouteParams {
  params: {
    id: string;
  };
}

// PUT - отметить отчет как проверенный и добавить комментарий администратора
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json({ error: 'Токен не предоставлен' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Недействительный токен' }, { status: 401 });
    }

    // Проверяем, что пользователь - администратор
    if (decoded.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 });
    }

    const reportId = parseInt(params.id);
    if (isNaN(reportId)) {
      return NextResponse.json({ error: 'Неверный ID отчета' }, { status: 400 });
    }

    const body = await request.json();
    const { isReviewed, reviewNotes } = body;

    // Найти существующий отчет
    const existingReport = await prisma.dailyReport.findUnique({
      where: { id: reportId },
    });

    if (!existingReport) {
      return NextResponse.json({ error: 'Отчет не найден' }, { status: 404 });
    }

    // Обновляем отчет
    const updatedReport = await prisma.dailyReport.update({
      where: { id: reportId },
      data: {
        isReviewed: isReviewed !== undefined ? isReviewed : true,
        reviewNotes: reviewNotes || null,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json(updatedReport);
  } catch (error) {
    console.error('Ошибка при обновлении отчета:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}
