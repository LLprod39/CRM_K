'use client';

import { useState, useEffect } from 'react';
import { Clock, Utensils, AlertCircle, CheckCircle, Edit3, Trash2, X, Save } from 'lucide-react';
import { apiRequest } from '@/lib/api';

interface LunchTimeSelectorProps {
  date: Date;
  existingLessons: any[];
  onLunchTimeChange?: (lunchBreak: any) => void;
  onLunchTimeRemove?: () => void;
  userRole?: 'ADMIN' | 'USER';
}

interface LunchBreak {
  id: number;
  date: string;
  startTime: string;
  endTime: string;
  userId: number;
  user?: {
    id: number;
    name: string;
    email: string;
  };
}

export default function LunchTimeSelector({ 
  date, 
  existingLessons, 
  onLunchTimeChange,
  onLunchTimeRemove,
  userRole = 'USER'
}: LunchTimeSelectorProps) {
  const [lunchBreak, setLunchBreak] = useState<LunchBreak | null>(null);
  const [allLunchBreaks, setAllLunchBreaks] = useState<LunchBreak[]>([]);
  const [startTime, setStartTime] = useState('12:00');
  const [endTime, setEndTime] = useState('13:00');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingLunch, setEditingLunch] = useState<number | null>(null);
  const [editStartTime, setEditStartTime] = useState('');
  const [editEndTime, setEditEndTime] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<number | null>(null);

  // Загружаем существующее время обеда
  useEffect(() => {
    loadLunchBreak();
  }, [date]);


  const loadLunchBreak = async () => {
    try {
      setLoading(true);
      const response = await apiRequest(`/api/lunch-breaks?date=${date.toISOString().split('T')[0]}`);
      const data = await response.json();
      
      if (userRole === 'ADMIN' && data.lunchBreaks) {
        setAllLunchBreaks(data.lunchBreaks);
        // Для админа показываем первый обед как основной
        if (data.lunchBreaks.length > 0) {
          setLunchBreak(data.lunchBreaks[0]);
          const start = new Date(data.lunchBreaks[0].startTime);
          const end = new Date(data.lunchBreaks[0].endTime);
          setStartTime(start.toTimeString().slice(0, 5));
          setEndTime(end.toTimeString().slice(0, 5));
        }
      } else if (data.lunchBreak) {
        setLunchBreak(data.lunchBreak);
        const start = new Date(data.lunchBreak.startTime);
        const end = new Date(data.lunchBreak.endTime);
        setStartTime(start.toTimeString().slice(0, 5));
        setEndTime(end.toTimeString().slice(0, 5));
      }
    } catch (error) {
      console.error('Ошибка при загрузке времени обеда:', error);
    } finally {
      setLoading(false);
    }
  };


  const handleSave = async () => {
    if (!startTime || !endTime) {
      setError('Пожалуйста, выберите время начала и окончания обеда');
      return;
    }


    // Админ не может добавлять собственные обеды
    if (userRole === 'ADMIN') {
      setError('Администратор не может добавлять собственные обеды');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const startDateTime = new Date(date);
      const [startHour, startMinute] = startTime.split(':').map(Number);
      startDateTime.setHours(startHour, startMinute, 0, 0);

      const endDateTime = new Date(date);
      const [endHour, endMinute] = endTime.split(':').map(Number);
      endDateTime.setHours(endHour, endMinute, 0, 0);

      const response = await apiRequest('/api/lunch-breaks', {
        method: 'POST',
        body: JSON.stringify({
          date: date.toISOString().split('T')[0],
          startTime: startDateTime.toISOString(),
          endTime: endDateTime.toISOString()
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Ошибка при сохранении времени обеда');
      }
      
      const data = await response.json();

      setLunchBreak(data.lunchBreak);
      onLunchTimeChange?.(data.lunchBreak);
    } catch (error: any) {
      console.error('Ошибка при сохранении времени обеда:', error);
      setError(error.message || 'Ошибка при сохранении времени обеда');
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (lunchBreakId?: number) => {
    try {
      setLoading(true);
      setError(null);

      const url = lunchBreakId && userRole === 'ADMIN' 
        ? `/api/lunch-breaks?date=${date.toISOString().split('T')[0]}&lunchBreakId=${lunchBreakId}`
        : `/api/lunch-breaks?date=${date.toISOString().split('T')[0]}`;

      const response = await apiRequest(url, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Ошибка при удалении времени обеда');
      }

      if (lunchBreakId && userRole === 'ADMIN') {
        // Обновляем список обедов для админа
        setAllLunchBreaks(prev => prev.filter(lunch => lunch.id !== lunchBreakId));
        if (lunchBreak?.id === lunchBreakId) {
          setLunchBreak(null);
          setStartTime('12:00');
          setEndTime('13:00');
        }
      } else {
        setLunchBreak(null);
        setStartTime('12:00');
        setEndTime('13:00');
      }
      
      onLunchTimeRemove?.();
    } catch (error: any) {
      console.error('Ошибка при удалении времени обеда:', error);
      setError(error.message || 'Ошибка при удалении времени обеда');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async (lunchBreakId: number, newStartTime: string, newEndTime: string) => {
    try {
      setLoading(true);
      setError(null);

      const startDateTime = new Date(date);
      const [startHour, startMinute] = newStartTime.split(':').map(Number);
      startDateTime.setHours(startHour, startMinute, 0, 0);

      const endDateTime = new Date(date);
      const [endHour, endMinute] = newEndTime.split(':').map(Number);
      endDateTime.setHours(endHour, endMinute, 0, 0);

      const response = await apiRequest('/api/lunch-breaks', {
        method: 'PUT',
        body: JSON.stringify({
          lunchBreakId,
          date: date.toISOString().split('T')[0],
          startTime: startDateTime.toISOString(),
          endTime: endDateTime.toISOString()
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Ошибка при обновлении времени обеда');
      }

      const data = await response.json();
      
      // Обновляем список обедов
      setAllLunchBreaks(prev => 
        prev.map(lunch => lunch.id === lunchBreakId ? data.lunchBreak : lunch)
      );

      if (lunchBreak?.id === lunchBreakId) {
        setLunchBreak(data.lunchBreak);
        setStartTime(newStartTime);
        setEndTime(newEndTime);
      }

      onLunchTimeChange?.(data.lunchBreak);
    } catch (error: any) {
      console.error('Ошибка при обновлении времени обеда:', error);
      setError(error.message || 'Ошибка при обновлении времени обеда');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (time: string) => {
    return time;
  };

  const startEdit = (lunch: LunchBreak) => {
    setEditingLunch(lunch.id);
    setEditStartTime(new Date(lunch.startTime).toTimeString().slice(0, 5));
    setEditEndTime(new Date(lunch.endTime).toTimeString().slice(0, 5));
  };

  const cancelEdit = () => {
    setEditingLunch(null);
    setEditStartTime('');
    setEditEndTime('');
  };

  const saveEdit = async (lunchId: number) => {
    if (!editStartTime || !editEndTime) {
      setError('Пожалуйста, заполните все поля');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await handleEdit(lunchId, editStartTime, editEndTime);
      setEditingLunch(null);
      setEditStartTime('');
      setEditEndTime('');
    } catch (error) {
      console.error('Ошибка при сохранении:', error);
    } finally {
      setLoading(false);
    }
  };

  const confirmDelete = (lunchId: number) => {
    setShowDeleteConfirm(lunchId);
  };

  const cancelDelete = () => {
    setShowDeleteConfirm(null);
  };

  const executeDelete = async (lunchId: number) => {
    try {
      setLoading(true);
      setError(null);
      await handleRemove(lunchId);
      setShowDeleteConfirm(null);
    } catch (error) {
      console.error('Ошибка при удалении:', error);
    } finally {
      setLoading(false);
    }
  };

  // Для админа показываем компактный интерфейс как у пользователей
  if (userRole === 'ADMIN') {
    return (
      <>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {allLunchBreaks.length > 0 ? (
            allLunchBreaks.map((lunch) => (
              <div key={lunch.id} className={`bg-white border rounded-lg p-3 shadow-sm ${
                lunchBreak?.id === lunch.id 
                  ? 'border-green-200 bg-green-50' 
                  : 'border-gray-200'
              }`}>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <div className="p-1 bg-blue-100 rounded">
                      <Utensils className="w-4 h-4 text-blue-600" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-gray-700">
                        {lunch.user?.name || `Пользователь #${lunch.userId}`}
                      </span>
                      {editingLunch === lunch.id ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="time"
                            value={editStartTime}
                            onChange={(e) => setEditStartTime(e.target.value)}
                            className="px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                          />
                          <span className="text-gray-400">–</span>
                          <input
                            type="time"
                            value={editEndTime}
                            onChange={(e) => setEditEndTime(e.target.value)}
                            className="px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                          />
                        </div>
                      ) : (
                        <span className="text-xs text-green-600 font-medium">
                          {formatTime(new Date(lunch.startTime).toTimeString().slice(0, 5))} - {formatTime(new Date(lunch.endTime).toTimeString().slice(0, 5))}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    {editingLunch === lunch.id ? (
                      <>
                        <button
                          onClick={() => saveEdit(lunch.id)}
                          disabled={loading}
                          className="p-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                          title={loading ? 'Сохранение...' : 'Сохранить'}
                        >
                          {loading ? (
                            <Clock className="w-4 h-4 animate-spin" />
                          ) : (
                            <CheckCircle className="w-4 h-4" />
                          )}
                        </button>
                        <button
                          onClick={cancelEdit}
                          disabled={loading}
                          className="p-1.5 text-gray-400 hover:text-red-600 transition-colors"
                          title="Отмена"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => startEdit(lunch)}
                          disabled={loading}
                          className="p-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          title="Редактировать обед"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => confirmDelete(lunch.id)}
                          disabled={loading}
                          className="p-1.5 text-gray-400 hover:text-red-600 transition-colors"
                          title="Удалить обед"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm md:col-span-2">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <div className="p-1 bg-red-100 rounded">
                    <Utensils className="w-4 h-4 text-red-600" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-gray-700">Обеды преподавателей:</span>
                    <span className="text-xs text-red-600 font-medium">Не запланирован</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {error && (
          <div className="mt-2 bg-red-50 border border-red-200 rounded p-2">
            <div className="flex items-center gap-1 mb-1">
              <AlertCircle className="w-3 h-3 text-red-600" />
              <span className="text-xs font-medium text-red-800">Ошибка</span>
            </div>
            <div className="text-xs text-red-700">{error}</div>
          </div>
        )}

        {/* Модальное окно подтверждения удаления */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-hidden border border-gray-200">
              {/* Заголовок */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-red-100 rounded-lg">
                    <Trash2 className="w-5 h-5 text-red-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Удалить обед</h3>
                    <p className="text-sm text-gray-600">
                      Это действие нельзя отменить
                    </p>
                  </div>
                </div>
                <button
                  onClick={cancelDelete}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Контент */}
              <div className="p-6">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                  <div className="flex items-start space-x-3">
                    <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-red-800 mb-1">
                        Подтверждение удаления
                      </p>
                      <p className="text-sm text-red-700">
                        Вы уверены, что хотите удалить обед для этого учителя? 
                        Это действие нельзя отменить.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Кнопки */}
                <div className="flex gap-3">
                  <button
                    onClick={() => executeDelete(showDeleteConfirm)}
                    disabled={loading}
                    className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <Clock className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                    {loading ? 'Удаление...' : 'Удалить обед'}
                  </button>
                  <button
                    onClick={cancelDelete}
                    disabled={loading}
                    className="flex-1 border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                  >
                    Отмена
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  // Для обычных пользователей показываем компактную форму настройки обеда
  return (
    <div className={`bg-white border rounded-lg p-3 shadow-sm max-w-md ${
      lunchBreak 
        ? 'border-green-200 bg-green-50' 
        : 'border-orange-200 bg-orange-50'
    }`}>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className={`p-1 rounded ${lunchBreak ? 'bg-blue-100' : 'bg-red-100'}`}>
            <Utensils className={`w-4 h-4 ${lunchBreak ? 'text-blue-600' : 'text-red-600'}`} />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-medium text-gray-700">Время обеда:</span>
            {lunchBreak ? (
              <span className="text-xs text-green-600 font-medium">
                {formatTime(new Date(lunchBreak.startTime).toTimeString().slice(0, 5))} - {formatTime(new Date(lunchBreak.endTime).toTimeString().slice(0, 5))}
              </span>
            ) : (
              <span className="text-xs text-red-600 font-medium">Нужно запланировать</span>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <input
            type="time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            className="px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors"
          />
          <span className="text-gray-400">–</span>
          <input
            type="time"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            className="px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors"
          />
        </div>

        <button
          onClick={handleSave}
          disabled={loading}
          className="p-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          title={lunchBreak ? 'Обновить обед' : 'Сохранить обед'}
        >
          {loading ? (
            <Clock className="w-4 h-4 animate-spin" />
          ) : (
            <CheckCircle className="w-4 h-4" />
          )}
        </button>

        {lunchBreak && (
          <button
            onClick={() => handleRemove()}
            disabled={loading}
            className="p-1.5 text-gray-400 hover:text-red-600 transition-colors"
            title="Удалить обед"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      {error && (
        <div className="mt-2 bg-red-50 border border-red-200 rounded p-2">
          <div className="flex items-center gap-1 mb-1">
            <AlertCircle className="w-3 h-3 text-red-600" />
            <span className="text-xs font-medium text-red-800">Ошибка</span>
          </div>
          <div className="text-xs text-red-700">{error}</div>
        </div>
      )}
    </div>
  );
}
