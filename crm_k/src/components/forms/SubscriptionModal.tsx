'use client';

import { useState, useEffect, useMemo } from 'react';
import { 
  X, Calendar, User, DollarSign, Clock, AlertCircle, 
  CheckCircle, Users, CalendarDays, Repeat, CreditCard,
  ChevronRight, Info, Calculator, Zap
} from 'lucide-react';
import { Student } from '@/types';
import { apiRequest } from '@/lib/api';
import { useAuth } from '@/presentation/contexts';
import Modal, { ModalSection, ModalFooter } from '@/components/ui/Modal';
import StudentSearch from '@/components/ui/StudentSearch';
import UserSelector from '@/components/ui/UserSelector';

interface SubscriptionModalProps {
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

// Компонент для быстрого выбора периода
const QuickPeriodSelector = ({ 
  selected, 
  onChange 
}: { 
  selected: string; 
  onChange: (type: 'weekly' | 'monthly' | 'custom') => void 
}) => {
  const options = [
    { value: 'weekly', label: 'Неделя', icon: '7 дней' },
    { value: 'monthly', label: 'Месяц', icon: '30 дней' },
    { value: 'custom', label: 'Свой период', icon: 'Выбрать' }
  ];

  return (
    <div className="grid grid-cols-3 gap-3 mb-4">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value as any)}
          className={`
            relative p-4 rounded-xl border-2 transition-all duration-200
            ${selected === option.value
              ? 'border-blue-500 bg-blue-50 shadow-sm' 
              : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
            }
          `}
        >
          <div className="text-sm font-medium text-gray-900">{option.label}</div>
          <div className="text-xs text-gray-500 mt-1">{option.icon}</div>
          {selected === option.value && (
            <div className="absolute top-2 right-2">
              <CheckCircle className="w-4 h-4 text-blue-500" />
            </div>
          )}
        </button>
      ))}
    </div>
  );
};

// Компонент для выбора дней недели
const WeekDaySelector = ({ 
  selectedDays, 
  onChange 
}: { 
  selectedDays: number[]; 
  onChange: (days: number[]) => void 
}) => {
  const weekDays = [
    { value: 1, label: 'Пн', fullLabel: 'Понедельник' },
    { value: 2, label: 'Вт', fullLabel: 'Вторник' },
    { value: 3, label: 'Ср', fullLabel: 'Среда' },
    { value: 4, label: 'Чт', fullLabel: 'Четверг' },
    { value: 5, label: 'Пт', fullLabel: 'Пятница' },
    { value: 6, label: 'Сб', fullLabel: 'Суббота' },
    { value: 0, label: 'Вс', fullLabel: 'Воскресенье' }
  ];

  const toggleDay = (dayValue: number) => {
    onChange(
      selectedDays.includes(dayValue)
        ? selectedDays.filter(d => d !== dayValue)
        : [...selectedDays, dayValue]
    );
  };

  return (
    <div className="flex gap-2">
      {weekDays.map((day) => (
        <button
          key={day.value}
          type="button"
          onClick={() => toggleDay(day.value)}
          className={`
            flex-1 py-3 px-2 rounded-lg font-medium text-sm transition-all duration-200
            ${selectedDays.includes(day.value)
              ? 'bg-blue-500 text-white shadow-sm' 
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }
          `}
          title={day.fullLabel}
        >
          {day.label}
        </button>
      ))}
    </div>
  );
};

// Компонент для отображения суммарной информации
const SummaryCard = ({ 
  lessonsCount, 
  totalAmount, 
  prepaymentAmount,
  onPrepaymentChange
}: { 
  lessonsCount: number; 
  totalAmount: number; 
  prepaymentAmount: number;
  onPrepaymentChange: (amount: number) => void;
}) => {
  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <Calculator className="w-5 h-5 mr-2" />
          Итоговая информация
        </h3>
        <div className="text-sm text-gray-600">
          {lessonsCount} {lessonsCount === 1 ? 'занятие' : lessonsCount < 5 ? 'занятия' : 'занятий'}
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Общая стоимость:</span>
          <span className="text-xl font-bold text-gray-900">{totalAmount.toLocaleString()} ₸</span>
        </div>
        
        <div className="pt-3 border-t border-blue-100">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Сумма предоплаты
          </label>
          <div className="relative">
            <CreditCard className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="number"
              value={prepaymentAmount}
              onChange={(e) => onPrepaymentChange(Number(e.target.value))}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="0"
              min="0"
              max={totalAmount}
            />
          </div>
          {prepaymentAmount > 0 && (
            <div className="mt-2 text-sm text-gray-600">
              {Math.round((prepaymentAmount / totalAmount) * 100)}% от общей суммы
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default function SubscriptionModal({ 
  isOpen, 
  onClose, 
  onSuccess,
  selectedStudent 
}: SubscriptionModalProps) {
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
      days: [1, 3, 5], // По умолчанию Пн, Ср, Пт
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

  // Для админа показываем всех учеников, для обычных пользователей - только тех, с кем проводил занятия
  const filteredStudents = user?.role === 'ADMIN' 
    ? students // Админ видит всех учеников
    : students; // Обычные пользователи видят только тех учеников, с которыми проводили занятия (фильтрация происходит в API)

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

  // Расчет количества занятий
  const lessonsCount = useMemo(() => {
    if (!formData.schedulePattern.startDate || !formData.schedulePattern.endDate || formData.schedulePattern.days.length === 0) {
      return 0;
    }

    const startDate = new Date(formData.schedulePattern.startDate);
    const endDate = new Date(formData.schedulePattern.endDate);
    let count = 0;
    const currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      const dayOfWeek = currentDate.getDay();
      if (formData.schedulePattern.days.includes(dayOfWeek)) {
        count++;
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return count;
  }, [formData.schedulePattern]);

  // Расчет общей суммы
  const totalAmount = useMemo(() => {
    return lessonsCount * (parseFloat(formData.cost) || 0);
  }, [lessonsCount, formData.cost]);

  // Автоматически обновляем сумму предоплаты при изменении общей суммы
  useEffect(() => {
    if (totalAmount > 0) {
      setFormData(prev => ({
        ...prev,
        paymentInfo: {
          ...prev.paymentInfo,
          amount: totalAmount
        }
      }));
    }
  }, [totalAmount]);

  // Автоматически устанавливаем даты при выборе периода
  useEffect(() => {
    const today = new Date();
    let startDate: Date;
    let endDate: Date;

    switch (formData.schedulePattern.type) {
      case 'weekly':
        startDate = new Date(today);
        endDate = new Date(today);
        endDate.setDate(endDate.getDate() + 6);
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
      errors.startDate = 'Выберите дату начала';
    }
    
    if (!formData.schedulePattern.endDate) {
      errors.endDate = 'Выберите дату окончания';
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
        errors.studentId = 'Выберите учеников для группы';
      }
    }
    
    if (!formData.cost || parseFloat(formData.cost) <= 0) {
      errors.cost = 'Укажите стоимость занятия';
    }
    
    if (user?.role === 'ADMIN' && !formData.userId) {
      errors.userId = 'Выберите учителя';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    
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
          description: formData.paymentInfo.description || `Абонемент на ${lessonsCount} занятий`,
          period: {
            startDate: formData.schedulePattern.startDate,
            endDate: formData.schedulePattern.endDate
          }
        }),
      });

      if (paymentResponse.ok) {
        onSuccess();
        onClose();
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
          [field]: value
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
        [name]: value
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
    
    if (formData.lessonType === 'individual' && students.length > 0) {
      setFormData(prev => ({
        ...prev,
        studentId: students[0].id.toString()
      }));
    }
    
    if (validationErrors.studentId) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.studentId;
        return newErrors;
      });
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Создание абонемента"
      size="lg"
      footer={
        <ModalFooter
          onCancel={onClose}
          onConfirm={lessonsCount > 0 ? () => handleSubmit() : undefined}
          confirmText={loading ? 'Создание...' : `Создать абонемент (${lessonsCount} занятий)`}
          loading={loading}
        />
      }
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center">
            <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />
            {error}
          </div>
        )}

        {/* Шаг 1: Выбор ученика/группы */}
        <ModalSection icon={<Users />} title="Ученик или группа">
          {user?.role === 'ADMIN' && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Учитель
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
                <p className="mt-1 text-sm text-red-600">{validationErrors.userId}</p>
              )}
            </div>
          )}

          <div className="flex gap-4 mb-4">
            <label className="flex items-center cursor-pointer">
              <input
                type="radio"
                name="lessonType"
                value="individual"
                checked={formData.lessonType === 'individual'}
                onChange={handleChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm font-medium text-gray-700">Индивидуальное</span>
            </label>
            <label className="flex items-center cursor-pointer">
              <input
                type="radio"
                name="lessonType"
                value="group"
                checked={formData.lessonType === 'group'}
                onChange={handleChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm font-medium text-gray-700">Групповое</span>
            </label>
          </div>

          <StudentSearch
            students={filteredStudents}
            selectedStudents={selectedStudents}
            onSelectionChange={handleStudentSelectionChange}
            placeholder={
              formData.lessonType === 'individual' 
                ? "Найти ученика..." 
                : "Найти учеников для группы..."
            }
            multiple={formData.lessonType === 'group'}
            className={validationErrors.studentId ? 'border-red-300' : ''}
            disabled={!formData.userId && user?.role === 'ADMIN'}
          />
          {validationErrors.studentId && (
            <p className="mt-1 text-sm text-red-600">{validationErrors.studentId}</p>
          )}
        </ModalSection>

        {/* Шаг 2: Период и расписание */}
        <ModalSection icon={<CalendarDays />} title="Период и расписание">
          <QuickPeriodSelector
            selected={formData.schedulePattern.type}
            onChange={(type) => setFormData(prev => ({
              ...prev,
              schedulePattern: { ...prev.schedulePattern, type }
            }))}
          />

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Дата начала
              </label>
              <input
                type="date"
                name="schedulePattern.startDate"
                value={formData.schedulePattern.startDate}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  validationErrors.startDate ? 'border-red-300' : 'border-gray-300'
                }`}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Дата окончания
              </label>
              <input
                type="date"
                name="schedulePattern.endDate"
                value={formData.schedulePattern.endDate}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  validationErrors.endDate ? 'border-red-300' : 'border-gray-300'
                }`}
              />
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Дни недели
            </label>
            <WeekDaySelector
              selectedDays={formData.schedulePattern.days}
              onChange={(days) => setFormData(prev => ({
                ...prev,
                schedulePattern: { ...prev.schedulePattern, days }
              }))}
            />
            {validationErrors.days && (
              <p className="mt-1 text-sm text-red-600">{validationErrors.days}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Время начала
              </label>
              <input
                type="time"
                name="schedulePattern.time"
                value={formData.schedulePattern.time}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Продолжительность
              </label>
              <select
                name="schedulePattern.duration"
                value={formData.schedulePattern.duration}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value={30}>30 минут</option>
                <option value={45}>45 минут</option>
                <option value={60}>1 час</option>
                <option value={90}>1.5 часа</option>
                <option value={120}>2 часа</option>
              </select>
            </div>
          </div>
        </ModalSection>

        {/* Шаг 3: Стоимость и оплата */}
        <ModalSection icon={<DollarSign />} title="Стоимость и оплата">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Стоимость одного занятия
            </label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="number"
                name="cost"
                value={formData.cost}
                onChange={handleChange}
                className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  validationErrors.cost ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="0"
                min="0"
                step="100"
              />
              <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">₸</span>
            </div>
            {validationErrors.cost && (
              <p className="mt-1 text-sm text-red-600">{validationErrors.cost}</p>
            )}
          </div>

          {/* Итоговая информация */}
          <SummaryCard
            lessonsCount={lessonsCount}
            totalAmount={totalAmount}
            prepaymentAmount={formData.paymentInfo.amount}
            onPrepaymentChange={(amount) => setFormData(prev => ({
              ...prev,
              paymentInfo: { ...prev.paymentInfo, amount }
            }))}
          />

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Заметки (необязательно)
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
              placeholder="Дополнительная информация..."
            />
          </div>
        </ModalSection>

        {/* Информационный блок */}
        {lessonsCount > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start">
            <Info className="w-5 h-5 text-blue-600 mr-3 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">Будет создано {lessonsCount} занятий</p>
              <p className="text-blue-700">
                Все занятия будут помечены как предоплаченные. После проведения занятий 
                сумма будет автоматически списываться из предоплаты ученика.
              </p>
            </div>
          </div>
        )}
      </form>
    </Modal>
  );
}
