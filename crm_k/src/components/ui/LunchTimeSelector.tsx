'use client';

import { useState, useEffect } from 'react';
import { Clock, Utensils, AlertCircle, CheckCircle } from 'lucide-react';
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
  const [conflicts, setConflicts] = useState<any[]>([]);

  // Загружаем существующее время обеда
  useEffect(() => {
    loadLunchBreak();
  }, [date]);

  // Проверяем конфликты при изменении времени
  useEffect(() => {
    checkConflicts();
  }, [startTime, endTime, existingLessons]);

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

  const checkConflicts = () => {
    if (!startTime || !endTime) {
      setConflicts([]);
      return;
    }

    const startDateTime = new Date(date);
    const [startHour, startMinute] = startTime.split(':').map(Number);
    startDateTime.setHours(startHour, startMinute, 0, 0);

    const endDateTime = new Date(date);
    const [endHour, endMinute] = endTime.split(':').map(Number);
    endDateTime.setHours(endHour, endMinute, 0, 0);

    const conflicts = existingLessons.filter(lesson => {
      const lessonStart = new Date(lesson.date);
      const lessonEnd = lesson.endTime ? new Date(lesson.endTime) : new Date(lessonStart.getTime() + 60 * 60 * 1000);
      
      return (
        (lessonStart < endDateTime && lessonEnd > startDateTime)
      );
    });

    setConflicts(conflicts);
  };

  const handleSave = async () => {
    if (!startTime || !endTime) {
      setError('Пожалуйста, выберите время начала и окончания обеда');
      return;
    }

    if (conflicts.length > 0) {
      setError('Выбранное время обеда конфликтует с существующими занятиями');
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

  return (
    <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
      <div className="flex items-center gap-2 mb-4">
        <Utensils className="w-5 h-5 text-orange-600" />
        <h3 className="text-lg font-semibold text-orange-800">Время обеда</h3>
        {lunchBreak && (
          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-orange-100 text-orange-700 rounded-full">
            <CheckCircle className="w-3 h-3" />
            Настроено
          </span>
        )}
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Начало обеда
            </label>
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Конец обеда
            </label>
            <input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            />
          </div>
        </div>

        {conflicts.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="w-4 h-4 text-red-600" />
              <span className="text-sm font-medium text-red-800">Конфликт с занятиями</span>
            </div>
            <div className="space-y-1">
              {conflicts.map((lesson) => (
                <div key={lesson.id} className="text-sm text-red-700">
                  • {lesson.student?.fullName || `Ученик #${lesson.studentId}`} - {formatTime(new Date(lesson.date).toTimeString().slice(0, 5))}
                </div>
              ))}
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600" />
              <span className="text-sm text-red-800">{error}</span>
            </div>
          </div>
        )}

        {/* Кнопки только для обычных пользователей */}
        {userRole !== 'ADMIN' && (
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={loading || conflicts.length > 0}
              className="flex-1 bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors duration-200 flex items-center justify-center gap-2"
            >
              {loading ? (
                <Clock className="w-4 h-4 animate-spin" />
              ) : (
                <CheckCircle className="w-4 h-4" />
              )}
              {lunchBreak ? 'Обновить' : 'Сохранить'}
            </button>
            
            {lunchBreak && (
              <button
                onClick={() => handleRemove()}
                disabled={loading}
                className="px-4 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
              >
                Удалить
              </button>
            )}
          </div>
        )}

        {/* Информация для админа */}
        {userRole === 'ADMIN' && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-800">Режим администратора</span>
            </div>
            <p className="text-sm text-blue-700">
              Вы можете редактировать и удалять обеды других пользователей в списке ниже, но не можете добавлять собственные обеды.
            </p>
          </div>
        )}

        {/* Отображение всех обедов для админа */}
        {userRole === 'ADMIN' && allLunchBreaks.length > 0 && (
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="text-sm font-medium text-blue-900 mb-3 flex items-center gap-2">
              <Utensils className="w-4 h-4" />
              Обеды всех учителей
            </h4>
            <div className="space-y-2">
              {allLunchBreaks.map((lunch) => (
                <div key={lunch.id} className="flex items-center justify-between p-3 bg-white rounded border hover:shadow-sm transition-shadow">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                    <div>
                      <span className="text-sm font-medium text-gray-900">
                        {lunch.user?.name || `Пользователь #${lunch.userId}`}
                      </span>
                      <div className="text-sm text-gray-600">
                        {formatTime(new Date(lunch.startTime).toTimeString().slice(0, 5))} - {formatTime(new Date(lunch.endTime).toTimeString().slice(0, 5))}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        const newStartTime = prompt('Новое время начала (HH:MM):', new Date(lunch.startTime).toTimeString().slice(0, 5));
                        const newEndTime = prompt('Новое время окончания (HH:MM):', new Date(lunch.endTime).toTimeString().slice(0, 5));
                        if (newStartTime && newEndTime) {
                          handleEdit(lunch.id, newStartTime, newEndTime);
                        }
                      }}
                      disabled={loading}
                      className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                    >
                      Редактировать
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Удалить обед для ${lunch.user?.name || `Пользователя #${lunch.userId}`}?`)) {
                          handleRemove(lunch.id);
                        }
                      }}
                      disabled={loading}
                      className="px-3 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                    >
                      Удалить
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
