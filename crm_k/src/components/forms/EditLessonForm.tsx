'use client';

import { useState, useEffect } from 'react';
import { X, Trash2 } from 'lucide-react';
import { Student, Lesson } from '@/types';
import { apiRequest } from '@/lib/api';
import { useAuth } from '@/presentation/contexts';
import DateTimePicker from '../ui/DateTimePicker';

interface EditLessonFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  onDelete: () => void;
  lesson: Lesson | null;
  userRole?: 'ADMIN' | 'USER';
}

export default function EditLessonForm({ 
  isOpen, 
  onClose, 
  onSuccess, 
  onDelete,
  lesson,
  userRole
}: EditLessonFormProps) {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    date: '',
    endTime: '',
    studentId: '',
    cost: '',
    isCompleted: false,
    isPaid: false,
    isCancelled: false,
    notes: '',
    lessonType: 'individual' as 'individual' | 'group'
  });
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [error, setError] = useState('');

  // Загружаем список учеников
  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const response = await apiRequest('/api/students');
        if (response.ok) {
          const data = await response.json();
          setStudents(data);
        }
      } catch (error) {
        console.error('Ошибка при загрузке учеников:', error);
      }
    };

    if (isOpen) {
      fetchStudents();
    }
  }, [isOpen]);

  // Заполняем форму данными занятия
  useEffect(() => {
    if (lesson && isOpen) {
      // Используем локальное время без UTC смещения
      const startDate = new Date(lesson.date);
      const startTime = `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}-${String(startDate.getDate()).padStart(2, '0')}T${String(startDate.getHours()).padStart(2, '0')}:${String(startDate.getMinutes()).padStart(2, '0')}`;
      
      let endTime = '';
      if (lesson.endTime) {
        const endDate = new Date(lesson.endTime);
        endTime = `${endDate.getFullYear()}-${String(endDate.getMonth() + 1).padStart(2, '0')}-${String(endDate.getDate()).padStart(2, '0')}T${String(endDate.getHours()).padStart(2, '0')}:${String(endDate.getMinutes()).padStart(2, '0')}`;
      }
      
      setFormData({
        date: startTime,
        endTime: endTime,
        studentId: lesson.studentId.toString(),
        cost: lesson.cost.toString(),
        isCompleted: lesson.isCompleted,
        isPaid: lesson.isPaid,
        isCancelled: lesson.isCancelled,
        notes: lesson.notes || '',
        lessonType: (lesson as any).lessonType || 'individual'
      });
    }
  }, [lesson, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lesson) return;

    setLoading(true);
    setError('');

    try {
      const response = await apiRequest(`/api/lessons/${lesson.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          date: new Date(formData.date),
          studentId: parseInt(formData.studentId),
          cost: parseFloat(formData.cost),
          // Для обычных пользователей отправляем только статус отмены
          ...(user?.role === 'ADMIN' ? {
            isCompleted: formData.isCompleted,
            isPaid: formData.isPaid
          } : {}),
          isCancelled: formData.isCancelled,
          notes: formData.notes
        }),
      });

      if (response.ok) {
        onSuccess();
        onClose();
      } else {
        const errorData = await response.json();
        if (errorData.error === 'Конфликт времени') {
          setError(`${errorData.error}: ${errorData.details}`);
        } else {
          setError(errorData.error || 'Ошибка при обновлении занятия');
        }
      }
    } catch {
      setError('Ошибка при обновлении занятия');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!lesson) return;

    if (!confirm('Вы уверены, что хотите удалить это занятие?')) {
      return;
    }

    setDeleteLoading(true);
    setError('');

    try {
      const response = await apiRequest(`/api/lessons/${lesson.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        onDelete();
        onClose();
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Ошибка при удалении занятия');
      }
    } catch {
      setError('Ошибка при удалении занятия');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  if (!isOpen || !lesson) return null;

  return (
    <div 
      className="fixed inset-0 backdrop-blur-md bg-white/20 flex items-center justify-center z-50 p-4 transition-all duration-300 ease-out" 
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-lg shadow-xl border border-gray-200 w-full max-w-2xl max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-semibold text-gray-900">
            {userRole === 'ADMIN' ? 'Редактировать занятие' : 'Просмотр занятия'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors duration-200 p-2 hover:bg-gray-100 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              <span className="font-medium">{error}</span>
            </div>
          )}

          {/* Дата и время */}
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200/50">
            {userRole === 'ADMIN' ? (
              <DateTimePicker
                value={formData.date}
                onChange={(value: string) => {
                  // value уже в формате YYYY-MM-DDTHH:MM
                  const startTime = new Date(value);
                  const endTime = new Date(startTime.getTime() + 60 * 60 * 1000); // +1 час по умолчанию
                  
                  // Форматируем время окончания в том же формате
                  const endTimeString = `${endTime.getFullYear()}-${String(endTime.getMonth() + 1).padStart(2, '0')}-${String(endTime.getDate()).padStart(2, '0')}T${String(endTime.getHours()).padStart(2, '0')}:${String(endTime.getMinutes()).padStart(2, '0')}`;
                  
                  setFormData(prev => ({
                    ...prev,
                    date: value,
                    endTime: endTimeString
                  }));
                }}
                min={user?.role === 'ADMIN' ? undefined : new Date().toISOString()}
                showDurationSelector={true}
                defaultDuration={60}
              />
            ) : (
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Дата и время</label>
                <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                  <div className="text-sm text-gray-900">
                    {new Date(formData.date).toLocaleString('ru-RU', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                    {formData.endTime && (
                      <span className="text-gray-500">
                        {' - '}
                        {new Date(formData.endTime).toLocaleTimeString('ru-RU', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Ученик */}
          <div className="space-y-2">
            <label htmlFor="studentId" className="block text-sm font-medium text-gray-700">
              Ученик
            </label>
            {userRole === 'ADMIN' ? (
              <select
                id="studentId"
                name="studentId"
                value={formData.studentId}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
              >
                {students.map((student) => (
                  <option key={student.id} value={student.id}>
                    {student.fullName} ({student.age} лет)
                  </option>
                ))}
              </select>
            ) : (
              <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                <div className="text-sm text-gray-900">
                  {students.find(s => s.id.toString() === formData.studentId)?.fullName || 'Неизвестно'}
                </div>
              </div>
            )}
          </div>

          {/* Стоимость */}
          <div className="space-y-2">
            <label htmlFor="cost" className="block text-sm font-medium text-gray-700">
              Стоимость (тенге)
            </label>
            {userRole === 'ADMIN' ? (
              <input
                type="number"
                id="cost"
                name="cost"
                value={formData.cost}
                onChange={handleChange}
                required
                min="0"
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
              />
            ) : (
              <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                <div className="text-sm text-gray-900">{formData.cost} ₸</div>
              </div>
            )}
          </div>

          {/* Статусы */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">
              Статус занятия
            </label>
            <div className="space-y-3">
              {/* Показываем чекбоксы для проведения и оплаты только админам */}
              {user?.role === 'ADMIN' && (
                <>
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      name="isCompleted"
                      checked={formData.isCompleted}
                      onChange={handleChange}
                      className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                    />
                    <span className="ml-3 text-sm text-gray-700">Проведено</span>
                  </label>
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      name="isPaid"
                      checked={formData.isPaid}
                      onChange={handleChange}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="ml-3 text-sm text-gray-700">Оплачено</span>
                  </label>
                </>
              )}
              
              {/* Для обычных пользователей показываем статусы только для чтения */}
              {userRole === 'USER' && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg">
                    <span className="text-sm text-gray-700">Проведено</span>
                    <span className={`text-sm font-medium ${formData.isCompleted ? 'text-green-600' : 'text-gray-400'}`}>
                      {formData.isCompleted ? 'Да' : 'Нет'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg">
                    <span className="text-sm text-gray-700">Оплачено</span>
                    <span className={`text-sm font-medium ${formData.isPaid ? 'text-green-600' : 'text-gray-400'}`}>
                      {formData.isPaid ? 'Да' : 'Нет'}
                    </span>
                  </div>
                </div>
              )}
              
              {/* Чекбокс отмены доступен всем пользователям */}
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  name="isCancelled"
                  checked={formData.isCancelled}
                  onChange={handleChange}
                  className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                />
                <span className="ml-3 text-sm text-gray-700">
                  {userRole === 'USER' ? 'Отменить занятие' : 'Отменено'}
                </span>
              </label>
              
            </div>
          </div>

          {/* Заметки */}
          <div className="space-y-2">
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
              Заметки
            </label>
            {userRole === 'ADMIN' ? (
              <textarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 resize-none"
                placeholder="Дополнительная информация о занятии..."
              />
            ) : (
              <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                <div className="text-sm text-gray-900 whitespace-pre-wrap">
                  {formData.notes || 'Нет заметок'}
                </div>
              </div>
            )}
          </div>

          {/* Кнопки */}
          <div className="space-y-4 pt-4 border-t border-gray-200">
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors duration-200 font-medium"
              >
                {userRole === 'USER' ? 'Закрыть' : 'Отмена'}
              </button>
              {userRole === 'ADMIN' && (
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors duration-200 font-medium"
                >
                  {loading ? 'Сохранение...' : 'Сохранить'}
                </button>
              )}
              {userRole === 'USER' && (
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors duration-200 font-medium"
                >
                  {loading ? 'Сохранение...' : 'Сохранить изменения'}
                </button>
              )}
            </div>
            
            {userRole === 'ADMIN' && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleteLoading}
                className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors duration-200 font-medium"
              >
                <Trash2 className="w-4 h-4" />
                {deleteLoading ? 'Удаление...' : 'Удалить занятие'}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
