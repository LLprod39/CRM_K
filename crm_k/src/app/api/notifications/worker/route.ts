import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// API для обработки запланированных уведомлений
// Этот эндпоинт должен вызываться по расписанию (например, через cron job)
export async function POST(request: NextRequest) {
  try {
    // Проверяем авторизацию для воркера (можно добавить секретный ключ)
    const authHeader = request.headers.get('authorization');
    const expectedToken = process.env.NOTIFICATION_WORKER_TOKEN || 'secret-worker-token';
    
    if (authHeader !== `Bearer ${expectedToken}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const now = new Date();
    
    // Получаем все неотправленные уведомления, время которых наступило
    const pendingNotifications = await prisma.scheduledNotification.findMany({
      where: {
        isSent: false,
        scheduledTime: {
          lte: now
        }
      },
      include: {
        user: true,
        lesson: {
          include: {
            student: true,
            teacher: true
          }
        }
      },
      orderBy: {
        scheduledTime: 'asc'
      }
    });

    const results = {
      processed: 0,
      sent: 0,
      failed: 0,
      errors: [] as string[]
    };

    for (const notification of pendingNotifications) {
      results.processed++;
      
      try {
        // Отправляем уведомление через WhatsApp API
        const whatsappResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/whatsapp`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: 'send',
            phoneNumber: notification.phoneNumber,
            message: notification.message
          })
        });

        if (whatsappResponse.ok) {
          // Помечаем как отправленное
          await prisma.scheduledNotification.update({
            where: { id: notification.id },
            data: {
              isSent: true,
              sentAt: new Date()
            }
          });
          results.sent++;
        } else {
          const errorData = await whatsappResponse.json();
          const errorMessage = errorData.error || 'Unknown WhatsApp API error';
          
          // Записываем ошибку
          await prisma.scheduledNotification.update({
            where: { id: notification.id },
            data: {
              errorMessage: errorMessage
            }
          });
          
          results.failed++;
          results.errors.push(`Notification ${notification.id}: ${errorMessage}`);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        
        // Записываем ошибку
        await prisma.scheduledNotification.update({
          where: { id: notification.id },
          data: {
            errorMessage: errorMessage
          }
        });
        
        results.failed++;
        results.errors.push(`Notification ${notification.id}: ${errorMessage}`);
      }
    }

    return NextResponse.json({
      success: true,
      results: results,
      timestamp: now.toISOString()
    });
  } catch (error) {
    console.error('Error in notification worker:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Internal server error' 
    }, { status: 500 });
  }
}

// API для получения статистики работы воркера
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '7');
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    // Статистика отправленных уведомлений
    const sentNotifications = await prisma.scheduledNotification.count({
      where: {
        isSent: true,
        sentAt: {
          gte: startDate
        }
      }
    });
    
    // Статистика неудачных отправок
    const failedNotifications = await prisma.scheduledNotification.count({
      where: {
        isSent: false,
        errorMessage: {
          not: null
        },
        createdAt: {
          gte: startDate
        }
      }
    });
    
    // Запланированные уведомления на будущее
    const pendingNotifications = await prisma.scheduledNotification.count({
      where: {
        isSent: false,
        errorMessage: null,
        scheduledTime: {
          gt: new Date()
        }
      }
    });
    
    // Просроченные уведомления (не отправленные и время прошло)
    const overdueNotifications = await prisma.scheduledNotification.count({
      where: {
        isSent: false,
        scheduledTime: {
          lt: new Date()
        }
      }
    });
    
    // Статистика по типам уведомлений
    const notificationsByType = await prisma.scheduledNotification.groupBy({
      by: ['notificationType'],
      where: {
        createdAt: {
          gte: startDate
        }
      },
      _count: {
        id: true
      }
    });

    return NextResponse.json({
      period: `${days} days`,
      statistics: {
        sent: sentNotifications,
        failed: failedNotifications,
        pending: pendingNotifications,
        overdue: overdueNotifications,
        byType: notificationsByType.reduce((acc, item) => {
          acc[item.notificationType] = item._count.id;
          return acc;
        }, {} as Record<string, number>)
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting worker statistics:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
