/**
 * Сервис для автоматической отправки запланированных уведомлений
 * Интегрирован в веб-приложение
 */

import { prisma } from './db';

export class NotificationWorkerService {
  private intervalId: NodeJS.Timeout | null = null;
  private isRunning = false;
  private intervalMs = 5 * 60 * 1000; // 5 минут (по умолчанию)

  /**
   * Запуск worker'а
   */
  start(): void {
    if (this.isRunning) {
      console.log('Notification worker уже запущен');
      return;
    }

    console.log('🚀 Запуск Notification Worker Service...');
    this.isRunning = true;

    // Запускаем сразу
    this.processNotifications();

    // Затем каждые 5 минут
    this.intervalId = setInterval(() => {
      this.processNotifications();
    }, this.intervalMs);

    console.log(`✅ Notification Worker запущен (интервал: ${this.intervalMs / 1000} секунд)`);
  }

  /**
   * Остановка worker'а
   */
  stop(): void {
    if (!this.isRunning) {
      console.log('Notification worker не запущен');
      return;
    }

    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    this.isRunning = false;
    console.log('⏹️ Notification Worker остановлен');
  }

  /**
   * Получение статуса worker'а
   */
  getStatus(): { isRunning: boolean; intervalMs: number } {
    return {
      isRunning: this.isRunning,
      intervalMs: this.intervalMs
    };
  }

  /**
   * Изменение интервала worker'а
   */
  setInterval(intervalMs: number): void {
    if (intervalMs < 60000) { // Минимум 1 минута
      throw new Error('Интервал не может быть меньше 1 минуты');
    }

    this.intervalMs = intervalMs;
    
    // Если worker запущен, перезапускаем с новым интервалом
    if (this.isRunning) {
      this.stop();
      this.start();
    }

    console.log(`🔄 Интервал worker'а изменен на ${intervalMs / 1000 / 60} минут`);
  }

  /**
   * Обработка запланированных уведомлений
   */
  private async processNotifications(): Promise<void> {
    try {
      console.log(`[${new Date().toISOString()}] Обработка запланированных уведомлений...`);
      
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

      // Также обрабатываем уведомления экстрактора
      await this.processExtractorNotifications();

      if (pendingNotifications.length === 0) {
        console.log('Нет уведомлений для отправки');
        return;
      }

      console.log(`Найдено ${pendingNotifications.length} уведомлений для отправки`);

      const results = {
        processed: 0,
        sent: 0,
        failed: 0,
        errors: [] as string[]
      };

      for (const notification of pendingNotifications) {
        results.processed++;
        
        try {
          // Сначала проверяем статус WhatsApp клиента
          const statusResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/whatsapp?action=status`);
          const statusData = await statusResponse.json();
          
          if (!statusData.ready) {
            console.log('WhatsApp клиент не готов, пропускаем уведомление');
            // Помечаем как ошибку, но не критическую
            await prisma.scheduledNotification.update({
              where: { id: notification.id },
              data: {
                errorMessage: 'WhatsApp client not ready - will retry later'
              }
            });
            results.failed++;
            results.errors.push(`Notification ${notification.id}: WhatsApp client not ready`);
            continue;
          }

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
            console.log(`✅ Уведомление ${notification.id} отправлено`);
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
            console.error(`❌ Ошибка отправки уведомления ${notification.id}: ${errorMessage}`);
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
          console.error(`❌ Ошибка обработки уведомления ${notification.id}: ${errorMessage}`);
        }
      }

      console.log(`[${new Date().toISOString()}] Worker завершен:`, {
        processed: results.processed,
        sent: results.sent,
        failed: results.failed
      });

      if (results.errors.length > 0) {
        console.error('Ошибки:', results.errors);
      }

    } catch (error) {
      console.error(`[${new Date().toISOString()}] Ошибка в notification worker:`, error);
    }
  }

  /**
   * Ручная обработка уведомлений (для тестирования)
   */
  async processNotificationsManually(): Promise<{
    success: boolean;
    results: {
      processed: number;
      sent: number;
      failed: number;
      errors: string[];
    };
  }> {
    try {
      await this.processNotifications();
      return {
        success: true,
        results: {
          processed: 0,
          sent: 0,
          failed: 0,
          errors: []
        }
      };
    } catch (error) {
      return {
        success: false,
        results: {
          processed: 0,
          sent: 0,
          failed: 0,
          errors: [error instanceof Error ? error.message : 'Unknown error']
        }
      };
    }
  }

  /**
   * Обработка уведомлений экстрактора
   */
  private async processExtractorNotifications(): Promise<void> {
    try {
      console.log(`[${new Date().toISOString()}] Обработка уведомлений экстрактора...`);
      
      // Получаем уведомления экстрактора, которые требуют внимания
      const extractorNotifications = await prisma.extractorNotification.findMany({
        where: {
          status: 'pending',
          createdAt: {
            // Уведомления старше 5 минут считаем просроченными
            lte: new Date(Date.now() - 5 * 60 * 1000)
          }
        },
        include: {
          conversationDraft: {
            include: {
              conversationMessages: {
                orderBy: { createdAt: 'desc' },
                take: 3
              }
            }
          }
        },
        orderBy: {
          createdAt: 'asc'
        },
        take: 10 // Обрабатываем максимум 10 уведомлений за раз
      });

      if (extractorNotifications.length === 0) {
        console.log('Нет уведомлений экстрактора для обработки');
        return;
      }

      console.log(`Найдено ${extractorNotifications.length} уведомлений экстрактора для обработки`);

      for (const notification of extractorNotifications) {
        try {
          // Определяем приоритет уведомления
          let shouldNotify = false;
          let notificationMessage = '';

          switch (notification.type) {
            case 'low_confidence':
              shouldNotify = true;
              notificationMessage = `⚠️ Низкая уверенность экстракции (${Math.round(notification.confidence * 100)}%) в чате ${notification.conversationId}`;
              break;
            case 'validation_error':
              shouldNotify = true;
              notificationMessage = `❌ Ошибка валидации данных в чате ${notification.conversationId}`;
              break;
            case 'missing_fields':
              shouldNotify = true;
              notificationMessage = `📝 Отсутствуют обязательные поля в чате ${notification.conversationId}`;
              break;
            case 'ready_for_review':
              // Уведомляем только если данные готовы к подтверждению
              if (notification.conversationDraft?.isComplete) {
                shouldNotify = true;
                notificationMessage = `✅ Данные готовы к подтверждению в чате ${notification.conversationId}`;
              }
              break;
          }

          if (shouldNotify) {
            // Здесь можно добавить отправку уведомления оператору
            // Например, через email, push-уведомление или внутреннюю систему уведомлений
            console.log(`📢 Уведомление оператору: ${notificationMessage}`);
            
            // Помечаем уведомление как обработанное
            await prisma.extractorNotification.update({
              where: { id: notification.id },
              data: {
                status: 'acknowledged',
                acknowledgedAt: new Date(),
                metadata: {
                  ...notification.metadata as any,
                  workerProcessed: true,
                  processedAt: new Date().toISOString()
                }
              }
            });

            console.log(`✅ Уведомление ${notification.id} обработано`);
          }
        } catch (error) {
          console.error(`❌ Ошибка обработки уведомления ${notification.id}:`, error);
          
          // Помечаем уведомление как имеющее ошибку
          await prisma.extractorNotification.update({
            where: { id: notification.id },
            data: {
              metadata: {
                ...notification.metadata as any,
                workerError: error instanceof Error ? error.message : 'Unknown error',
                errorAt: new Date().toISOString()
              }
            }
          });
        }
      }

      console.log(`[${new Date().toISOString()}] Обработка уведомлений экстрактора завершена`);
    } catch (error) {
      console.error(`[${new Date().toISOString()}] Ошибка в обработке уведомлений экстрактора:`, error);
    }
  }
}

// Создаем единственный экземпляр сервиса
export const notificationWorkerService = new NotificationWorkerService();
