import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

// GET - получить статистику по отчетам всех пользователей (только для админа)
export async function GET(request: NextRequest) {
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

    // Получаем все отчеты
    const allReports = await prisma.dailyReport.findMany({
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

    // Вычисляем общую статистику
    const totalReports = allReports.length;
    const reviewedReports = allReports.filter(r => r.isReviewed).length;
    const pendingReports = totalReports - reviewedReports;

    const totalEarned = allReports.reduce((sum, r) => sum + r.totalEarned, 0);
    const totalCash = allReports.reduce((sum, r) => sum + r.cashOnHand, 0);
    const totalLessonsPlanned = allReports.reduce((sum, r) => sum + r.lessonsPlanned, 0);
    const totalLessonsHeld = allReports.reduce((sum, r) => sum + r.lessonsHeld, 0);

    // Статистика по пользователям
    const userStats = allReports.reduce((acc, report) => {
      const userId = report.userId;
      if (!acc[userId]) {
        acc[userId] = {
          user: report.user,
          totalReports: 0,
          reviewedReports: 0,
          totalEarned: 0,
          totalLessons: 0,
          lastReportDate: null,
        };
      }

      acc[userId].totalReports++;
      if (report.isReviewed) acc[userId].reviewedReports++;
      acc[userId].totalEarned += report.totalEarned;
      acc[userId].totalLessons += report.lessonsHeld;
      
      if (!acc[userId].lastReportDate || new Date(report.date) > new Date(acc[userId].lastReportDate)) {
        acc[userId].lastReportDate = report.date;
      }

      return acc;
    }, {} as any);

    // Последние отчеты
    const recentReports = allReports
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 10);

    // Отчеты с проблемами
    const reportsWithIssues = allReports.filter(r => r.issues && r.issues.trim().length > 0);

    // Среднее количество отчетов в день
    const dates = [...new Set(allReports.map(r => r.date.toISOString().split('T')[0]))];
    const avgReportsPerDay = dates.length > 0 ? totalReports / dates.length : 0;

    return NextResponse.json({
      totalReports,
      reviewedReports,
      pendingReports,
      totalEarned,
      totalCash,
      totalLessonsPlanned,
      totalLessonsHeld,
      avgReportsPerDay: Math.round(avgReportsPerDay * 100) / 100,
      userStats: Object.values(userStats),
      recentReports,
      reportsWithIssues: reportsWithIssues.length,
      efficiency: totalLessonsPlanned > 0 ? Math.round((totalLessonsHeld / totalLessonsPlanned) * 100) : 0,
    });
  } catch (error) {
    console.error('Ошибка при получении статистики отчетов:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}
