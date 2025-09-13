import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

interface RouteParams {
  params: {
    id: string;
  };
}

// GET - получить конкретный отчет
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json({ error: 'Токен не предоставлен' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Недействительный токен' }, { status: 401 });
    }

    const reportId = parseInt(params.id);
    if (isNaN(reportId)) {
      return NextResponse.json({ error: 'Неверный ID отчета' }, { status: 400 });
    }

    const report = await prisma.dailyReport.findUnique({
      where: { id: reportId },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    if (!report) {
      return NextResponse.json({ error: 'Отчет не найден' }, { status: 404 });
    }

    // Обычные пользователи могут видеть только свои отчеты
    // Админы могут видеть все отчеты
    if (decoded.role !== 'ADMIN' && report.userId !== decoded.userId) {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 });
    }

    return NextResponse.json(report);
  } catch (error) {
    console.error('Ошибка при получении отчета:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}

// PUT - обновить отчет
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

    const reportId = parseInt(params.id);
    if (isNaN(reportId)) {
      return NextResponse.json({ error: 'Неверный ID отчета' }, { status: 400 });
    }

    const body = await request.json();

    // Найти существующий отчет
    const existingReport = await prisma.dailyReport.findUnique({
      where: { id: reportId },
    });

    if (!existingReport) {
      return NextResponse.json({ error: 'Отчет не найден' }, { status: 404 });
    }

    // Проверка прав доступа
    if (decoded.role !== 'ADMIN' && existingReport.userId !== decoded.userId) {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 });
    }

    // Подготавливаем данные для обновления
    const updateData: any = {};
    
    // Поля, которые может обновлять пользователь
    const userFields = [
      'lessonsPlanned',
      'lessonsHeld', 
      'lessonsCanceled',
      'cashOnHand',
      'totalEarned',
      'paymentsReceived',
      'notes',
      'issues',
      'studentFeedback'
    ];

    // Поля, которые может обновлять только админ
    const adminFields = ['isReviewed', 'reviewNotes'];

    // Обычный пользователь может обновлять только свои поля
    if (decoded.role !== 'ADMIN') {
      userFields.forEach(field => {
        if (body[field] !== undefined) {
          updateData[field] = body[field];
        }
      });
    } else {
      // Админ может обновлять все поля
      [...userFields, ...adminFields].forEach(field => {
        if (body[field] !== undefined) {
          updateData[field] = body[field];
        }
      });
    }

    // Обновляем отчет
    const updatedReport = await prisma.dailyReport.update({
      where: { id: reportId },
      data: updateData,
      include: {
        user: {
          select: {
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

// DELETE - удалить отчет
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json({ error: 'Токен не предоставлен' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Недействительный токен' }, { status: 401 });
    }

    const reportId = parseInt(params.id);
    if (isNaN(reportId)) {
      return NextResponse.json({ error: 'Неверный ID отчета' }, { status: 400 });
    }

    // Найти существующий отчет
    const existingReport = await prisma.dailyReport.findUnique({
      where: { id: reportId },
    });

    if (!existingReport) {
      return NextResponse.json({ error: 'Отчет не найден' }, { status: 404 });
    }

    // Проверка прав доступа
    if (decoded.role !== 'ADMIN' && existingReport.userId !== decoded.userId) {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 });
    }

    // Удаляем отчет
    await prisma.dailyReport.delete({
      where: { id: reportId },
    });

    return NextResponse.json({ message: 'Отчет успешно удален' });
  } catch (error) {
    console.error('Ошибка при удалении отчета:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}
