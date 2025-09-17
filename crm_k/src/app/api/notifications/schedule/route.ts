import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';

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

    const { lessonId } = await request.json();

    if (!lessonId) {
      return NextResponse.json({ error: 'Lesson ID is required' }, { status: 400 });
    }

    // Получаем настройки уведомлений пользователя
    const settings = await prisma.notificationSettings.findUnique({
      where: { userId: user.id }
    });

    if (!settings || !settings.isEnabled) {
      return NextResponse.json({ success: true, message: 'Notifications disabled' });
    }

    // Получаем информацию о занятии
    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      include: {
        student: true,
        teacher: true
      }
    });

    if (!lesson) {
      return NextResponse.json({ error: 'Lesson not found' }, { status: 404 });
    }

    // Проверяем, что занятие принадлежит пользователю
    if (lesson.teacherId !== user.id && user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Вычисляем время отправки напоминания
    const lessonTime = new Date(lesson.date);
    const reminderTime = new Date(lessonTime.getTime() - settings.reminderBeforeLessons * 60 * 1000);

    // Проверяем, что время напоминания не в прошлом
    if (reminderTime <= new Date()) {
      return NextResponse.json({ success: true, message: 'Reminder time is in the past' });
    }

    // Создаем сообщение из шаблона
    const template = settings.reminderTemplate || `🎓 Напоминание о занятии

Уважаемые родители! 
Напоминаем, что через {minutes} минут у {studentName} занятие.

📅 Время: {time}
👩‍🏫 Преподаватель: {teacherName}

Ждём вас! 😊`;

    const message = template
      .replace(/{minutes}/g, settings.reminderBeforeLessons.toString())
      .replace(/{studentName}/g, lesson.student.fullName)
      .replace(/{time}/g, lessonTime.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }))
      .replace(/{teacherName}/g, lesson.teacher.name);

    // Создаем запланированное уведомление
    const scheduledNotification = await prisma.scheduledNotification.create({
      data: {
        userId: user.id,
        lessonId: lesson.id,
        phoneNumber: lesson.student.phone,
        message: message,
        scheduledTime: reminderTime,
        notificationType: 'lesson_reminder'
      }
    });

    return NextResponse.json({ 
      success: true, 
      notification: scheduledNotification 
    });
  } catch (error) {
    console.error('Error scheduling notification:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// API для создания ежедневных и еженедельных сводок
export async function PUT(request: NextRequest) {
  try {
    const { type } = await request.json(); // 'daily' или 'weekly'

    if (type === 'daily') {
      await scheduleDailySummaries();
    } else if (type === 'weekly') {
      await scheduleWeeklySummaries();
    } else {
      return NextResponse.json({ error: 'Invalid summary type' }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error scheduling summaries:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function scheduleDailySummaries() {
  // Получаем всех пользователей с включенными ежедневными сводками
  const users = await prisma.user.findMany({
    include: {
      notificationSettings: true
    },
    where: {
      notificationSettings: {
        isEnabled: true,
        isDailySummaryEnabled: true
      }
    }
  });

  const today = new Date();
  
  for (const user of users) {
    const settings = user.notificationSettings!;
    
    // Создаем время отправки на сегодня
    const [hours, minutes] = settings.dailySummaryTime!.split(':').map(Number);
    const summaryTime = new Date(today);
    summaryTime.setHours(hours, minutes, 0, 0);
    
    // Если время уже прошло, планируем на завтра
    if (summaryTime <= new Date()) {
      summaryTime.setDate(summaryTime.getDate() + 1);
    }

    // Получаем занятия за сегодня
    const startOfDay = new Date(today);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(today);
    endOfDay.setHours(23, 59, 59, 999);

    const completedLessons = await prisma.lesson.count({
      where: {
        teacherId: user.id,
        date: {
          gte: startOfDay,
          lte: endOfDay
        },
        isCompleted: true
      }
    });

    // Получаем занятия на завтра
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const startOfTomorrow = new Date(tomorrow);
    startOfTomorrow.setHours(0, 0, 0, 0);
    const endOfTomorrow = new Date(tomorrow);
    endOfTomorrow.setHours(23, 59, 59, 999);

    const upcomingLessons = await prisma.lesson.count({
      where: {
        teacherId: user.id,
        date: {
          gte: startOfTomorrow,
          lte: endOfTomorrow
        },
        isCancelled: false
      }
    });

    // Вычисляем доход за день
    const dailyRevenue = await prisma.lesson.aggregate({
      where: {
        teacherId: user.id,
        date: {
          gte: startOfDay,
          lte: endOfDay
        },
        isCompleted: true,
        paymentStatus: 'PAID'
      },
      _sum: {
        cost: true
      }
    });

    const template = settings.summaryTemplate || `📊 Сводка за день

Добро пожаловать! Вот сводка ваших занятий:

📅 Дата: {date}
✅ Проведено занятий: {completedLessons}
📝 Запланировано на завтра: {upcomingLessons}
💰 Доход за день: {dailyRevenue} ₸

Хорошего дня! 😊`;

    const message = template
      .replace(/{date}/g, today.toLocaleDateString('ru-RU'))
      .replace(/{completedLessons}/g, completedLessons.toString())
      .replace(/{upcomingLessons}/g, upcomingLessons.toString())
      .replace(/{dailyRevenue}/g, (dailyRevenue._sum.cost || 0).toLocaleString());

    // Проверяем, есть ли номер телефона у пользователя
    if (!user.phone) {
      console.log(`Пользователь ${user.name} не имеет номера телефона для ежедневной сводки`);
      continue;
    }

    // Создаем запланированное уведомление
    await prisma.scheduledNotification.create({
      data: {
        userId: user.id,
        phoneNumber: user.phone,
        message: message,
        scheduledTime: summaryTime,
        notificationType: 'daily_summary'
      }
    });
  }
}

async function scheduleWeeklySummaries() {
  // Получаем всех пользователей с включенными еженедельными сводками
  const users = await prisma.user.findMany({
    include: {
      notificationSettings: true
    },
    where: {
      notificationSettings: {
        isEnabled: true,
        isWeeklySummaryEnabled: true
      }
    }
  });

  for (const user of users) {
    const settings = user.notificationSettings!;
    
    // Находим следующий день недели для отправки
    const today = new Date();
    const daysUntilSummary = (settings.weeklySummaryDay - today.getDay() + 7) % 7;
    const summaryDate = new Date(today);
    summaryDate.setDate(summaryDate.getDate() + daysUntilSummary);
    
    // Устанавливаем время
    const [hours, minutes] = settings.weeklySummaryTime!.split(':').map(Number);
    summaryDate.setHours(hours, minutes, 0, 0);
    
    // Если это сегодня и время уже прошло, планируем на следующую неделю
    if (daysUntilSummary === 0 && summaryDate <= new Date()) {
      summaryDate.setDate(summaryDate.getDate() + 7);
    }

    // Получаем статистику за неделю
    const weekStart = new Date(today);
    weekStart.setDate(weekStart.getDate() - 7);
    weekStart.setHours(0, 0, 0, 0);
    const weekEnd = new Date(today);
    weekEnd.setHours(23, 59, 59, 999);

    const weeklyStats = await prisma.lesson.aggregate({
      where: {
        teacherId: user.id,
        date: {
          gte: weekStart,
          lte: weekEnd
        },
        isCompleted: true
      },
      _count: {
        id: true
      },
      _sum: {
        cost: true
      }
    });

    const template = settings.summaryTemplate || `📈 Еженедельная сводка

Итоги недели:

📅 Период: {weekStart} - {weekEnd}
✅ Проведено занятий: {weeklyLessons}
💰 Доход за неделю: {weeklyRevenue} ₸

Отличная работа! 🎉`;

    const message = template
      .replace(/{weekStart}/g, weekStart.toLocaleDateString('ru-RU'))
      .replace(/{weekEnd}/g, weekEnd.toLocaleDateString('ru-RU'))
      .replace(/{weeklyLessons}/g, (weeklyStats._count.id || 0).toString())
      .replace(/{weeklyRevenue}/g, (weeklyStats._sum.cost || 0).toLocaleString());

    // Проверяем, есть ли номер телефона у пользователя
    if (!user.phone) {
      console.log(`Пользователь ${user.name} не имеет номера телефона для еженедельной сводки`);
      continue;
    }

    // Создаем запланированное уведомление
    await prisma.scheduledNotification.create({
      data: {
        userId: user.id,
        phoneNumber: user.phone,
        message: message,
        scheduledTime: summaryDate,
        notificationType: 'weekly_summary'
      }
    });
  }
}
