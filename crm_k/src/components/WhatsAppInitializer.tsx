import { useEffect } from 'react';

/**
 * Компонент для автоматической инициализации WhatsApp клиента
 * Запускается только для админов
 */
export default function WhatsAppInitializer() {
  useEffect(() => {
    // Инициализируем WhatsApp клиент при загрузке страницы
    const initializeWhatsApp = async () => {
      try {
        const response = await fetch('/api/whatsapp?action=init');
        if (response.ok) {
          console.log('WhatsApp клиент инициализирован');
        }
      } catch (error) {
        console.error('Ошибка инициализации WhatsApp клиента:', error);
      }
    };

    initializeWhatsApp();
  }, []);

  // Этот компонент не рендерит ничего видимого
  return null;
}
