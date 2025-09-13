import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

// GET - получить статистику для автозаполнения отчета
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

    if (!dateParam) {
      return NextResponse.json({ error: 'Дата обязательна' }, { status: 400 });
    }

    const userId = decoded.userId;
    const targetDate = new Date(dateParam);
    targetDate.setHours(0, 0, 0, 0);
    
    const nextDate = new Date(targetDate);
    nextDate.setDate(nextDate.getDate() + 1);

    // Получаем статистику занятий за день
    const lessons = await prisma.lesson.findMany({
      where: {
        teacherId: userId,
        date: {
          gte: targetDate,
          lt: nextDate,
        },
      },
      include: {
        student: true,
      },
    });

    // Подсчитываем статистику занятий
    const lessonsPlanned = lessons.length;
    const lessonsHeld = lessons.filter(lesson => lesson.isCompleted).length;
    const lessonsCanceled = lessons.filter(lesson => lesson.isCancelled).length;

    // Подсчитываем финансовую статистику
    const totalEarned = lessons
      .filter(lesson => lesson.isCompleted)
      .reduce((sum, lesson) => sum + lesson.cost, 0);

    // Получаем платежи за день
    const payments = await prisma.payment.findMany({
      where: {
        date: {
          gte: targetDate,
          lt: nextDate,
        },
        student: {
          userId: userId,
        },
      },
    });

    const paymentsReceived = payments.reduce((sum, payment) => sum + payment.amount, 0);

    // Получаем информацию об учениках
    const studentsInfo = lessons.map(lesson => ({
      id: lesson.student.id,
      name: lesson.student.fullName,
      lessonTime: lesson.date,
      cost: lesson.cost,
      isCompleted: lesson.isCompleted,
      isCancelled: lesson.isCancelled,
      comment: lesson.comment,
    }));

    return NextResponse.json({
      lessonsPlanned,
      lessonsHeld,
      lessonsCanceled,
      totalEarned,
      paymentsReceived,
      cashOnHand: 0, // Это должен заполнять пользователь
      studentsInfo,
    });
  } catch (error) {
    console.error('Ошибка при получении статистики:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}
