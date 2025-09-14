import { NextRequest, NextResponse } from 'next/server';
import { notificationWorkerService } from '@/lib/notification-worker';
import { getAuthUser } from '@/lib/auth';

/**
 * API для управления notification worker'ом
 * GET - получить статус worker'а
 * POST - запустить worker
 * DELETE - остановить worker
 * PUT - обработать уведомления вручную
 */
export async function GET(request: NextRequest) {
  try {
    const authUser = getAuthUser(request);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Только админы могут управлять worker'ом
    if (authUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const status = notificationWorkerService.getStatus();
    
    return NextResponse.json({
      success: true,
      status: status,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting worker status:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authUser = getAuthUser(request);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Только админы могут управлять worker'ом
    if (authUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    notificationWorkerService.start();
    
    return NextResponse.json({
      success: true,
      message: 'Notification worker запущен',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error starting worker:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const authUser = getAuthUser(request);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Только админы могут управлять worker'ом
    if (authUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    notificationWorkerService.stop();
    
    return NextResponse.json({
      success: true,
      message: 'Notification worker остановлен',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error stopping worker:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const authUser = getAuthUser(request);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Только админы могут управлять worker'ом
    if (authUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    let body = {};
    try {
      const text = await request.text();
      if (text) {
        body = JSON.parse(text);
      }
    } catch (error) {
      // Если нет тела запроса или ошибка парсинга, продолжаем с пустым объектом
      console.log('No body or parsing error, continuing with manual processing');
    }
    
    // Если передан интервал, изменяем его
    if (body.intervalMs) {
      try {
        notificationWorkerService.setInterval(body.intervalMs);
        return NextResponse.json({
          success: true,
          message: `Интервал изменен на ${body.intervalMs / 1000 / 60} минут`,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        return NextResponse.json({ 
          error: error instanceof Error ? error.message : 'Invalid interval' 
        }, { status: 400 });
      }
    }

    // Иначе обрабатываем уведомления вручную
    const result = await notificationWorkerService.processNotificationsManually();
    
    return NextResponse.json({
      success: result.success,
      message: result.success ? 'Уведомления обработаны' : 'Ошибка обработки',
      results: result.results,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error processing notifications manually:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
