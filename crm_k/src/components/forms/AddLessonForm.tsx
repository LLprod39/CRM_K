'use client';

import { useState, useEffect } from 'react';
import { X, Calendar, User, DollarSign, FileText, Clock, AlertCircle, CheckCircle, Users } from 'lucide-react';
import { Student } from '@/types';
import { apiRequest } from '@/lib/api';
import { useAuth } from '@/presentation/contexts';
import DateTimePicker from '../ui/DateTimePicker';
import StudentSearch from '@/components/ui/StudentSearch';
import UserSelector from '@/components/ui/UserSelector';
import UnifiedSubscriptionModal from './UnifiedSubscriptionModal';

interface AddLessonFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  selectedDate?: Date;
  selectedStudent?: Student;
}

// Вспомогательная функция для создания локального времени в формате ISO
const toLocalISOString = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

export default function AddLessonForm({ 
  isOpen, 
  onClose, 
  onSuccess, 
  selectedDate,
  selectedStudent 
}: AddLessonFormProps) {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    date: selectedDate ? toLocalISOString(selectedDate) : '',
    endTime: '',
    studentId: selectedStudent?.id || '',
    cost: '',
    isCompleted: false,
    isPaid: false,
    isCancelled: false,
    notes: '',
    comment: '',
    lessonType: 'individual' as 'individual' | 'group',
    userId: null as number | null
  });
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudents, setSelectedStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [showUnifiedSubscriptionForm, setShowUnifiedSubscriptionForm] = useState(false);

  // Загружаем список учеников
  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const response = await apiRequest('/api/students');
        if (response.ok) {
          const data = await response.json();
          setStudents(data);
        } else {
          console.error('Ошибка при загрузке учеников:', response.status);
        }
      } catch (error) {
        console.error('Ошибка при загрузке учеников:', error);
      }
    };

    if (isOpen) {
      fetchStudents();
    }
  }, [isOpen]);

  // Фильтруем учеников по выбранному пользователю
  const filteredStudents = formData.userId 
    ? students.filter(student => student.userId === formData.userId)
    : students;

  // Обновляем форму при изменении selectedDate или selectedStudent
  useEffect(() => {
    if (selectedDate) {
      const startTime = toLocalISOString(selectedDate);
      const endTime = toLocalISOString(new Date(selectedDate.getTime() + 60 * 60 * 1000)); // +1 час по умолчанию
      setFormData(prev => ({
        ...prev,
        date: startTime,
        endTime: endTime
      }));
    }
    if (selectedStudent) {
      setFormData(prev => ({
        ...prev,
        studentId: selectedStudent.id.toString()
      }));
      setSelectedStudents([selectedStudent]);
    }
  }, [selectedDate, selectedStudent]);

  // Проверяем, является ли выбранная дата задним числом
  const isBackdate = formData.date && new Date(formData.date) < new Date();

  // Автоматически предлагаем статусы для занятий задним числом (только для админов)
  useEffect(() => {
    if (isBackdate && user?.role === 'ADMIN' && !formData.isCompleted && !formData.isPaid && !formData.isCancelled) {
      setFormData(prev => ({
        ...prev,
        isCompleted: true,
        isPaid: true
      }));
    }
  }, [isBackdate, user?.role]);

  // Валидация формы
  const validateForm = () => {
    const errors: Record<string, string> = {};
    
    if (!formData.date) {
      errors.date = 'Дата и время начала обязательны';
    } else {
      // Проверяем, что дата не в прошлом (только для не-админов)
      const lessonDate = new Date(formData.date);
      const now = new Date();
      now.setHours(0, 0, 0, 0); // Сбрасываем время для сравнения только по дате
      
      if (lessonDate < now && user?.role !== 'ADMIN') {
        errors.date = 'Нельзя создавать занятия задним числом';
      }
    }
    
    if (!formData.endTime) {
      errors.endTime = 'Время окончания обязательно';
    }
    
    if (formData.date && formData.endTime) {
      const startTime = new Date(formData.date);
      const endTime = new Date(formData.endTime);
      if (endTime <= startTime) {
        errors.endTime = 'Время окончания должно быть позже времени начала';
      }
    }
    
    // Для админов проверяем выбор пользователя
    if (user?.role === 'ADMIN' && !formData.userId) {
      errors.userId = 'Выберите пользователя (учителя)';
    }
    
    if (formData.lessonType === 'individual') {
      if (!formData.studentId) {
        errors.studentId = 'Выберите ученика';
      }
    } else {
      if (selectedStudents.length === 0) {
        errors.studentId = 'Выберите хотя бы одного ученика для группового занятия';
      }
    }
    
    if (!formData.cost || parseFloat(formData.cost) <= 0) {
      errors.cost = 'Стоимость должна быть больше 0';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    setError('');

    try {
      const requestData = {
        ...formData,
        date: new Date(formData.date),
        endTime: new Date(formData.endTime),
        studentId: formData.lessonType === 'individual' ? parseInt(String(formData.studentId)) : selectedStudents[0]?.id,
        studentIds: formData.lessonType === 'group' ? selectedStudents.map(s => s.id) : undefined,
        cost: parseFloat(formData.cost),
        notes: formData.notes,
        comment: formData.comment,
        userId: formData.userId
      };

      const response = await apiRequest('/api/lessons', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      if (response.ok) {
        onSuccess();
        onClose();
        // Сбрасываем форму
        setFormData({
          date: '',
          endTime: '',
          studentId: '',
          cost: '',
          isCompleted: false,
          isPaid: false,
          isCancelled: false,
          notes: '',
          comment: '',
          lessonType: 'individual',
          userId: null
        });
        setSelectedStudents([]);
        setValidationErrors({});
      } else {
        const errorData = await response.json();
        if (errorData.error === 'Конфликт времени') {
          setError(`${errorData.error}: ${errorData.details}`);
        } else {
          setError(errorData.error || 'Ошибка при создании занятия');
        }
      }
    } catch {
      setError('Ошибка при создании занятия');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
    
    // Очищаем ошибку валидации при изменении поля
    if (validationErrors[name]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleStudentSelectionChange = (students: Student[]) => {
    setSelectedStudents(students);
    
    // Для индивидуальных занятий обновляем studentId
    if (formData.lessonType === 'individual' && students.length > 0) {
      setFormData(prev => ({
        ...prev,
        studentId: students[0].id.toString()
      }));
    }
    
    // Очищаем ошибку валидации
    if (validationErrors.studentId) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.studentId;
        return newErrors;
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Добавить занятие</h2>
          </div>
          <div className="flex items-center gap-2">
            {user?.role === 'ADMIN' && (
              <>
                <button
                  type="button"
                  onClick={() => setShowUnifiedSubscriptionForm(true)}
                  className="px-3 py-1.5 text-xs bg-purple-100 text-purple-700 rounded-md hover:bg-purple-200 transition-colors font-medium"
                  title="Создать абонемент (обычный или гибкий)"
                >
                  Создать абонемент
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const yesterday = new Date();
                    yesterday.setDate(yesterday.getDate() - 1);
                    yesterday.setHours(10, 0, 0, 0);
                    const endTime = new Date(yesterday.getTime() + 60 * 60 * 1000);
                    setFormData(prev => ({
                      ...prev,
                      date: toLocalISOString(yesterday),
                      endTime: toLocalISOString(endTime),
                      isCompleted: true,
                      isPaid: true
                    }));
                  }}
                  className="px-3 py-1.5 text-xs bg-orange-100 text-orange-700 rounded-md hover:bg-orange-200 transition-colors font-medium"
                  title="Быстро добавить занятие на вчера"
                >
                  Вчера
                </button>
              </>
            )}
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md flex items-center">
              <AlertCircle className="w-5 h-5 mr-2" />
              {error}
            </div>
          )}

          {/* Время проведения */}
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200/50">
            <DateTimePicker
              value={formData.date}
              onChange={(value: string) => {
                // value уже в формате YYYY-MM-DDTHH:MM
                const startTime = new Date(value);
                const endTime = new Date(startTime.getTime() + 60 * 60 * 1000); // +1 час по умолчанию
                
                setFormData(prev => ({
                  ...prev,
                  date: value,
                  endTime: toLocalISOString(endTime)
                }));
              }}
              min={user?.role === 'ADMIN' ? undefined : new Date().toISOString()}
              showDurationSelector={true}
              defaultDuration={60}
            />
            
            {validationErrors.date && (
              <p className="mt-2 text-sm text-red-600 flex items-center">
                <AlertCircle className="w-4 h-4 mr-1" />
                {validationErrors.date}
              </p>
            )}
            
            {validationErrors.endTime && (
              <p className="mt-2 text-sm text-red-600 flex items-center">
                <AlertCircle className="w-4 h-4 mr-1" />
                {validationErrors.endTime}
              </p>
            )}
            
            {user?.role === 'ADMIN' && isBackdate && (
              <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-md">
                <div className="flex items-start">
                  <AlertCircle className="w-4 h-4 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
                  <div className="text-sm">
                    <p className="text-blue-800 font-medium">Администратор</p>
                    <p className="text-blue-700 mt-1">
                      Вы можете создавать занятия задним числом. Рекомендуется отметить занятие как "Проведено" и "Оплачено" если оно уже состоялось.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Выбор пользователя - только для админов */}
          {user?.role === 'ADMIN' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <User className="w-4 h-4 inline mr-2" />
                Пользователь (учитель)
              </label>
              <UserSelector
                selectedUserId={formData.userId || undefined}
                onUserChange={(userId) => {
                  setFormData(prev => ({ ...prev, userId: userId || null }));
                  // Очищаем выбранных учеников при смене пользователя
                  setSelectedStudents([]);
                  setFormData(prev => ({ ...prev, studentId: '' }));
                }}
                placeholder="Выберите учителя..."
                showUserCount={true}
                className={validationErrors.userId ? 'border-red-300' : ''}
              />
              {validationErrors.userId && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {validationErrors.userId}
                </p>
              )}
            </div>
          )}

          {/* Тип занятия */}
          <div>
            <label htmlFor="lessonType" className="block text-sm font-medium text-gray-700 mb-2">
              <FileText className="w-4 h-4 inline mr-2" />
              Тип занятия
            </label>
            <select
              id="lessonType"
              name="lessonType"
              value={formData.lessonType}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="individual">Индивидуальное</option>
              <option value="group">Групповое</option>
            </select>
          </div>

          {/* Выбор учеников */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {formData.lessonType === 'individual' ? (
                <>
                  <User className="w-4 h-4 inline mr-2" />
                  Ученик
                </>
              ) : (
                <>
                  <Users className="w-4 h-4 inline mr-2" />
                  Ученики для группового занятия
                </>
              )}
            </label>
            <StudentSearch
              students={filteredStudents}
              selectedStudents={selectedStudents}
              onSelectionChange={handleStudentSelectionChange}
              placeholder={
                formData.lessonType === 'individual' 
                  ? (formData.userId ? "Поиск ученика..." : "Сначала выберите учителя...") 
                  : (formData.userId ? "Поиск учеников для группового занятия..." : "Сначала выберите учителя...")
              }
              multiple={formData.lessonType === 'group'}
              className={validationErrors.studentId ? 'border-red-300' : ''}
              disabled={!formData.userId && user?.role === 'ADMIN'}
            />
            {validationErrors.studentId && (
              <p className="mt-1 text-sm text-red-600 flex items-center">
                <AlertCircle className="w-4 h-4 mr-1" />
                {validationErrors.studentId}
              </p>
            )}
            {formData.lessonType === 'group' && selectedStudents.length > 0 && (
              <p className="mt-2 text-sm text-gray-600">
                Выбрано учеников: {selectedStudents.length}
              </p>
            )}
          </div>

          {/* Стоимость */}
          <div>
            <label htmlFor="cost" className="block text-sm font-medium text-gray-700 mb-2">
              <DollarSign className="w-4 h-4 inline mr-2" />
              Стоимость (тенге)
            </label>
            <input
              type="number"
              id="cost"
              name="cost"
              value={formData.cost}
              onChange={handleChange}
              required
              min="0"
              step="0.01"
              className={`w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 ${
                validationErrors.cost ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="0.00"
            />
            {validationErrors.cost && (
              <p className="mt-1 text-sm text-red-600 flex items-center">
                <AlertCircle className="w-4 h-4 mr-1" />
                {validationErrors.cost}
              </p>
            )}
          </div>

          {/* Статусы - только для администраторов */}
          {user?.role === 'ADMIN' && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Статус занятия
              </label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <label className="flex items-center p-3 bg-white rounded-md border border-gray-200 hover:bg-blue-50 cursor-pointer">
                  <input
                    type="checkbox"
                    name="isCompleted"
                    checked={formData.isCompleted}
                    onChange={handleChange}
                    className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                  />
                  <div className="ml-3">
                    <span className="text-sm font-medium text-gray-700">Проведено</span>
                    <p className="text-xs text-gray-500">Занятие уже проведено</p>
                  </div>
                </label>
                
                <label className="flex items-center p-3 bg-white rounded-md border border-gray-200 hover:bg-blue-50 cursor-pointer">
                  <input
                    type="checkbox"
                    name="isPaid"
                    checked={formData.isPaid}
                    onChange={handleChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <div className="ml-3">
                    <span className="text-sm font-medium text-gray-700">Оплачено</span>
                    <p className="text-xs text-gray-500">Оплата получена</p>
                  </div>
                </label>
                
                <label className="flex items-center p-3 bg-white rounded-md border border-gray-200 hover:bg-red-50 cursor-pointer">
                  <input
                    type="checkbox"
                    name="isCancelled"
                    checked={formData.isCancelled}
                    onChange={handleChange}
                    className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                  />
                  <div className="ml-3">
                    <span className="text-sm font-medium text-gray-700">Отменено</span>
                    <p className="text-xs text-gray-500">Занятие отменено</p>
                  </div>
                </label>
              </div>
            </div>
          )}

          {/* Заметки */}
          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
              <FileText className="w-4 h-4 inline mr-2" />
              Заметки и комментарии
            </label>
            <textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 resize-none"
              placeholder="Дополнительная информация о занятии, цели, задачи, особенности ученика..."
            />
            <p className="mt-1 text-xs text-gray-500">
              Опишите особенности занятия, цели, задачи или любую другую важную информацию
            </p>
          </div>

          {/* Комментарий о поведении ребенка - только для прошедших занятий */}
          {formData.date && new Date(formData.date) < new Date() && (
            <div>
              <label htmlFor="comment" className="block text-sm font-medium text-gray-700 mb-2">
                <FileText className="w-4 h-4 inline mr-2" />
                Комментарий о поведении ребенка
              </label>
              <textarea
                id="comment"
                name="comment"
                value={formData.comment}
                onChange={handleChange}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 resize-none"
                placeholder="Опишите, как вел себя ребенок на занятии, что было хорошо, что нужно улучшить..."
              />
              <p className="mt-1 text-xs text-gray-500">
                Этот комментарий будет доступен только для прошедших занятий
              </p>
            </div>
          )}

          {/* Кнопка абонемента для админов */}
          {user?.role === 'ADMIN' && (
            <div className="flex gap-2 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={() => setShowUnifiedSubscriptionForm(true)}
                className="px-4 py-2 bg-purple-100 text-purple-700 rounded-md hover:bg-purple-200 transition-colors font-medium text-sm"
              >
                Создать абонемент
              </button>
              <span className="text-xs text-gray-500 ml-2 self-center">
                Обычный или гибкий абонемент
              </span>
            </div>
          )}

          {/* Кнопки */}
          <div className="flex gap-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors font-medium"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors font-medium flex items-center justify-center"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Сохранение...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Добавить занятие
                </>
              )}
            </button>
          </div>
        </form>
      </div>
      
      {/* Унифицированное модальное окно абонемента */}
      <UnifiedSubscriptionModal
        isOpen={showUnifiedSubscriptionForm}
        onClose={() => setShowUnifiedSubscriptionForm(false)}
        onSuccess={() => {
          setShowUnifiedSubscriptionForm(false);
          onSuccess();
        }}
        selectedStudent={selectedStudents.length > 0 ? selectedStudents[0] : undefined}
      />
    </div>
  );
}
