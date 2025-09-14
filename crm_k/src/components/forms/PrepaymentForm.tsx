'use client';

import { useState, useEffect } from 'react';
import { X, DollarSign, Calendar, User, AlertCircle, CheckCircle, CreditCard, Clock } from 'lucide-react';
import { Student } from '@/types';
import { apiRequest } from '@/lib/api';
import { useAuth } from '@/presentation/contexts';
import StudentSearch from '@/components/ui/StudentSearch';
import UserSelector from '@/components/ui/UserSelector';

interface PrepaymentFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  selectedStudent?: Student;
}

interface PrepaymentPeriod {
  type: 'week' | 'month' | 'custom';
  startDate: string;
  endDate: string;
  amount: number;
}

export default function PrepaymentForm({ 
  isOpen, 
  onClose, 
  onSuccess,
  selectedStudent 
}: PrepaymentFormProps) {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    studentId: selectedStudent?.id?.toString() || '',
    userId: null as number | null,
    period: {
      type: 'week' as 'week' | 'month' | 'custom',
      startDate: '',
      endDate: '',
      amount: 0
    },
    description: '',
    paymentDate: new Date().toISOString().split('T')[0]
  });
  
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudents, setSelectedStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [previewLessons, setPreviewLessons] = useState<Array<{
    id: number;
    date: string;
    cost: number;
    isPaid: boolean;
    isCancelled: boolean;
  }>>([]);
  const [calculatedAmount, setCalculatedAmount] = useState(0);

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

  // Обновляем форму при изменении selectedStudent
  useEffect(() => {
    if (selectedStudent) {
      setFormData(prev => ({
        ...prev,
        studentId: selectedStudent.id.toString()
      }));
      setSelectedStudents([selectedStudent]);
    }
  }, [selectedStudent]);

  // Генерируем предварительный просмотр уроков и рассчитываем сумму
  useEffect(() => {
    if (formData.studentId && formData.period.startDate && formData.period.endDate) {
      fetchLessonsForPeriod();
    } else {
      setPreviewLessons([]);
      setCalculatedAmount(0);
    }
  }, [formData.studentId, formData.period.startDate, formData.period.endDate]);

  const fetchLessonsForPeriod = async () => {
    try {
      const response = await apiRequest(
        `/api/lessons?studentId=${formData.studentId}&dateFrom=${formData.period.startDate}&dateTo=${formData.period.endDate}`
      );
      
      if (response.ok) {
        const lessons = await response.json();
        const unpaidLessons = lessons.filter((lesson: {
          id: number;
          date: string;
          cost: number;
          isPaid: boolean;
          isCancelled: boolean;
        }) => !lesson.isPaid && !lesson.isCancelled);
        setPreviewLessons(unpaidLessons);
        
        const totalAmount = unpaidLessons.reduce((sum: number, lesson: {
          id: number;
          date: string;
          cost: number;
          isPaid: boolean;
          isCancelled: boolean;
        }) => sum + lesson.cost, 0);
        setCalculatedAmount(totalAmount);
        
        // Автоматически устанавливаем рассчитанную сумму
        setFormData(prev => ({
          ...prev,
          period: {
            ...prev.period,
            amount: totalAmount
          }
        }));
      }
    } catch (error) {
      console.error('Ошибка при загрузке уроков:', error);
    }
  };

  // Автоматически устанавливаем даты при выборе периода
  useEffect(() => {
    const today = new Date();
    let startDate: Date;
    let endDate: Date;

    switch (formData.period.type) {
      case 'week':
        startDate = new Date(today);
        endDate = new Date(today);
        endDate.setDate(endDate.getDate() + 7);
        break;
      case 'month':
        startDate = new Date(today.getFullYear(), today.getMonth(), 1);
        endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        break;
      default:
        return;
    }

    setFormData(prev => ({
      ...prev,
      period: {
        ...prev.period,
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0]
      }
    }));
  }, [formData.period.type]);

  // Валидация формы
  const validateForm = () => {
    const errors: Record<string, string> = {};
    
    if (!formData.studentId) {
      errors.studentId = 'Выберите ученика';
    }
    
    if (!formData.period.startDate) {
      errors.startDate = 'Дата начала обязательна';
    }
    
    if (!formData.period.endDate) {
      errors.endDate = 'Дата окончания обязательна';
    }
    
    if (formData.period.startDate && formData.period.endDate) {
      const startDate = new Date(formData.period.startDate);
      const endDate = new Date(formData.period.endDate);
      
      if (endDate <= startDate) {
        errors.endDate = 'Дата окончания должна быть позже даты начала';
      }
    }
    
    if (!formData.period.amount || formData.period.amount <= 0) {
      errors.amount = 'Сумма должна быть больше 0';
    }
    
    if (user?.role === 'ADMIN' && !formData.userId) {
      errors.userId = 'Выберите пользователя (учителя)';
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
      const response = await apiRequest('/api/payments/prepayment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          studentId: parseInt(formData.studentId),
          amount: formData.period.amount,
          date: formData.paymentDate,
          description: formData.description || `Предоплата за период с ${formData.period.startDate} по ${formData.period.endDate}`,
          period: {
            startDate: formData.period.startDate,
            endDate: formData.period.endDate
          }
        }),
      });

      if (response.ok) {
        const result = await response.json();
        onSuccess();
        onClose();
        // Сбрасываем форму
        setFormData({
          studentId: '',
          userId: null,
          period: {
            type: 'week',
            startDate: '',
            endDate: '',
            amount: 0
          },
          description: '',
          paymentDate: new Date().toISOString().split('T')[0]
        });
        setSelectedStudents([]);
        setValidationErrors({});
        setPreviewLessons([]);
        setCalculatedAmount(0);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Ошибка при создании предоплаты');
      }
    } catch {
      setError('Ошибка при создании предоплаты');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    if (name.startsWith('period.')) {
      const field = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        period: {
          ...prev.period,
          [field]: type === 'number' ? parseFloat(value) || 0 : value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
      }));
    }
    
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
    
    if (students.length > 0) {
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
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-yellow-50 to-amber-50">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Предоплата</h2>
            <p className="text-sm text-gray-600 mt-1">Внесение предоплаты за период занятий</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md flex items-center">
              <AlertCircle className="w-5 h-5 mr-2" />
              {error}
            </div>
          )}

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

          {/* Выбор ученика */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <User className="w-4 h-4 inline mr-2" />
              Ученик
            </label>
            <StudentSearch
              students={filteredStudents}
              selectedStudents={selectedStudents}
              onSelectionChange={handleStudentSelectionChange}
              placeholder={formData.userId ? "Поиск ученика..." : "Сначала выберите учителя..."}
              multiple={false}
              className={validationErrors.studentId ? 'border-red-300' : ''}
              disabled={!formData.userId && user?.role === 'ADMIN'}
            />
            {validationErrors.studentId && (
              <p className="mt-1 text-sm text-red-600 flex items-center">
                <AlertCircle className="w-4 h-4 mr-1" />
                {validationErrors.studentId}
              </p>
            )}
          </div>

          {/* Период предоплаты */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <Calendar className="w-5 h-5 mr-2" />
              Период предоплаты
            </h3>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="periodType" className="block text-sm font-medium text-gray-700 mb-2">
                  Тип периода
                </label>
                <select
                  id="periodType"
                  name="period.type"
                  value={formData.period.type}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="week">Неделя</option>
                  <option value="month">Месяц</option>
                  <option value="custom">Произвольный период</option>
                </select>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-2">
                    Дата начала
                  </label>
                  <input
                    type="date"
                    id="startDate"
                    name="period.startDate"
                    value={formData.period.startDate}
                    onChange={handleChange}
                    className={`w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 ${
                      validationErrors.startDate ? 'border-red-300' : 'border-gray-300'
                    }`}
                  />
                  {validationErrors.startDate && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      {validationErrors.startDate}
                    </p>
                  )}
                </div>
                
                <div>
                  <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-2">
                    Дата окончания
                  </label>
                  <input
                    type="date"
                    id="endDate"
                    name="period.endDate"
                    value={formData.period.endDate}
                    onChange={handleChange}
                    className={`w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 ${
                      validationErrors.endDate ? 'border-red-300' : 'border-gray-300'
                    }`}
                  />
                  {validationErrors.endDate && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      {validationErrors.endDate}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Сумма предоплаты */}
          <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <DollarSign className="w-5 h-5 mr-2" />
              Сумма предоплаты
            </h3>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-2">
                  Сумма (тенге)
                </label>
                <input
                  type="number"
                  id="amount"
                  name="period.amount"
                  value={formData.period.amount}
                  onChange={handleChange}
                  required
                  min="0"
                  step="0.01"
                  className={`w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 ${
                    validationErrors.amount ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="0.00"
                />
                {validationErrors.amount && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {validationErrors.amount}
                  </p>
                )}
              </div>
              
              {calculatedAmount > 0 && (
                <div className="bg-white p-3 rounded border border-yellow-300">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Рассчитанная сумма за период:</span>
                    <span className="text-lg font-semibold text-gray-900">
                      {calculatedAmount.toLocaleString()} ₸
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Сумма рассчитана на основе неоплаченных занятий в выбранном периоде
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Дата платежа */}
          <div>
            <label htmlFor="paymentDate" className="block text-sm font-medium text-gray-700 mb-2">
              <Clock className="w-4 h-4 inline mr-2" />
              Дата платежа
            </label>
            <input
              type="date"
              id="paymentDate"
              name="paymentDate"
              value={formData.paymentDate}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Описание */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              Описание платежа
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 resize-none"
              placeholder="Дополнительная информация о платеже..."
            />
          </div>

          {/* Предварительный просмотр уроков */}
          {previewLessons.length > 0 && (
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <Calendar className="w-5 h-5 mr-2" />
                Неоплаченные занятия в периоде ({previewLessons.length})
              </h3>
              
              <div className="max-h-40 overflow-y-auto">
                <div className="space-y-2">
                  {previewLessons.map((lesson, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-white rounded border">
                      <div className="flex items-center space-x-3">
                        <span className="text-sm font-medium text-gray-600">
                          {new Date(lesson.date).toLocaleDateString('ru-RU')}
                        </span>
                        <span className="text-sm text-gray-500">
                          {new Date(lesson.date).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <span className="text-sm font-medium text-gray-900">
                        {lesson.cost.toLocaleString()} ₸
                      </span>
                    </div>
                  ))}
                </div>
              </div>
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
              className="flex-1 px-6 py-3 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 disabled:opacity-50 transition-colors font-medium flex items-center justify-center"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Создание предоплаты...
                </>
              ) : (
                <>
                  <CreditCard className="w-4 h-4 mr-2" />
                  Создать предоплату
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
