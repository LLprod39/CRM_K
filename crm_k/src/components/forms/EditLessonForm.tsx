'use client';

import { useState, useEffect } from 'react';
import { X, Trash2, Calendar, User, DollarSign, CheckCircle, Clock, AlertTriangle, FileText, MessageSquare, Edit3, Save, AlertCircle } from 'lucide-react';
import { Student, Lesson } from '@/types';
import { apiRequest } from '@/lib/api';
import { useAuth } from '@/presentation/contexts';
import DateTimePicker from '../ui/DateTimePicker';
import { useConfirmDialog } from '../ui/ConfirmDialog';
import { LessonStatusGroup } from '../ui/LessonStatusBadge';
import { formatTime, formatDate } from '@/lib/timeUtils';

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
  const { showConfirm, ConfirmDialogComponent } = useConfirmDialog();
  const [formData, setFormData] = useState({
    date: '',
    endTime: '',
    studentId: '',
    cost: '',
    isCompleted: false,
    isPaid: false,
    isCancelled: false,
    notes: '',
    comment: '',
    lessonType: 'individual' as 'individual' | 'group'
  });
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [error, setError] = useState('');
  const [studentInfo, setStudentInfo] = useState<any>(null);

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

  // Загружаем информацию об ученике
  useEffect(() => {
    const fetchStudentInfo = async () => {
      if (formData.studentId && isOpen) {
        try {
          const response = await apiRequest(`/api/students/${formData.studentId}`);
          if (response.ok) {
            const data = await response.json();
            setStudentInfo(data);
          }
        } catch (error) {
          console.error('Ошибка при загрузке информации об ученике:', error);
        }
      }
    };

    fetchStudentInfo();
  }, [formData.studentId, isOpen]);


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
        comment: (lesson as any).comment || '',
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
          notes: formData.notes,
          comment: formData.comment
        }),
      });

      if (response.ok) {
        onSuccess();
        onClose();
      } else {
        const errorData = await response.json();
        const errorMessage = errorData.error === 'Конфликт времени' 
          ? `${errorData.error}: ${errorData.details}`
          : errorData.error || 'Ошибка при обновлении занятия';
        
        setError(errorMessage);
      }
    } catch {
      const errorMessage = 'Ошибка при обновлении занятия';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!lesson) return;

    showConfirm({
      title: 'Удаление занятия',
      message: 'Вы уверены, что хотите удалить это занятие? Это действие нельзя отменить.',
      type: 'danger',
      confirmText: 'Удалить',
      cancelText: 'Отмена',
      onConfirm: async () => {
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
        const errorMessage = errorData.error || 'Ошибка при удалении занятия';
        setError(errorMessage);
      }
    } catch {
      const errorMessage = 'Ошибка при удалении занятия';
      setError(errorMessage);
    } finally {
      setDeleteLoading(false);
    }
      }
    });
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
      className="fixed inset-0 backdrop-blur-md bg-white/20 flex items-start justify-center z-50 p-4 pt-8 transition-all duration-300 ease-out" 
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-lg shadow-xl border border-gray-200 w-full max-w-6xl h-[95vh] overflow-hidden mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">
                {userRole === 'ADMIN' ? 'Редактировать занятие' : 'Просмотр занятия'}
              </h2>
              <div className="flex items-center space-x-6 text-lg text-gray-700">
                <div className="flex items-center space-x-2">
                  <Calendar className="w-5 h-5 text-blue-600" />
                  <span className="font-semibold">
                    {formatDate(lesson.date, { 
                      weekday: 'long', 
                      day: 'numeric', 
                      month: 'long' 
                    })}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <Clock className="w-5 h-5 text-blue-600" />
                  <span className="font-semibold">
                    {formatTime(lesson.endTime)}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-1 md:space-x-2 flex-shrink-0">
            {userRole === 'ADMIN' && (
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="p-2 text-green-600 hover:text-green-700 hover:bg-green-50 rounded-lg transition-colors duration-200"
                title="Сохранить изменения"
              >
                <Save className="w-4 h-4 md:w-5 md:h-5" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors duration-200"
            >
              <X className="w-4 h-4 md:w-5 md:h-5" />
            </button>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-4 md:p-6 space-y-4 md:space-y-6 overflow-y-auto h-[calc(95vh-120px)]">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              <span className="font-medium">{error}</span>
            </div>
          )}

          {/* Дата и время */}
          <div className="bg-gray-50 p-4 md:p-6 rounded-xl border border-gray-200">
            <div className="flex items-center space-x-2 md:space-x-3 mb-3 md:mb-4">
              <div className="p-3 bg-blue-100 rounded-xl flex-shrink-0">
                <Calendar className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-base md:text-lg font-semibold text-gray-900">Дата и время</h3>
            </div>
            
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
              <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                <div className="flex items-center space-x-3">
                  <Clock className="w-5 h-5 text-gray-400" />
                  <div>
                    <div className="text-lg font-semibold text-gray-900">
                      {formatDate(formData.date, {
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric',
                        weekday: 'long'
                      })}
                    </div>
                    <div className="text-sm text-gray-600">
                      {formatTime(formData.date)}
                      {formData.endTime && (
                        <span className="text-gray-500">
                          {' - '}
                          {formatTime(formData.endTime)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Ученик */}
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-green-100 rounded-xl">
                  <User className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">Ученик</h3>
              </div>
            </div>
            
            {userRole === 'ADMIN' ? (
              <div className="space-y-4">
                <select
                  id="studentId"
                  name="studentId"
                  value={formData.studentId}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-900 bg-white text-lg"
                >
                  {students.map((student) => (
                    <option key={student.id} value={student.id}>
                      {student.fullName} ({student.age} лет)
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  id="cost"
                  name="cost"
                  value={formData.cost}
                  onChange={handleChange}
                  required
                  min="0"
                  step="0.01"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-900 bg-white text-lg"
                  placeholder="Стоимость занятия"
                />
              </div>
            ) : (
              <div className="mb-4">
                <div className="text-2xl font-bold text-gray-900">
                  {students.find(s => s.id.toString() === formData.studentId)?.fullName || 'Неизвестно'}
                </div>
              </div>
            )}

            {/* Информация об ученике */}
            {studentInfo && (
              <div className="space-y-3">
                <div className="bg-gray-50 p-4 rounded-xl">
                  <div className="flex flex-wrap gap-6 text-base">
                    {studentInfo.diagnosis && (
                      <div className="flex items-center space-x-2">
                        <span className="text-gray-600">Диагноз:</span>
                        <span className="font-semibold text-gray-900">{studentInfo.diagnosis}</span>
                      </div>
                    )}
                    <div className="flex items-center space-x-2">
                      <span className="text-gray-600">Родитель:</span>
                      <span className="font-semibold text-gray-900">{studentInfo.parentName}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-gray-600">Телефон:</span>
                      <span className="font-semibold text-gray-900">{studentInfo.phone}</span>
                    </div>
                  </div>
                </div>
                {studentInfo.comment && (
                  <div className="bg-gray-50 p-4 rounded-xl">
                    <div className="text-sm text-gray-600 mb-2">Комментарий</div>
                    <div className="font-medium text-gray-900">{studentInfo.comment}</div>
                  </div>
                )}
              </div>
            )}
          </div>



          {/* Статусы */}
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-3 bg-purple-100 rounded-xl">
                <CheckCircle className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Статус занятия</h3>
            </div>
            
            <div className="space-y-4">
              {/* Показываем чекбоксы для проведения и оплаты только админам */}
              {user?.role === 'ADMIN' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <label className="flex items-center cursor-pointer p-4 bg-white rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
                    <input
                      type="checkbox"
                      name="isCompleted"
                      checked={formData.isCompleted}
                      onChange={handleChange}
                      className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                    />
                    <div className="ml-3 flex items-center space-x-2">
                      <div className={`w-2 h-2 rounded-full ${formData.isCompleted ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                      <span className="text-sm font-medium text-gray-700">Проведено</span>
                    </div>
                  </label>
                  <label className="flex items-center cursor-pointer p-4 bg-white rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
                    <input
                      type="checkbox"
                      name="isPaid"
                      checked={formData.isPaid}
                      onChange={handleChange}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <div className="ml-3 flex items-center space-x-2">
                      <div className={`w-2 h-2 rounded-full ${formData.isPaid ? 'bg-green-500' : 'bg-orange-400'}`}></div>
                      <span className="text-sm font-medium text-gray-700">Оплачено</span>
                    </div>
                  </label>
                </div>
              )}
              
              {/* Для обычных пользователей показываем статусы только для чтения */}
              {userRole === 'USER' && (
                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                  <LessonStatusGroup
                    isCompleted={formData.isCompleted}
                    isPaid={formData.isPaid}
                    isCancelled={formData.isCancelled}
                    showLabels={true}
                  />
                </div>
              )}
              
              {/* Чекбокс отмены доступен всем пользователям */}
              <div className="mt-4 p-4 bg-white rounded-lg border border-gray-200">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    name="isCancelled"
                    checked={formData.isCancelled}
                    onChange={handleChange}
                    className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                  />
                  <div className="ml-3 flex items-center space-x-2">
                    <AlertTriangle className="w-4 h-4 text-red-500" />
                    <span className={`text-sm font-medium ${formData.isCancelled ? 'text-red-600' : 'text-gray-700'}`}>
                      {userRole === 'USER' ? 'Отменить занятие' : 'Отменено'}
                    </span>
                  </div>
                </label>
                {formData.isCancelled && (
                  <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                    ⚠️ Занятие будет отменено
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Заметки и комментарии */}
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-3 bg-indigo-100 rounded-xl">
                <FileText className="w-6 h-6 text-indigo-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Заметки и комментарии</h3>
            </div>
            
            <div className="space-y-4">
              {/* Заметки */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Заметки о занятии</label>
                {userRole === 'ADMIN' ? (
                  <textarea
                    id="notes"
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 bg-white resize-none"
                    placeholder="Добавьте заметки о занятии..."
                  />
                ) : (
                  <div className="bg-gray-50 p-4 rounded-xl">
                    {formData.notes ? (
                      <p className="text-gray-900 whitespace-pre-wrap">{formData.notes}</p>
                    ) : (
                      <p className="text-gray-500 italic">Заметки не добавлены</p>
                    )}
                  </div>
                )}
              </div>

              {/* Комментарий о поведении ребенка - только для прошедших занятий */}
              {new Date(lesson.date) < new Date() && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Комментарий о поведении ребенка</label>
                  <textarea
                    id="comment"
                    name="comment"
                    value={formData.comment}
                    onChange={handleChange}
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 bg-white resize-none"
                    placeholder="Опишите поведение ребенка на занятии..."
                  />
                </div>
              )}
            </div>
          </div>

          {/* Кнопки */}
          <div className="flex gap-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-4 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl font-semibold text-lg transition-all duration-300 hover:scale-105 active:scale-95"
            >
              {userRole === 'USER' ? 'Закрыть' : 'Отмена'}
            </button>
            
            <button
              type="submit"
              disabled={loading}
              onClick={(e) => {
                if (userRole === 'USER' && formData.isCancelled) {
                  e.preventDefault();
                  showConfirm({
                    title: 'Отмена занятия',
                    message: 'Вы уверены, что хотите отменить занятие? Это действие будет отправлено на рассмотрение администратору.',
                    type: 'warning',
                    confirmText: 'Отменить занятие',
                    cancelText: 'Не отменять',
                    onConfirm: () => {
                      handleSubmit(e as any);
                    }
                  });
                  return;
                }
              }}
              className="flex-1 px-6 py-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl shadow-lg hover:shadow-xl disabled:opacity-50 transition-all duration-300 font-semibold text-lg hover:scale-105 active:scale-95"
            >
              {loading ? 'Сохранение...' : 'Сохранить'}
            </button>
          </div>
        </form>
      </div>
      <ConfirmDialogComponent />
    </div>
  );
}
