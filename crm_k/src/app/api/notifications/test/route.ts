import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const authUser = getAuthUser(request);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { phoneNumber, template } = await request.json();

    if (!phoneNumber || !template) {
      return NextResponse.json({ error: 'Phone number and template are required' }, { status: 400 });
    }

    // Создаем тестовое сообщение, заменяя переменные на примеры
    const testMessage = template
      .replace(/{minutes}/g, '60')
      .replace(/{studentName}/g, 'Тестовый Ученик')
      .replace(/{time}/g, '14:00')
      .replace(/{location}/g, 'Офис')
      .replace(/{teacherName}/g, 'Тестовый Преподаватель')
      .replace(/{date}/g, new Date().toLocaleDateString('ru-RU'))
      .replace(/{completedLessons}/g, '5')
      .replace(/{upcomingLessons}/g, '3')
      .replace(/{dailyRevenue}/g, '15000');

    // Сначала проверяем статус WhatsApp клиента
    const statusResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/whatsapp?action=status`);
    const statusData = await statusResponse.json();
    
    if (!statusData.ready) {
      return NextResponse.json({ 
        error: 'WhatsApp клиент не готов',
        details: 'Необходимо инициализировать WhatsApp клиент перед отправкой сообщений',
        status: statusData,
        suggestion: 'Перейдите в админ-панель и инициализируйте WhatsApp клиент'
      }, { status: 400 });
    }

    // Отправляем тестовое сообщение через WhatsApp API
    const whatsappResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/whatsapp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'send',
        phoneNumber: phoneNumber,
        message: `🧪 ТЕСТОВОЕ УВЕДОМЛЕНИЕ\n\n${testMessage}\n\n⚠️ Это тестовое сообщение из CRM системы`
      })
    });

    if (!whatsappResponse.ok) {
      const errorData = await whatsappResponse.json();
      return NextResponse.json({ 
        error: 'Ошибка отправки WhatsApp сообщения',
        details: errorData.error || 'Неизвестная ошибка',
        statusCode: whatsappResponse.status
      }, { status: whatsappResponse.status });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Test notification sent successfully' 
    });
  } catch (error) {
    console.error('Error sending test notification:', error);
    
    // Если это ошибка сети или fetch
    if (error instanceof TypeError && error.message.includes('fetch')) {
      return NextResponse.json({ 
        error: 'Ошибка подключения к WhatsApp API',
        details: 'Не удается подключиться к серверу WhatsApp',
        suggestion: 'Проверьте, что сервер запущен и доступен'
      }, { status: 503 });
    }
    
    return NextResponse.json({ 
      error: 'Внутренняя ошибка сервера',
      details: error instanceof Error ? error.message : 'Неизвестная ошибка',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
