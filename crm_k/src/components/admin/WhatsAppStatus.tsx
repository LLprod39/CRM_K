'use client';

import { useState, useEffect } from 'react';
import { MessageSquare, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import { apiRequest } from '@/lib/api';

export default function WhatsAppStatus() {
  const [status, setStatus] = useState<{
    ready: boolean;
    qrCode?: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchStatus = async () => {
    try {
      const response = await apiRequest('/api/whatsapp?action=status');
      if (response.ok) {
        const data = await response.json();
        setStatus(data);
      }
    } catch (error) {
      console.error('Ошибка получения статуса WhatsApp:', error);
    }
  };

  const initializeWhatsApp = async () => {
    setLoading(true);
    try {
      const response = await apiRequest('/api/whatsapp?action=init');
      if (response.ok) {
        console.log('WhatsApp клиент инициализирован');
        await fetchStatus();
      }
    } catch (error) {
      console.error('Ошибка инициализации WhatsApp клиента:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    // Обновляем статус каждые 10 секунд
    const interval = setInterval(fetchStatus, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <MessageSquare className="w-5 h-5 text-green-600 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900">
            WhatsApp Status
          </h3>
        </div>
        <button
          onClick={fetchStatus}
          className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
          title="Обновить статус"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      <div className="space-y-4">
        {/* Статус */}
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center">
            {status?.ready ? (
              <CheckCircle className="w-5 h-5 text-green-600 mr-3" />
            ) : (
              <XCircle className="w-5 h-5 text-red-600 mr-3" />
            )}
            <div>
              <p className="text-sm font-medium text-gray-700">Статус</p>
              <p className={`text-sm font-semibold ${
                status?.ready ? 'text-green-600' : 'text-red-600'
              }`}>
                {status?.ready ? '🟢 Готов к отправке' : '🔴 Не готов'}
              </p>
            </div>
          </div>
          <button
            onClick={initializeWhatsApp}
            disabled={loading || status?.ready}
            className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Инициализация...' : 'Инициализировать'}
          </button>
        </div>

        {/* QR код */}
        {status?.qrCode && !status.ready && (
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h4 className="text-sm font-medium text-blue-900 mb-3">QR код для авторизации</h4>
            <div className="text-center">
              <img 
                src={status.qrCode} 
                alt="WhatsApp QR Code" 
                className="mx-auto max-w-48"
              />
              <p className="text-xs text-blue-600 mt-2">
                Отсканируйте QR код в WhatsApp для авторизации
              </p>
            </div>
          </div>
        )}

        {/* Информация */}
        <div className="text-xs text-gray-500 bg-green-50 p-3 rounded-lg">
          <p className="font-medium mb-1">ℹ️ Информация:</p>
          <ul className="space-y-1">
            <li>• WhatsApp клиент автоматически инициализируется при загрузке админ-панели</li>
            <li>• Для первой авторизации потребуется отсканировать QR код</li>
            <li>• После авторизации клиент будет готов к отправке уведомлений</li>
            <li>• Статус обновляется каждые 10 секунд</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
