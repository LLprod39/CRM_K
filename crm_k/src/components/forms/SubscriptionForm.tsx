'use client';

import { useState, useEffect } from 'react';
import { X, Calendar, User, DollarSign, Clock, AlertCircle, CheckCircle, Users, CalendarDays, Repeat, FileText, CreditCard } from 'lucide-react';
import { Student } from '@/types';
import { apiRequest } from '@/lib/api';
import { useAuth } from '@/presentation/contexts';
import StudentSearch from '@/components/ui/StudentSearch';
import UserSelector from '@/components/ui/UserSelector';

interface SubscriptionFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  selectedStudent?: Student;
}

interface SubscriptionData {
  studentId: string;
  userId: number | null;
  cost: string;
  lessonType: 'individual' | 'group';
  notes: string;
  isPaid: boolean;
  schedulePattern: {
    type: 'weekly' | 'monthly' | 'custom';
    days: number[];
    startDate: string;
    endDate: string;
    time: string;
    duration: number;
  };
  paymentInfo: {
    amount: number;
    paymentDate: string;
    description: string;
  };
}

export default function SubscriptionForm({ 
  isOpen, 
  onClose, 
  onSuccess,
  selectedStudent 
}: SubscriptionFormProps) {
  const { user } = useAuth();
  const [formData, setFormData] = useState<SubscriptionData>({
    studentId: selectedStudent?.id?.toString() || '',
    userId: null,
    cost: '',
    lessonType: 'individual',
    notes: '',
    isPaid: false,
    schedulePattern: {
      type: 'weekly',
      days: [],
      startDate: '',
      endDate: '',
      time: '10:00',
      duration: 60
    },
    paymentInfo: {
      amount: 0,
      paymentDate: new Date().toISOString().split('T')[0],
      description: ''
    }
  });
  
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudents, setSelectedStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [previewLessons, setPreviewLessons] = useState<Array<{
    date: Date;
    endTime: Date;
    dayOfWeek: number;
    dayName: string;
  }>>([]);
  const [calculatedAmount, setCalculatedAmount] = useState(0);

  // Дни недели для выбора
  const weekDays = [
    { value: 1, label: 'Понедельник' },
    { value: 2, label: 'Вторник' },
    { value: 3, label: 'Среда' },
    { value: 4, label: 'Четверг' },
    { value: 5, label: 'Пятница' },
    { value: 6, label: 'Суббота' },
    { value: 0, label: 'Воскресенье' }
  ];

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
    if (formData.schedulePattern.startDate && formData.schedulePattern.endDate && formData.schedulePattern.days.length > 0 && formData.cost) {
      const lessons = generateLessonsPreview();
      setPreviewLessons(lessons);
      
      const totalAmount = lessons.length * parseFloat(formData.cost);
      setCalculatedAmount(totalAmount);
      
      // Автоматически устанавливаем рассчитанную сумму
      setFormData(prev => ({
        ...prev,
        paymentInfo: {
          ...prev.paymentInfo,
          amount: totalAmount
        }
      }));
    } else {
      setPreviewLessons([]);
      setCalculatedAmount(0);
    }
  }, [formData.schedulePattern, formData.cost]);

  const generateLessonsPreview = () => {
    const lessons: Array<{
      date: Date;
      endTime: Date;
      dayOfWeek: number;
      dayName: string;
    }> = [];
    const startDate = new Date(formData.schedulePattern.startDate);
    const endDate = new Date(formData.schedulePattern.endDate);
    const [hours, minutes] = formData.schedulePattern.time.split(':').map(Number);

    const currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      const dayOfWeek = currentDate.getDay();
      
      if (formData.schedulePattern.days.includes(dayOfWeek)) {
        const lessonDate = new Date(currentDate);
        lessonDate.setHours(hours, minutes, 0, 0);
        
        const endTime = new Date(lessonDate.getTime() + formData.schedulePattern.duration * 60000);
        
        lessons.push({
          date: lessonDate,
          endTime: endTime,
          dayOfWeek: dayOfWeek,
          dayName: weekDays.find(d => d.value === dayOfWeek)?.label || ''
        });
      }
      
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return lessons.slice(0, 20); // Показываем только первые 20 для предварительного просмотра
  };

  // Автоматически устанавливаем даты при выборе периода
  useEffect(() => {
    const today = new Date();
    let startDate: Date;
    let endDate: Date;

    switch (formData.schedulePattern.type) {
      case 'weekly':
        startDate = new Date(today);
        endDate = new Date(today);
        endDate.setDate(endDate.getDate() + 7);
        break;
      case 'monthly':
        startDate = new Date(today.getFullYear(), today.getMonth(), 1);
        endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        break;
      default:
        return;
    }

    setFormData(prev => ({
      ...prev,
      schedulePattern: {
        ...prev.schedulePattern,
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0]
      }
    }));
  }, [formData.schedulePattern.type]);

  // Валидация формы
  const validateForm = () => {
    const errors: Record<string, string> = {};
    
    if (!formData.schedulePattern.startDate) {
      errors.startDate = 'Дата начала обязательна';
    }
    
    if (!formData.schedulePattern.endDate) {
      errors.endDate = 'Дата окончания обязательна';
    }
    
    if (formData.schedulePattern.startDate && formData.schedulePattern.endDate) {
      const startDate = new Date(formData.schedulePattern.startDate);
      const endDate = new Date(formData.schedulePattern.endDate);
      
      if (endDate <= startDate) {
        errors.endDate = 'Дата окончания должна быть позже даты начала';
      }
    }
    
    if (formData.schedulePattern.days.length === 0) {
      errors.days = 'Выберите хотя бы один день недели';
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
    
    if (user?.role === 'ADMIN' && !formData.userId) {
      errors.userId = 'Выберите пользователя (учителя)';
    }
    
    if (!formData.paymentInfo.amount || formData.paymentInfo.amount <= 0) {
      errors.amount = 'Сумма предоплаты должна быть больше 0';
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
      // Сначала создаем занятия
      const lessonsResponse = await apiRequest('/api/lessons/bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          studentIds: formData.lessonType === 'group' ? selectedStudents.map(s => s.id) : undefined,
          cost: parseFloat(formData.cost),
          userId: formData.userId,
          isPaid: false // Создаем как неоплаченные, предоплата их пометит как оплаченные
        }),
      });

      if (!lessonsResponse.ok) {
        const errorData = await lessonsResponse.json();
        throw new Error(errorData.error || 'Ошибка при создании занятий');
      }

      // Затем создаем предоплату
      const paymentResponse = await apiRequest('/api/payments/prepayment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          studentId: parseInt(formData.studentId),
          amount: formData.paymentInfo.amount,
          date: formData.paymentInfo.paymentDate,
          description: formData.paymentInfo.description || `Абонемент за период с ${formData.schedulePattern.startDate} по ${formData.schedulePattern.endDate}`,
          period: {
            startDate: formData.schedulePattern.startDate,
            endDate: formData.schedulePattern.endDate
          }
        }),
      });

      if (paymentResponse.ok) {
        onSuccess();
        onClose();
        // Сбрасываем форму
        setFormData({
          studentId: '',
          userId: null,
          cost: '',
          lessonType: 'individual',
          notes: '',
          isPaid: false,
          schedulePattern: {
            type: 'weekly',
            days: [],
            startDate: '',
            endDate: '',
            time: '10:00',
            duration: 60
          },
          paymentInfo: {
            amount: 0,
            paymentDate: new Date().toISOString().split('T')[0],
            description: ''
          }
        });
        setSelectedStudents([]);
        setValidationErrors({});
        setPreviewLessons([]);
        setCalculatedAmount(0);
      } else {
        const errorData = await paymentResponse.json();
        setError(errorData.error || 'Ошибка при создании предоплаты');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка при создании абонемента');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    if (name.startsWith('schedulePattern.')) {
      const field = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        schedulePattern: {
          ...prev.schedulePattern,
          [field]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
        }
      }));
    } else if (name.startsWith('paymentInfo.')) {
      const field = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        paymentInfo: {
          ...prev.paymentInfo,
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

  const handleDayToggle = (dayValue: number) => {
    setFormData(prev => ({
      ...prev,
      schedulePattern: {
        ...prev.schedulePattern,
        days: prev.schedulePattern.days.includes(dayValue)
          ? prev.schedulePattern.days.filter(d => d !== dayValue)
          : [...prev.schedulePattern.days, dayValue]
      }
    }));
    
    // Очищаем ошибку валидации
    if (validationErrors.days) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.days;
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
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-indigo-50">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Абонемент</h2>
            <p className="text-sm text-gray-600 mt-1">Создание абонемента с расписанием и предоплатой</p>
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
          </div>

          {/* Стоимость */}
          <div>
            <label htmlFor="cost" className="block text-sm font-medium text-gray-700 mb-2">
              <DollarSign className="w-4 h-4 inline mr-2" />
              Стоимость за занятие (тенге)
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

          {/* Период расписания */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <CalendarDays className="w-5 h-5 mr-2" />
              Период абонемента
            </h3>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="periodType" className="block text-sm font-medium text-gray-700 mb-2">
                  Тип периода
                </label>
                <select
                  id="periodType"
                  name="schedulePattern.type"
                  value={formData.schedulePattern.type}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="weekly">Неделя</option>
                  <option value="monthly">Месяц</option>
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
                    name="schedulePattern.startDate"
                    value={formData.schedulePattern.startDate}
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
                    name="schedulePattern.endDate"
                    value={formData.schedulePattern.endDate}
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

          {/* Дни недели */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <Repeat className="w-5 h-5 mr-2" />
              Дни недели
            </h3>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {weekDays.map((day) => (
                <label
                  key={day.value}
                  className={`flex items-center p-3 rounded-md border cursor-pointer transition-colors ${
                    formData.schedulePattern.days.includes(day.value)
                      ? 'bg-blue-100 border-blue-300 text-blue-800'
                      : 'bg-white border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={formData.schedulePattern.days.includes(day.value)}
                    onChange={() => handleDayToggle(day.value)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mr-3"
                  />
                  <span className="text-sm font-medium">{day.label}</span>
                </label>
              ))}
            </div>
            
            {validationErrors.days && (
              <p className="mt-2 text-sm text-red-600 flex items-center">
                <AlertCircle className="w-4 h-4 mr-1" />
                {validationErrors.days}
              </p>
            )}
          </div>

          {/* Время и продолжительность */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <Clock className="w-5 h-5 mr-2" />
              Время и продолжительность
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="time" className="block text-sm font-medium text-gray-700 mb-2">
                  Время начала
                </label>
                <input
                  type="time"
                  id="time"
                  name="schedulePattern.time"
                  value={formData.schedulePattern.time}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div>
                <label htmlFor="duration" className="block text-sm font-medium text-gray-700 mb-2">
                  Продолжительность (минуты)
                </label>
                <select
                  id="duration"
                  name="schedulePattern.duration"
                  value={formData.schedulePattern.duration}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value={30}>30 минут</option>
                  <option value={45}>45 минут</option>
                  <option value={60}>1 час</option>
                  <option value={90}>1.5 часа</option>
                  <option value={120}>2 часа</option>
                </select>
              </div>
            </div>
          </div>

          {/* Информация о предоплате */}
          <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <CreditCard className="w-5 h-5 mr-2" />
              Предоплата
            </h3>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-2">
                  Сумма предоплаты (тенге)
                </label>
                <input
                  type="number"
                  id="amount"
                  name="paymentInfo.amount"
                  value={formData.paymentInfo.amount}
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
                    Сумма рассчитана на основе количества занятий и стоимости за занятие
                  </p>
                </div>
              )}
              
              <div>
                <label htmlFor="paymentDate" className="block text-sm font-medium text-gray-700 mb-2">
                  Дата платежа
                </label>
                <input
                  type="date"
                  id="paymentDate"
                  name="paymentInfo.paymentDate"
                  value={formData.paymentInfo.paymentDate}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                  Описание платежа
                </label>
                <textarea
                  id="description"
                  name="paymentInfo.description"
                  value={formData.paymentInfo.description}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 resize-none"
                  placeholder="Дополнительная информация о платеже..."
                />
              </div>
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
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 resize-none"
              placeholder="Дополнительная информация об абонементе..."
            />
          </div>

          {/* Предварительный просмотр */}
          {previewLessons.length > 0 && (
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <Calendar className="w-5 h-5 mr-2" />
                Предварительный просмотр ({previewLessons.length} занятий)
              </h3>
              
              <div className="max-h-40 overflow-y-auto">
                <div className="space-y-2">
                  {previewLessons.map((lesson, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-white rounded border">
                      <div className="flex items-center space-x-3">
                        <span className="text-sm font-medium text-gray-600">
                          {lesson.date.toLocaleDateString('ru-RU')}
                        </span>
                        <span className="text-sm text-gray-500">
                          {lesson.dayName}
                        </span>
                        <span className="text-sm text-gray-500">
                          {lesson.date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })} - 
                          {lesson.endTime.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <span className="text-sm font-medium text-gray-900">
                        {formData.cost ? `${parseFloat(formData.cost).toLocaleString()} ₸` : '0 ₸'}
                      </span>
                    </div>
                  ))}
                </div>
                
                {previewLessons.length === 20 && (
                  <p className="text-xs text-blue-600 mt-2">
                    Показаны первые 20 занятий. Всего будет создано больше занятий.
                  </p>
                )}
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
              disabled={loading || previewLessons.length === 0}
              className="flex-1 px-6 py-3 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 transition-colors font-medium flex items-center justify-center"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Создание абонемента...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Создать абонемент ({previewLessons.length} занятий)
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
