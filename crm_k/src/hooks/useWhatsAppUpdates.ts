import { useEffect, useRef } from 'react';

interface WhatsAppUpdate {
  type: 'connected' | 'heartbeat' | 'new_message' | 'chat_update';
  message?: string;
  timestamp?: string;
  chatId?: string;
  data?: any;
}

export function useWhatsAppUpdates(onUpdate: (update: WhatsAppUpdate) => void) {
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    // Создаем соединение с Server-Sent Events
    const eventSource = new EventSource('/api/whatsapp/websocket');
    eventSourceRef.current = eventSource;

    eventSource.onmessage = (event) => {
      try {
        const update: WhatsAppUpdate = JSON.parse(event.data);
        onUpdate(update);
      } catch (error) {
        console.error('Error parsing WhatsApp update:', error);
      }
    };

    eventSource.onerror = (error) => {
      console.error('WhatsApp SSE error:', error);
      // Переподключаемся через 5 секунд
      setTimeout(() => {
        if (eventSourceRef.current?.readyState === EventSource.CLOSED) {
          eventSourceRef.current = new EventSource('/api/whatsapp/websocket');
        }
      }, 5000);
    };

    return () => {
      eventSource.close();
      eventSourceRef.current = null;
    };
  }, [onUpdate]);

  return {
    isConnected: eventSourceRef.current?.readyState === EventSource.OPEN
  };
}
