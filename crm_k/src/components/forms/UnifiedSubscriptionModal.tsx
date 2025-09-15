'use client';

import { useState, useEffect, useMemo } from 'react';
import { 
  X, Calendar, User as UserIcon, DollarSign, Clock, AlertCircle, 
  CheckCircle, Users, CalendarDays, Repeat, CreditCard,
  ChevronRight, Info, Calculator, Zap, Settings, Plus, Minus
} from 'lucide-react';
import { Student, User, PaymentStatus, getPaymentStatusText, getPaymentStatusDescription } from '@/types';
import { apiRequest } from '@/lib/api';
import { useAuth } from '@/presentation/contexts';
import Modal, { ModalSection, ModalFooter } from '@/components/ui/Modal';
import StudentSearch from '@/components/ui/StudentSearch';
import UserSelector from '@/components/ui/UserSelector';
import CalendarSelector from './CalendarSelector';
import TimeScheduler from './TimeScheduler';

interface UnifiedSubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  selectedStudent?: Student;
  editingSubscription?: any; // Добавляем поддержку редактирования
}

type SubscriptionType = 'regular' | 'flexible';

interface RegularSubscriptionData {
  studentId: string;
  userId: number | null;
  cost: string;
  lessonType: 'individual' | 'group';
  notes: string;
  isPaid: boolean;
  paymentStatus: PaymentStatus;
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

interface FlexibleSubscriptionData {
  studentId: number;
  userId: number;
  startDate: string;
  endDate: string;
  description: string;
  selectedDays: string[]; // Массив дат в формате 'YYYY-MM-DD'
  timeSlots: Record<string, {
    id: string;
    startTime: string;
    endTime: string;
    cost: number;
    paymentStatus: 'PAID' | 'UNPAID';
    notes: string;
  }[]>; // Ключ - дата, значение - массив временных слотов
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

// Компонент формы для обычного абонемента
const RegularSubscriptionForm = ({ 
  data, 
  setData, 
  students, 
  selectedStudents, 
  setSelectedStudents, 
  lessonsCount, 
  totalAmount, 
  validationErrors,
  user 
}: any) => {
  // Для админа показываем всех учеников, для обычных пользователей - только тех, с кем проводил занятия
  const filteredStudents = user?.role === 'ADMIN' 
    ? students // Админ видит всех учеников
    : students; // Обычные пользователи видят только тех учеников, с которыми проводили занятия (фильтрация происходит в API)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    if (name.startsWith('schedulePattern.')) {
      const field = name.split('.')[1];
      setData((prev: RegularSubscriptionData) => ({
        ...prev,
        schedulePattern: {
          ...prev.schedulePattern,
          [field]: value
        }
      }));
    } else if (name.startsWith('paymentInfo.')) {
      const field = name.split('.')[1];
      setData((prev: RegularSubscriptionData) => ({
        ...prev,
        paymentInfo: {
          ...prev.paymentInfo,
          [field]: type === 'number' ? parseFloat(value) || 0 : value
        }
      }));
    } else {
      setData((prev: RegularSubscriptionData) => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleStudentSelectionChange = (students: Student[]) => {
    setSelectedStudents(students);
    
    if (data.lessonType === 'individual' && students.length > 0) {
      setData((prev: RegularSubscriptionData) => ({
        ...prev,
        studentId: students[0].id.toString()
      }));
    }
  };

  return (
    <>
      {/* Выбор ученика/группы */}
      <ModalSection icon={<Users />} title="Ученик или группа">
        {user?.role === 'ADMIN' && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Учитель
            </label>
            <UserSelector
              selectedUserId={data.userId || undefined}
              onUserChange={(userId) => {
                setData((prev: RegularSubscriptionData) => ({ ...prev, userId: userId || null }));
                setSelectedStudents([]);
                setData((prev: RegularSubscriptionData) => ({ ...prev, studentId: '' }));
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
              checked={data.lessonType === 'individual'}
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
              checked={data.lessonType === 'group'}
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
            data.lessonType === 'individual' 
              ? "Найти ученика..." 
              : "Найти учеников для группы..."
          }
          multiple={data.lessonType === 'group'}
          className={validationErrors.studentId ? 'border-red-300' : ''}
          disabled={!data.userId && user?.role === 'ADMIN'}
        />
        {validationErrors.studentId && (
          <p className="mt-1 text-sm text-red-600">{validationErrors.studentId}</p>
        )}
      </ModalSection>

      {/* Период и расписание */}
      <ModalSection icon={<CalendarDays />} title="Период и расписание">
        <QuickPeriodSelector
          selected={data.schedulePattern.type}
          onChange={(type) => setData((prev: RegularSubscriptionData) => ({
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
              value={data.schedulePattern.startDate}
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
              value={data.schedulePattern.endDate}
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
            selectedDays={data.schedulePattern.days}
            onChange={(days) => setData((prev: RegularSubscriptionData) => ({
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
              value={data.schedulePattern.time}
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
              value={data.schedulePattern.duration}
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

      {/* Стоимость и оплата */}
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
              value={data.cost}
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
          prepaymentAmount={data.paymentInfo.amount}
          onPrepaymentChange={(amount) => setData((prev: RegularSubscriptionData) => ({
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
            value={data.notes}
            onChange={handleChange}
            rows={2}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
            placeholder="Дополнительная информация..."
          />
        </div>
      </ModalSection>

      {/* Статус платежа */}
      <ModalSection icon={<CreditCard />} title="Статус платежа">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Статус платежа *
          </label>
          <select
            name="paymentStatus"
            value={data.paymentStatus}
            onChange={handleChange}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              validationErrors.paymentStatus ? 'border-red-300' : 'border-gray-300'
            }`}
          >
            <option value="UNPAID">Не оплачено - запланировано не оплачено</option>
            <option value="PAID">Оплачено - идет в предоплату ученика</option>
          </select>
          {validationErrors.paymentStatus && (
            <p className="mt-1 text-sm text-red-600">{validationErrors.paymentStatus}</p>
          )}
          <p className="mt-2 text-sm text-gray-600">
            {data.paymentStatus === 'PAID' 
              ? 'Все занятия будут созданы как оплаченные и добавлены в предоплату ученика'
              : 'Все занятия будут созданы как неоплаченные'
            }
          </p>
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
    </>
  );
};

// Компонент формы для гибкого абонемента  
const FlexibleSubscriptionForm = ({ 
  data, 
  setData, 
  students, 
  totalAmount, 
  validationErrors 
}: any) => {
  return (
    <>
      {/* Основная информация */}
      <ModalSection icon={<Users />} title="Основная информация">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ученик *
            </label>
            <select
              value={data.studentId}
              onChange={(e) => setData((prev: FlexibleSubscriptionData) => ({ ...prev, studentId: parseInt(e.target.value) }))}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                validationErrors.studentId ? 'border-red-300' : 'border-gray-300'
              }`}
            >
              <option value={0}>Выберите ученика</option>
              {students.map((student: Student) => (
                <option key={student.id} value={student.id}>
                  {student.fullName}
                </option>
              ))}
            </select>
            {validationErrors.studentId && (
              <p className="mt-1 text-sm text-red-600">{validationErrors.studentId}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Учитель *
            </label>
            <UserSelector
              selectedUserId={data.userId || undefined}
              onUserChange={(userId) => {
                setData((prev: FlexibleSubscriptionData) => ({ ...prev, userId: userId || 0 }));
              }}
              placeholder="Выберите учителя..."
              showUserCount={true}
              className={validationErrors.userId ? 'border-red-300' : ''}
            />
            {validationErrors.userId && (
              <p className="mt-1 text-sm text-red-600">{validationErrors.userId}</p>
            )}
          </div>


          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Описание
            </label>
            <input
              type="text"
              value={data.description}
              onChange={(e) => setData((prev: FlexibleSubscriptionData) => ({ ...prev, description: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Описание абонемента"
            />
          </div>
        </div>
      </ModalSection>

      {/* Календарь для выбора дней */}
      <ModalSection icon={<CalendarDays />} title="Выбор периода и дней занятий">
        <CalendarSelector
          startDate={data.startDate}
          endDate={data.endDate}
          selectedDays={data.selectedDays}
          onDaysChange={(days) => setData((prev: FlexibleSubscriptionData) => ({ ...prev, selectedDays: days }))}
          onPeriodChange={(startDate, endDate) => setData((prev: FlexibleSubscriptionData) => ({ 
            ...prev, 
            startDate, 
            endDate,
            // Очищаем выбранные дни при изменении периода
            selectedDays: [],
            timeSlots: {}
          }))}
        />
      </ModalSection>

      {/* Настройка времени занятий */}
      <ModalSection icon={<Clock />} title="Настройка времени занятий">
        <TimeScheduler
          selectedDays={data.selectedDays}
          timeSlots={data.timeSlots}
          onTimeSlotsChange={(timeSlots) => setData((prev: FlexibleSubscriptionData) => ({ ...prev, timeSlots }))}
        />
      </ModalSection>


      {/* Общая стоимость */}
      {totalAmount > 0 && (
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border border-green-100">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <Calculator className="w-5 h-5 mr-2 text-green-600" />
              Общая стоимость абонемента
            </h3>
            <span className="text-2xl font-bold text-green-700">{totalAmount.toLocaleString()} ₸</span>
          </div>
          <p className="text-sm text-green-600 mt-2">
            Включает все занятия из выбранных дней
          </p>
        </div>
      )}
    </>
  );
};

export default function UnifiedSubscriptionModal({ 
  isOpen, 
  onClose, 
  onSuccess,
  selectedStudent,
  editingSubscription 
}: UnifiedSubscriptionModalProps) {
  const { user } = useAuth();
  const [subscriptionType, setSubscriptionType] = useState<SubscriptionType>('regular');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudents, setSelectedStudents] = useState<Student[]>([]);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [suggestAlternativeTime, setSuggestAlternativeTime] = useState(false);

  // Состояние для обычного абонемента
  const [regularData, setRegularData] = useState<RegularSubscriptionData>({
    studentId: selectedStudent?.id?.toString() || '',
    userId: null,
    cost: '',
    lessonType: 'individual',
    notes: '',
    isPaid: false,
    paymentStatus: 'UNPAID',
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

  // Состояние для гибкого абонемента
  // Устанавливаем период по умолчанию на текущий месяц
  const today = new Date();
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
  const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  
  const [flexibleData, setFlexibleData] = useState<FlexibleSubscriptionData>({
    studentId: selectedStudent?.id || 0,
    userId: 0,
    startDate: firstDay.toISOString().split('T')[0],
    endDate: lastDay.toISOString().split('T')[0],
    description: '',
    selectedDays: [],
    timeSlots: {}
  });

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

  // Обновляем форму при изменении selectedStudent
  useEffect(() => {
    if (selectedStudent) {
      setRegularData(prev => ({
        ...prev,
        studentId: selectedStudent.id.toString()
      }));
      setFlexibleData(prev => ({
        ...prev,
        studentId: selectedStudent.id
      }));
      setSelectedStudents([selectedStudent]);
    }
  }, [selectedStudent]);

  // Инициализируем форму данными редактируемого абонемента
  useEffect(() => {
    if (editingSubscription) {
      setSubscriptionType('flexible'); // Редактируем только гибкие абонементы
      
      // Преобразуем старую структуру weekSchedules в новую структуру selectedDays и timeSlots
      const selectedDays: string[] = [];
      const timeSlots: Record<string, any[]> = {};
      
      editingSubscription.weekSchedules.forEach((week: any) => {
        week.weekDays.forEach((day: any) => {
          const dayDate = new Date(day.startTime).toISOString().split('T')[0];
          if (!selectedDays.includes(dayDate)) {
            selectedDays.push(dayDate);
          }
          
          if (!timeSlots[dayDate]) {
            timeSlots[dayDate] = [];
          }
          
          timeSlots[dayDate].push({
            id: day.id || `${dayDate}-${Date.now()}-${Math.random()}`,
            startTime: new Date(day.startTime).toTimeString().split(' ')[0].substring(0, 5),
            endTime: new Date(day.endTime).toTimeString().split(' ')[0].substring(0, 5),
            cost: parseInt(day.cost) || 0,
            paymentStatus: 'UNPAID', // Всегда устанавливаем как неоплаченный
            notes: day.notes || ''
          });
        });
      });
      
      setFlexibleData({
        studentId: editingSubscription.studentId,
        userId: editingSubscription.userId,
        startDate: new Date(editingSubscription.startDate).toISOString().split('T')[0],
        endDate: new Date(editingSubscription.endDate).toISOString().split('T')[0],
        description: editingSubscription.description || '',
        selectedDays: selectedDays.sort(),
        timeSlots: timeSlots
      });
      setSelectedStudents([editingSubscription.student]);
    }
  }, [editingSubscription]);

  // Расчет количества занятий для обычного абонемента
  const lessonsCount = useMemo(() => {
    if (subscriptionType !== 'regular') return 0;
    
    if (!regularData.schedulePattern.startDate || !regularData.schedulePattern.endDate || regularData.schedulePattern.days.length === 0) {
      return 0;
    }

    const startDate = new Date(regularData.schedulePattern.startDate);
    const endDate = new Date(regularData.schedulePattern.endDate);
    let count = 0;
    const currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      const dayOfWeek = currentDate.getDay();
      if (regularData.schedulePattern.days.includes(dayOfWeek)) {
        count++;
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return count;
  }, [subscriptionType, regularData.schedulePattern]);

  // Расчет общей суммы для обычного абонемента
  const totalAmount = useMemo(() => {
    if (subscriptionType !== 'regular') return 0;
    return lessonsCount * (parseFloat(regularData.cost) || 0);
  }, [subscriptionType, lessonsCount, regularData.cost]);

  // Расчет общей суммы для гибкого абонемента
  const flexibleTotalAmount = useMemo(() => {
    if (subscriptionType !== 'flexible') return 0;
    return Object.values(flexibleData.timeSlots).reduce((total, slots) => {
      return total + slots.reduce((dayTotal, slot) => dayTotal + slot.cost, 0);
    }, 0);
  }, [subscriptionType, flexibleData.timeSlots]);

  // Автоматически обновляем сумму предоплаты при изменении общей суммы
  useEffect(() => {
    if (subscriptionType === 'regular' && totalAmount > 0) {
      setRegularData(prev => ({
        ...prev,
        paymentInfo: {
          ...prev.paymentInfo,
          amount: totalAmount
        }
      }));
    }
  }, [subscriptionType, totalAmount]);

  // Автоматически устанавливаем даты при выборе периода для обычного абонемента
  useEffect(() => {
    if (subscriptionType !== 'regular') return;
    
    const today = new Date();
    let startDate: Date;
    let endDate: Date;

    switch (regularData.schedulePattern.type) {
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

    setRegularData(prev => ({
      ...prev,
      schedulePattern: {
        ...prev.schedulePattern,
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0]
      }
    }));
  }, [subscriptionType, regularData.schedulePattern.type]);

  // Функция для предложения альтернативного времени
  const suggestAlternativeTimeSlot = () => {
    if (subscriptionType !== 'regular') return;
    
    // Простое предложение: сдвигаем время на час вперед
    const currentTime = regularData.schedulePattern.time;
    const [hours, minutes] = currentTime.split(':').map(Number);
    let newHours = hours + 1;
    
    // Если время выходит за рабочие часы (после 18:00), начинаем с утра
    if (newHours > 18) {
      newHours = 9; // Начинаем с 9:00
    }
    
    const newTime = `${newHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    
    setRegularData(prev => ({
      ...prev,
      schedulePattern: {
        ...prev.schedulePattern,
        time: newTime
      }
    }));
    
    setSuggestAlternativeTime(false);
    setError('');
  };

  // Функция валидации формы
  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (subscriptionType === 'regular') {
      if (!regularData.studentId) {
        errors.studentId = 'Выберите ученика';
      }
      if (!regularData.userId) {
        errors.userId = 'Выберите преподавателя';
      }
      if (!regularData.cost || parseFloat(regularData.cost) <= 0) {
        errors.cost = 'Введите корректную стоимость занятия';
      }
      if (!regularData.schedulePattern.startDate) {
        errors.startDate = 'Выберите дату начала';
      }
      if (!regularData.schedulePattern.endDate) {
        errors.endDate = 'Выберите дату окончания';
      }
      if (regularData.schedulePattern.days.length === 0) {
        errors.days = 'Выберите дни недели';
      }
      if (!regularData.schedulePattern.time) {
        errors.time = 'Выберите время занятия';
      }
      if (!regularData.paymentStatus) {
        errors.paymentStatus = 'Выберите статус платежа';
      }
    } else if (subscriptionType === 'flexible') {
      if (!flexibleData.studentId) {
        errors.studentId = 'Выберите ученика';
      }
      if (!flexibleData.userId) {
        errors.userId = 'Выберите преподавателя';
      }
      if (!flexibleData.startDate) {
        errors.startDate = 'Выберите дату начала в календаре';
      }
      if (!flexibleData.endDate) {
        errors.endDate = 'Выберите дату окончания в календаре';
      }
      if (!flexibleData.selectedDays || flexibleData.selectedDays.length === 0) {
        errors.selectedDays = 'Выберите дни занятий в календаре';
      }
      if (!flexibleData.timeSlots || Object.keys(flexibleData.timeSlots).length === 0) {
        errors.timeSlots = 'Настройте время занятий';
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Функция отправки формы
  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError('');
    setSuggestAlternativeTime(false);
    
    console.log('Начинаем создание абонемента:', {
      subscriptionType,
      regularData: subscriptionType === 'regular' ? regularData : null,
      flexibleData: subscriptionType === 'flexible' ? flexibleData : null
    });

    try {
      if (subscriptionType === 'regular') {
        // Создание обычного абонемента
        const requestData = {
          ...regularData,
          studentId: regularData.lessonType === 'individual' ? regularData.studentId : undefined,
          studentIds: regularData.lessonType === 'group' ? selectedStudents.map(s => s.id) : undefined,
          cost: parseFloat(regularData.cost),
          userId: regularData.userId,
          isPaid: false, // Всегда создаем занятия как неоплаченные, предоплата их пометит как оплаченные
          paymentStatus: 'UNPAID' // Изначально все занятия неоплачены
        };
        
        console.log('Отправляем данные для создания занятий:', JSON.stringify(requestData, null, 2));
        
        const lessonsResponse = await apiRequest('/api/lessons/bulk', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestData),
        });

        if (!lessonsResponse.ok) {
          const errorData = await lessonsResponse.json();
          
          
          throw new Error(errorData.error || 'Ошибка при создании занятий');
        }

        // Создание предоплаты только если пользователь указал, что абонемент оплачен
        if (regularData.paymentStatus === 'PAID') {
          const paymentData = {
            studentId: parseInt(regularData.studentId),
            amount: regularData.paymentInfo.amount,
            date: regularData.paymentInfo.paymentDate,
            description: regularData.paymentInfo.description || `Абонемент на ${lessonsCount} занятий`,
            period: {
              startDate: regularData.schedulePattern.startDate,
              endDate: regularData.schedulePattern.endDate
            }
          };
          
          console.log('Отправляем данные для создания предоплаты:', JSON.stringify(paymentData, null, 2));
          
          const paymentResponse = await apiRequest('/api/payments/prepayment', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(paymentData),
          });

          if (!paymentResponse.ok) {
            const errorData = await paymentResponse.json();
            throw new Error(errorData.error || 'Ошибка при создании предоплаты');
          }
        }
      } else if (subscriptionType === 'flexible') {
        // Преобразуем новую структуру данных в формат, ожидаемый API
        const weekSchedules = [];
        const selectedDays = flexibleData.selectedDays.sort();
        
        // Группируем дни по неделям
        let currentWeek = 1;
        let weekStartDate = '';
        let weekEndDate = '';
        let weekDays: any[] = [];
        
        selectedDays.forEach((date, index) => {
          const dayDate = new Date(date);
          const dayOfWeek = dayDate.getDay();
          
          // Если это первый день или начало новой недели
          if (index === 0 || (index > 0 && dayDate.getTime() - new Date(selectedDays[index - 1]).getTime() > 7 * 24 * 60 * 60 * 1000)) {
            // Сохраняем предыдущую неделю, если есть дни
            if (weekDays.length > 0) {
              weekSchedules.push({
                weekNumber: currentWeek,
                startDate: weekStartDate,
                endDate: weekEndDate,
                weekDays: weekDays
              });
              currentWeek++;
            }
            
            // Начинаем новую неделю
            weekStartDate = date;
            weekEndDate = date;
            weekDays = [];
          }
          
          // Обновляем конец недели
          weekEndDate = date;
          
          // Добавляем временные слоты для этого дня
          const dayTimeSlots = flexibleData.timeSlots[date] || [];
          dayTimeSlots.forEach(slot => {
            weekDays.push({
              id: slot.id,
              dayOfWeek: dayOfWeek,
              startTime: `${slot.startTime}:00`, // Отправляем только время в формате HH:MM:SS
              endTime: `${slot.endTime}:00`, // Отправляем только время в формате HH:MM:SS
              cost: slot.cost.toString(),
              location: 'office', // Устанавливаем по умолчанию
              notes: slot.notes
            });
          });
        });
        
        // Добавляем последнюю неделю
        if (weekDays.length > 0) {
          weekSchedules.push({
            weekNumber: currentWeek,
            startDate: weekStartDate,
            endDate: weekEndDate,
            weekDays: weekDays
          });
        }
        
        // Создание или редактирование гибкого абонемента
        const requestData = {
          name: flexibleData.description || `Гибкий абонемент ${new Date().toLocaleDateString()}`, // Добавляем обязательное поле name
          studentId: flexibleData.studentId,
          userId: flexibleData.userId,
          startDate: flexibleData.startDate,
          endDate: flexibleData.endDate,
          description: flexibleData.description,
          paymentStatus: 'UNPAID', // Всегда создаем как неоплаченный
          totalCost: flexibleTotalAmount,
          weekSchedules: weekSchedules,
          paidDayIds: [] // Убираем логику частичной оплаты
        };

        const isEditing = !!editingSubscription;
        const url = isEditing 
          ? `/api/flexible-subscriptions/${editingSubscription.id}`
          : '/api/flexible-subscriptions';
        const method = isEditing ? 'PUT' : 'POST';
        
        console.log(`Отправляем данные для ${isEditing ? 'редактирования' : 'создания'} гибкого абонемента:`, JSON.stringify(requestData, null, 2));

        const response = await apiRequest(url, {
          method,
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestData),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || `Ошибка при ${isEditing ? 'редактировании' : 'создании'} гибкого абонемента`);
        }
      }

      setSuggestAlternativeTime(false);
      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка при создании абонемента');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingSubscription ? "Редактирование абонемента" : "Создание абонемента"}
      size="lg"
      footer={
        <ModalFooter
          onCancel={onClose}
          onConfirm={
            (subscriptionType === 'regular' && lessonsCount > 0) || 
            (subscriptionType === 'flexible' && flexibleTotalAmount > 0) 
              ? handleSubmit 
              : undefined
          }
          confirmText={
            loading 
              ? (editingSubscription ? 'Сохранение...' : (subscriptionType === 'flexible' ? 'Создание абонемента и уроков...' : 'Создание...')) 
              : subscriptionType === 'regular' 
                ? `Создать абонемент (${lessonsCount} занятий)` 
                : editingSubscription
                  ? `Сохранить изменения (${flexibleTotalAmount.toLocaleString()} ₸)`
                  : `Создать гибкий абонемент и уроки (${flexibleTotalAmount.toLocaleString()} ₸)`
          }
          loading={loading}
        />
      }
    >
      <div className="space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl">
            <div className="flex items-start">
              <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <div className="font-medium mb-1">Ошибка при создании абонемента</div>
                <div className="text-sm whitespace-pre-line mb-3">{error}</div>
                {suggestAlternativeTime && subscriptionType === 'regular' && (
                  <button
                    type="button"
                    onClick={suggestAlternativeTimeSlot}
                    className="px-3 py-1.5 text-xs bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors font-medium"
                  >
                    Предложить другое время
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Выбор типа абонемента */}
        <ModalSection icon={<Settings />} title="Тип абонемента">
          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => setSubscriptionType('regular')}
              className={`
                relative p-4 rounded-xl border-2 transition-all duration-200
                ${subscriptionType === 'regular'
                  ? 'border-blue-500 bg-blue-50 shadow-sm' 
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }
              `}
            >
              <div className="text-sm font-medium text-gray-900">Обычный абонемент</div>
              <div className="text-xs text-gray-500 mt-1">Фиксированное расписание</div>
              {subscriptionType === 'regular' && (
                <CheckCircle className="absolute top-2 right-2 w-4 h-4 text-blue-500" />
              )}
            </button>
            
            <button
              type="button"
              onClick={() => setSubscriptionType('flexible')}
              className={`
                relative p-4 rounded-xl border-2 transition-all duration-200
                ${subscriptionType === 'flexible'
                  ? 'border-green-500 bg-green-50 shadow-sm' 
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }
              `}
            >
              <div className="text-sm font-medium text-gray-900">Гибкий абонемент</div>
              <div className="text-xs text-gray-500 mt-1">Разное расписание по неделям</div>
              {subscriptionType === 'flexible' && (
                <CheckCircle className="absolute top-2 right-2 w-4 h-4 text-green-500" />
              )}
            </button>
          </div>
        </ModalSection>

        {/* Формы для разных типов абонементов */}
        {subscriptionType === 'regular' ? (
          <RegularSubscriptionForm 
            data={regularData}
            setData={setRegularData}
            students={students}
            selectedStudents={selectedStudents}
            setSelectedStudents={setSelectedStudents}
            lessonsCount={lessonsCount}
            totalAmount={totalAmount}
            validationErrors={validationErrors}
            user={user}
          />
        ) : (
          <FlexibleSubscriptionForm 
            data={flexibleData}
            setData={setFlexibleData}
            students={students}
            totalAmount={flexibleTotalAmount}
            validationErrors={validationErrors}
          />
        )}
      </div>
    </Modal>
  );
}
