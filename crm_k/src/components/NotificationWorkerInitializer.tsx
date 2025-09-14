'use client';

import { useEffect } from 'react';
import { useAuth } from '@/presentation/contexts';

/**
 * Компонент для автоматического запуска notification worker'а
 * Запускается только для админов
 */
export default function NotificationWorkerInitializer() {
  const { user } = useAuth();

  useEffect(() => {
    // Запускаем worker только для админов
    if (user?.role === 'ADMIN') {
      // Импортируем и запускаем worker только на сервере
      if (typeof window === 'undefined') {
        import('@/lib/notification-worker').then(({ notificationWorkerService }) => {
          notificationWorkerService.start();
        }).catch((error) => {
          console.error('Ошибка запуска notification worker:', error);
        });
      }
    }
  }, [user]);

  // Этот компонент не рендерит ничего видимого
  return null;
}
