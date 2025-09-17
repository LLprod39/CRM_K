import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const authUser = getAuthUser(request);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: authUser.id },
      include: {
        notificationSettings: true
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      settings: user.notificationSettings || {
        isEnabled: true,
        reminderBeforeLessons: 60,
        dailySummaryTime: '20:00',
        isDailySummaryEnabled: false,
        isWeeklySummaryEnabled: false,
        weeklySummaryDay: 0,
        weeklySummaryTime: '18:00',
        reminderTemplate: `🎓 Напоминание о занятии

Уважаемые родители! 
Напоминаем, что через {minutes} минут у {studentName} занятие.

📅 Время: {time}
👩‍🏫 Преподаватель: {teacherName}

Ждём вас! 😊`,
        summaryTemplate: `📊 Сводка за день

Добро пожаловать! Вот сводка ваших занятий:

📅 Дата: {date}
✅ Проведено занятий: {completedLessons}
📝 Запланировано на завтра: {upcomingLessons}
💰 Доход за день: {dailyRevenue} ₸

Хорошего дня! 😊`
      }
    });
  } catch (error) {
    console.error('Error fetching notification settings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authUser = getAuthUser(request);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: authUser.id }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const {
      isEnabled,
      reminderBeforeLessons,
      dailySummaryTime,
      isDailySummaryEnabled,
      isWeeklySummaryEnabled,
      weeklySummaryDay,
      weeklySummaryTime,
      reminderTemplate,
      summaryTemplate
    } = await request.json();

    // Валидация данных
    if (typeof isEnabled !== 'boolean') {
      return NextResponse.json({ error: 'Invalid isEnabled value' }, { status: 400 });
    }

    if (typeof reminderBeforeLessons !== 'number' || reminderBeforeLessons < 1) {
      return NextResponse.json({ error: 'Invalid reminderBeforeLessons value' }, { status: 400 });
    }

    // Сохранение или обновление настроек
    const settings = await prisma.notificationSettings.upsert({
      where: { userId: user.id },
      update: {
        isEnabled,
        reminderBeforeLessons,
        dailySummaryTime: dailySummaryTime || null,
        isDailySummaryEnabled: isDailySummaryEnabled || false,
        isWeeklySummaryEnabled: isWeeklySummaryEnabled || false,
        weeklySummaryDay: weeklySummaryDay || 0,
        weeklySummaryTime: weeklySummaryTime || null,
        reminderTemplate: reminderTemplate || null,
        summaryTemplate: summaryTemplate || null
      },
      create: {
        userId: user.id,
        isEnabled,
        reminderBeforeLessons,
        dailySummaryTime: dailySummaryTime || null,
        isDailySummaryEnabled: isDailySummaryEnabled || false,
        isWeeklySummaryEnabled: isWeeklySummaryEnabled || false,
        weeklySummaryDay: weeklySummaryDay || 0,
        weeklySummaryTime: weeklySummaryTime || null,
        reminderTemplate: reminderTemplate || null,
        summaryTemplate: summaryTemplate || null
      }
    });

    return NextResponse.json({ success: true, settings });
  } catch (error) {
    console.error('Error saving notification settings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
