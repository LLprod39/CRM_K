'use client';

import { useState, useEffect } from 'react';
import { Play, Square, RefreshCw, Activity, Settings } from 'lucide-react';
import { apiRequest } from '@/lib/api';

interface WorkerStatus {
  isRunning: boolean;
  intervalMs: number;
}

export default function NotificationWorkerManager() {
  const [status, setStatus] = useState<WorkerStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [showIntervalSettings, setShowIntervalSettings] = useState(false);
  const [newInterval, setNewInterval] = useState(5); // минуты

  const fetchStatus = async () => {
    try {
      const response = await apiRequest('/api/notifications/worker-manager');
      if (response.ok) {
        const data = await response.json();
        setStatus(data.status);
        setLastUpdate(new Date());
      }
    } catch (error) {
      console.error('Ошибка получения статуса worker:', error);
    }
  };

  const startWorker = async () => {
    setLoading(true);
    try {
      const response = await apiRequest('/api/notifications/worker-manager', {
        method: 'POST'
      });
      if (response.ok) {
        await fetchStatus();
      }
    } catch (error) {
      console.error('Ошибка запуска worker:', error);
    } finally {
      setLoading(false);
    }
  };

  const stopWorker = async () => {
    setLoading(true);
    try {
      const response = await apiRequest('/api/notifications/worker-manager', {
        method: 'DELETE'
      });
      if (response.ok) {
        await fetchStatus();
      }
    } catch (error) {
      console.error('Ошибка остановки worker:', error);
    } finally {
      setLoading(false);
    }
  };

  const processManually = async () => {
    setLoading(true);
    try {
      const response = await apiRequest('/api/notifications/worker-manager', {
        method: 'PUT'
      });
      if (response.ok) {
        const data = await response.json();
        console.log('Результат обработки:', data.results);
        await fetchStatus();
      }
    } catch (error) {
      console.error('Ошибка ручной обработки:', error);
    } finally {
      setLoading(false);
    }
  };

  const changeInterval = async () => {
    if (newInterval < 1) {
      alert('Интервал не может быть меньше 1 минуты');
      return;
    }

    setLoading(true);
    try {
      const response = await apiRequest('/api/notifications/worker-manager', {
        method: 'PUT',
        body: JSON.stringify({
          intervalMs: newInterval * 60 * 1000 // конвертируем в миллисекунды
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('Интервал изменен:', data.message);
        await fetchStatus();
        setShowIntervalSettings(false);
      } else {
        const errorData = await response.json();
        alert(`Ошибка: ${errorData.error}`);
      }
    } catch (error) {
      console.error('Ошибка изменения интервала:', error);
      alert('Ошибка изменения интервала');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    // Обновляем статус каждые 30 секунд
    const interval = setInterval(fetchStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  // Обновляем newInterval при изменении статуса
  useEffect(() => {
    if (status) {
      setNewInterval(status.intervalMs / 1000 / 60);
    }
  }, [status]);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <Activity className="w-5 h-5 text-blue-600 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900">
            Notification Worker
          </h3>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowIntervalSettings(!showIntervalSettings)}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            title="Настройки интервала"
          >
            <Settings className="w-4 h-4" />
          </button>
          <button
            onClick={fetchStatus}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            title="Обновить статус"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {/* Статус */}
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div>
            <p className="text-sm font-medium text-gray-700">Статус</p>
            <p className={`text-sm font-semibold ${
              status?.isRunning ? 'text-green-600' : 'text-red-600'
            }`}>
              {status?.isRunning ? '🟢 Запущен' : '🔴 Остановлен'}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium text-gray-700">Интервал</p>
            <p className="text-sm text-gray-600">
              {status ? `${status.intervalMs / 1000 / 60} мин` : '-'}
            </p>
          </div>
        </div>

        {/* Настройки интервала */}
        {showIntervalSettings && (
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h4 className="text-sm font-medium text-blue-900 mb-3">Настройки интервала</h4>
            <div className="flex items-center space-x-3">
              <label className="text-sm text-blue-700">Интервал проверки:</label>
              <input
                type="number"
                min="1"
                max="60"
                value={newInterval}
                onChange={(e) => setNewInterval(parseInt(e.target.value) || 1)}
                className="w-20 px-2 py-1 border border-blue-300 rounded text-sm"
              />
              <span className="text-sm text-blue-700">минут</span>
              <button
                onClick={changeInterval}
                disabled={loading}
                className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
              >
                Применить
              </button>
              <button
                onClick={() => setShowIntervalSettings(false)}
                className="px-3 py-1 bg-gray-500 text-white rounded text-sm hover:bg-gray-600 transition-colors"
              >
                Отмена
              </button>
            </div>
            <div className="mt-2 text-xs text-blue-600">
              Рекомендуемые значения: 1-5 минут для активного использования, 10-15 минут для экономии ресурсов
            </div>
          </div>
        )}

        {/* Последнее обновление */}
        {lastUpdate && (
          <div className="text-xs text-gray-500 text-center">
            Последнее обновление: {lastUpdate.toLocaleTimeString('ru-RU')}
          </div>
        )}

        {/* Кнопки управления */}
        <div className="flex gap-2">
          <button
            onClick={startWorker}
            disabled={loading || status?.isRunning}
            className="flex-1 flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            <Play className="w-4 h-4 mr-2" />
            Запустить
          </button>
          
          <button
            onClick={stopWorker}
            disabled={loading || !status?.isRunning}
            className="flex-1 flex items-center justify-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            <Square className="w-4 h-4 mr-2" />
            Остановить
          </button>
          
          <button
            onClick={processManually}
            disabled={loading}
            className="flex-1 flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Обработать
          </button>
        </div>

        {/* Информация */}
        <div className="text-xs text-gray-500 bg-blue-50 p-3 rounded-lg">
          <p className="font-medium mb-1">ℹ️ Информация:</p>
          <ul className="space-y-1">
            <li>• Worker автоматически запускается при старте приложения</li>
            <li>• Проверяет уведомления каждые {status ? `${status.intervalMs / 1000 / 60} минут` : '5 минут'}</li>
            <li>• Отправляет уведомления через WhatsApp API</li>
            <li>• Кнопка "Обработать" запускает проверку немедленно</li>
            <li>• Интервал можно изменить через кнопку настроек ⚙️</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
