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
  const [conflicts, setConflicts] = useState<any[]>([]);
  const [editingLunch, setEditingLunch] = useState<number | null>(null);
  const [editStartTime, setEditStartTime] = useState('');
  const [editEndTime, setEditEndTime] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<number | null>(null);

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

  // Для админа показываем только список обедов всех учителей
  if (userRole === 'ADMIN') {
    return (
      <>
        <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Utensils className="w-5 h-5 text-gray-600" />
            <h3 className="text-lg font-semibold text-gray-900">Обеды всех учителей</h3>
          </div>

          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-600" />
                <span className="text-sm text-red-700">{error}</span>
              </div>
            </div>
          )}

          {allLunchBreaks.length > 0 ? (
            <div className="space-y-4">
              {allLunchBreaks.map((lunch) => (
                <div key={lunch.id} className="bg-white rounded-lg border border-gray-200 hover:shadow-md transition-all duration-200 hover:border-gray-300">
                  {editingLunch === lunch.id ? (
                    // Режим редактирования
                    <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <Edit3 className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                          <h4 className="text-sm font-semibold text-gray-900">
                            Редактирование обеда
                          </h4>
                          <p className="text-xs text-gray-600">
                            {lunch.user?.name || `Пользователь #${lunch.userId}`}
                          </p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Начало обеда
                          </label>
                          <input
                            type="time"
                            value={editStartTime}
                            onChange={(e) => setEditStartTime(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Конец обеда
                          </label>
                          <input
                            type="time"
                            value={editEndTime}
                            onChange={(e) => setEditEndTime(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                          />
                        </div>
                      </div>
                      
                      <div className="flex gap-3">
                        <button
                          onClick={() => saveEdit(lunch.id)}
                          disabled={loading}
                          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                        >
                          <Save className="w-4 h-4" />
                          {loading ? 'Сохранение...' : 'Сохранить'}
                        </button>
                        <button
                          onClick={cancelEdit}
                          disabled={loading}
                          className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                        >
                          <X className="w-4 h-4" />
                          Отмена
                        </button>
                      </div>
                    </div>
                  ) : (
                    // Обычный режим просмотра
                    <div className="flex items-center justify-between p-6">
                      <div className="flex items-center gap-4">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <Utensils className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <h4 className="text-sm font-semibold text-gray-900">
                            {lunch.user?.name || `Пользователь #${lunch.userId}`}
                          </h4>
                          <div className="flex items-center gap-2 mt-1">
                            <Clock className="w-4 h-4 text-gray-400" />
                            <span className="text-sm text-gray-600">
                              {formatTime(new Date(lunch.startTime).toTimeString().slice(0, 5))} - {formatTime(new Date(lunch.endTime).toTimeString().slice(0, 5))}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => startEdit(lunch)}
                          disabled={loading}
                          className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium text-sm"
                        >
                          <Edit3 className="w-4 h-4" />
                          Редактировать
                        </button>
                        <button
                          onClick={() => confirmDelete(lunch.id)}
                          disabled={loading}
                          className="flex items-center gap-2 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium text-sm"
                        >
                          <Trash2 className="w-4 h-4" />
                          Удалить
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Utensils className="w-8 h-8 mx-auto mb-2 text-gray-400" />
              <p className="text-sm">Обеды не настроены</p>
            </div>
          )}
        </div>

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

  // Для обычных пользователей показываем форму настройки обеда
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <Utensils className="w-5 h-5 text-gray-600" />
        <h3 className="text-lg font-semibold text-gray-900">Время обеда</h3>
        {lunchBreak && (
          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-green-100 text-green-700 rounded-full">
            <CheckCircle className="w-3 h-3" />
            Настроено
          </span>
        )}
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Начало обеда
            </label>
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Конец обеда
            </label>
            <input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            />
          </div>
        </div>

        {(conflicts.length > 0 || error) && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="w-4 h-4 text-red-600" />
              <span className="text-sm font-medium text-red-800">
                {conflicts.length > 0 ? 'Конфликт с занятиями' : 'Ошибка'}
              </span>
            </div>
            {conflicts.length > 0 && (
              <div className="space-y-1">
                {conflicts.map((lesson) => (
                  <div key={lesson.id} className="text-sm text-red-700">
                    • {lesson.student?.fullName || `Ученик #${lesson.studentId}`} - {formatTime(new Date(lesson.date).toTimeString().slice(0, 5))}
                  </div>
                ))}
              </div>
            )}
            {error && (
              <div className="text-sm text-red-700">{error}</div>
            )}
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={handleSave}
            disabled={loading || conflicts.length > 0}
            className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors duration-200 flex items-center justify-center gap-2 font-medium"
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
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 font-medium"
            >
              Удалить
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
