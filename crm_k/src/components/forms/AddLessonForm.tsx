'use client';

import { useState, useEffect } from 'react';
import { X, Calendar, User, DollarSign, FileText, Clock, AlertCircle, CheckCircle } from 'lucide-react';
import { Student } from '@/types';
import { apiRequest } from '@/lib/api';

interface AddLessonFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  selectedDate?: Date;
  selectedStudent?: Student;
}

export default function AddLessonForm({ 
  isOpen, 
  onClose, 
  onSuccess, 
  selectedDate,
  selectedStudent 
}: AddLessonFormProps) {
  const [formData, setFormData] = useState({
    date: selectedDate ? selectedDate.toISOString().slice(0, 16) : '',
    endTime: '',
    studentId: selectedStudent?.id || '',
    cost: '',
    isCompleted: false,
    isPaid: false,
    isCancelled: false,
    notes: '',
    lessonType: 'individual' as 'individual' | 'group',
    location: 'office' as 'office' | 'online' | 'home'
  });
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

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

  // Обновляем форму при изменении selectedDate или selectedStudent
  useEffect(() => {
    if (selectedDate) {
      const startTime = selectedDate.toISOString().slice(0, 16);
      const endTime = new Date(selectedDate.getTime() + 60 * 60 * 1000).toISOString().slice(0, 16); // +1 час по умолчанию
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
    }
  }, [selectedDate, selectedStudent]);

  // Валидация формы
  const validateForm = () => {
    const errors: Record<string, string> = {};
    
    if (!formData.date) {
      errors.date = 'Дата и время начала обязательны';
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
    
    if (!formData.studentId) {
      errors.studentId = 'Выберите ученика';
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
      const response = await apiRequest('/api/lessons', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          date: new Date(formData.date),
          endTime: new Date(formData.endTime),
          studentId: parseInt(String(formData.studentId)),
          cost: parseFloat(formData.cost)
        }),
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
          lessonType: 'individual',
          location: 'office'
        });
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Добавить занятие</h2>
            <p className="text-sm text-gray-600 mt-1">Заполните информацию о новом занятии</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md flex items-center">
              <AlertCircle className="w-5 h-5 mr-2" />
              {error}
            </div>
          )}

          {/* Время проведения */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="w-4 h-4 inline mr-2" />
                Дата и время начала
              </label>
              <input
                type="datetime-local"
                id="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                required
                className={`w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 ${
                  validationErrors.date ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              {validationErrors.date && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {validationErrors.date}
                </p>
              )}
            </div>
            
            <div>
              <label htmlFor="endTime" className="block text-sm font-medium text-gray-700 mb-2">
                <Clock className="w-4 h-4 inline mr-2" />
                Время окончания
              </label>
              <input
                type="datetime-local"
                id="endTime"
                name="endTime"
                value={formData.endTime}
                onChange={handleChange}
                required
                className={`w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 ${
                  validationErrors.endTime ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              {validationErrors.endTime && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {validationErrors.endTime}
                </p>
              )}
            </div>
          </div>

          {/* Ученик и тип занятия */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="studentId" className="block text-sm font-medium text-gray-700 mb-2">
                <User className="w-4 h-4 inline mr-2" />
                Ученик
              </label>
              <select
                id="studentId"
                name="studentId"
                value={formData.studentId}
                onChange={handleChange}
                required
                className={`w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 ${
                  validationErrors.studentId ? 'border-red-300' : 'border-gray-300'
                }`}
              >
                <option value="">Выберите ученика</option>
                {students.map((student) => (
                  <option key={student.id} value={student.id}>
                    {student.fullName} ({student.age} лет)
                  </option>
                ))}
              </select>
              {validationErrors.studentId && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {validationErrors.studentId}
                </p>
              )}
            </div>
            
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
          </div>

          {/* Стоимость и место проведения */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            
            <div>
              <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
                <FileText className="w-4 h-4 inline mr-2" />
                Место проведения
              </label>
              <select
                id="location"
                name="location"
                value={formData.location}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="office">В офисе</option>
                <option value="online">Онлайн</option>
                <option value="home">На дому</option>
              </select>
            </div>
          </div>

          {/* Статусы */}
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
    </div>
  );
}
