import { notificationWorkerService } from '@/lib/notification-worker';

/**
 * Серверный компонент для инициализации notification worker'а
 * Запускается автоматически при старте приложения
 */
export default function NotificationWorkerServerInit() {
  // Запускаем worker при инициализации сервера
  notificationWorkerService.start();

  // Этот компонент не рендерит ничего видимого
  return null;
}
