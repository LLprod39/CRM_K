'use client';

import { useState, useEffect, useMemo } from 'react';
import { 
  X, Calendar, User, DollarSign, Clock, AlertCircle, 
  CheckCircle, Users, CalendarDays, Repeat, CreditCard,
  ChevronRight, Info, Calculator, Zap, Settings, Plus, Minus
} from 'lucide-react';
import { Student } from '@/types';
import { apiRequest } from '@/lib/api';
import { useAuth } from '@/presentation/contexts';
import Modal, { ModalSection, ModalFooter } from '@/components/ui/Modal';
import StudentSearch from '@/components/ui/StudentSearch';
import UserSelector from '@/components/ui/UserSelector';

interface UnifiedSubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  selectedStudent?: Student;
}

type SubscriptionType = 'regular' | 'flexible';

interface RegularSubscriptionData {
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

interface FlexibleSubscriptionData {
  name: string;
  studentId: number;
  userId: number;
  startDate: string;
  endDate: string;
  description: string;
  weekSchedules: {
    weekNumber: number;
    startDate: string;
    endDate: string;
    weekDays: {
      dayOfWeek: number;
      startTime: string;
      endTime: string;
      cost: string;
      location: string;
      notes?: string;
    }[];
  }[];
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
  const DAYS_OF_WEEK = [
    { value: 1, label: 'Понедельник' },
    { value: 2, label: 'Вторник' },
    { value: 3, label: 'Среда' },
    { value: 4, label: 'Четверг' },
    { value: 5, label: 'Пятница' },
    { value: 6, label: 'Суббота' },
    { value: 0, label: 'Воскресенье' }
  ];

  const LOCATIONS = [
    { value: 'office', label: 'Офис' },
    { value: 'online', label: 'Онлайн' },
    { value: 'home', label: 'На дому' }
  ];

  const addWeek = () => {
    const newWeek = {
      weekNumber: data.weekSchedules.length + 1,
      startDate: '',
      endDate: '',
      weekDays: []
    };
    
    setData((prev: FlexibleSubscriptionData) => ({
      ...prev,
      weekSchedules: [...prev.weekSchedules, newWeek]
    }));
  };

  const removeWeek = (weekIndex: number) => {
    setData((prev: FlexibleSubscriptionData) => ({
      ...prev,
      weekSchedules: prev.weekSchedules.filter((_, index) => index !== weekIndex)
    }));
  };

  const addDayToWeek = (weekIndex: number) => {
    const newDay = {
      dayOfWeek: 1,
      startTime: '10:00',
      endTime: '11:00',
      cost: '1000',
      location: 'office',
      notes: ''
    };

    setData((prev: FlexibleSubscriptionData) => ({
      ...prev,
      weekSchedules: prev.weekSchedules.map((week, index) => 
        index === weekIndex 
          ? { ...week, weekDays: [...week.weekDays, newDay] }
          : week
      )
    }));
  };

  const removeDayFromWeek = (weekIndex: number, dayIndex: number) => {
    setData((prev: FlexibleSubscriptionData) => ({
      ...prev,
      weekSchedules: prev.weekSchedules.map((week, index) => 
        index === weekIndex 
          ? { ...week, weekDays: week.weekDays.filter((_, dIndex) => dIndex !== dayIndex) }
          : week
      )
    }));
  };

  const updateWeek = (weekIndex: number, field: string, value: any) => {
    setData((prev: FlexibleSubscriptionData) => ({
      ...prev,
      weekSchedules: prev.weekSchedules.map((week, index) => 
        index === weekIndex 
          ? { ...week, [field]: value }
          : week
      )
    }));
  };

  const updateDay = (weekIndex: number, dayIndex: number, field: string, value: any) => {
    setData((prev: FlexibleSubscriptionData) => ({
      ...prev,
      weekSchedules: prev.weekSchedules.map((week, wIndex) => 
        wIndex === weekIndex 
          ? {
              ...week,
              weekDays: week.weekDays.map((day, dIndex) => 
                dIndex === dayIndex 
                  ? { ...day, [field]: value }
                  : day
              )
            }
          : week
      )
    }));
  };

  return (
    <>
      {/* Основная информация */}
      <ModalSection icon={<Users />} title="Основная информация">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Название абонемента *
            </label>
            <input
              type="text"
              value={data.name}
              onChange={(e) => setData((prev: FlexibleSubscriptionData) => ({ ...prev, name: e.target.value }))}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                validationErrors.name ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="Например: Гибкий абонемент на месяц"
            />
            {validationErrors.name && (
              <p className="mt-1 text-sm text-red-600">{validationErrors.name}</p>
            )}
          </div>

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
              Дата начала *
            </label>
            <input
              type="date"
              value={data.startDate}
              onChange={(e) => setData((prev: FlexibleSubscriptionData) => ({ ...prev, startDate: e.target.value }))}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                validationErrors.startDate ? 'border-red-300' : 'border-gray-300'
              }`}
            />
            {validationErrors.startDate && (
              <p className="mt-1 text-sm text-red-600">{validationErrors.startDate}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Дата окончания *
            </label>
            <input
              type="date"
              value={data.endDate}
              onChange={(e) => setData((prev: FlexibleSubscriptionData) => ({ ...prev, endDate: e.target.value }))}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                validationErrors.endDate ? 'border-red-300' : 'border-gray-300'
              }`}
            />
            {validationErrors.endDate && (
              <p className="mt-1 text-sm text-red-600">{validationErrors.endDate}</p>
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

      {/* Расписание недель */}
      <ModalSection icon={<CalendarDays />} title="Расписание недель">
        <div className="flex justify-between items-center mb-4">
          <p className="text-sm text-gray-600">Настройте индивидуальное расписание для каждой недели</p>
          <button
            type="button"
            onClick={addWeek}
            className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            Добавить неделю
          </button>
        </div>

        {data.weekSchedules.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>Добавьте первую неделю расписания</p>
          </div>
        ) : (
          <div className="space-y-4">
            {data.weekSchedules.map((week: any, weekIndex: number) => (
              <div key={weekIndex} className="border border-gray-200 rounded-xl p-4 bg-gray-50">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="font-medium text-gray-900 flex items-center">
                    <Calendar className="w-4 h-4 mr-2" />
                    Неделя {week.weekNumber}
                  </h4>
                  <button
                    type="button"
                    onClick={() => removeWeek(weekIndex)}
                    className="text-red-500 hover:text-red-700 p-1 rounded"
                    title="Удалить неделю"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Дата начала недели *
                    </label>
                    <input
                      type="date"
                      value={week.startDate}
                      onChange={(e) => updateWeek(weekIndex, 'startDate', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Дата окончания недели *
                    </label>
                    <input
                      type="date"
                      value={week.endDate}
                      onChange={(e) => updateWeek(weekIndex, 'endDate', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                {/* Дни недели */}
                <div className="bg-white rounded-lg p-4">
                  <div className="flex justify-between items-center mb-3">
                    <h5 className="font-medium text-gray-700 flex items-center">
                      <Clock className="w-4 h-4 mr-2" />
                      Дни и время занятий
                    </h5>
                    <button
                      type="button"
                      onClick={() => addDayToWeek(weekIndex)}
                      className="flex items-center px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600 transition-colors"
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      Добавить день
                    </button>
                  </div>

                  {week.weekDays.length === 0 ? (
                    <div className="text-center py-4 text-gray-500 text-sm">
                      Добавьте дни занятий для этой недели
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {week.weekDays.map((day: any, dayIndex: number) => (
                        <div key={dayIndex} className="grid grid-cols-1 md:grid-cols-6 gap-3 p-3 bg-gray-50 rounded-lg">
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">День</label>
                            <select
                              value={day.dayOfWeek}
                              onChange={(e) => updateDay(weekIndex, dayIndex, 'dayOfWeek', parseInt(e.target.value))}
                              className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-blue-500"
                            >
                              {DAYS_OF_WEEK.map(dayOption => (
                                <option key={dayOption.value} value={dayOption.value}>
                                  {dayOption.label}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Начало</label>
                            <input
                              type="time"
                              value={day.startTime}
                              onChange={(e) => updateDay(weekIndex, dayIndex, 'startTime', e.target.value)}
                              className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-blue-500"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Окончание</label>
                            <input
                              type="time"
                              value={day.endTime}
                              onChange={(e) => updateDay(weekIndex, dayIndex, 'endTime', e.target.value)}
                              className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-blue-500"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Стоимость</label>
                            <input
                              type="number"
                              value={day.cost}
                              onChange={(e) => updateDay(weekIndex, dayIndex, 'cost', e.target.value)}
                              className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-blue-500"
                              min="0"
                              step="100"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Место</label>
                            <select
                              value={day.location}
                              onChange={(e) => updateDay(weekIndex, dayIndex, 'location', e.target.value)}
                              className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-blue-500"
                            >
                              {LOCATIONS.map(location => (
                                <option key={location.value} value={location.value}>
                                  {location.label}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div className="flex items-end">
                            <button
                              type="button"
                              onClick={() => removeDayFromWeek(weekIndex, dayIndex)}
                              className="w-full px-2 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600 transition-colors"
                              title="Удалить день"
                            >
                              <Minus className="w-3 h-3 mx-auto" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
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
            Включает все занятия из расписания недель
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
  selectedStudent 
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
  const [flexibleData, setFlexibleData] = useState<FlexibleSubscriptionData>({
    name: '',
    studentId: selectedStudent?.id || 0,
    userId: 0,
    startDate: '',
    endDate: '',
    description: '',
    weekSchedules: []
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
    return flexibleData.weekSchedules.reduce((total, week) => {
      return total + week.weekDays.reduce((weekTotal, day) => {
        return weekTotal + (parseFloat(day.cost) || 0);
      }, 0);
    }, 0);
  }, [subscriptionType, flexibleData.weekSchedules]);

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
    } else if (subscriptionType === 'flexible') {
      if (!flexibleData.name) {
        errors.name = 'Введите название абонемента';
      }
      if (!flexibleData.studentId) {
        errors.studentId = 'Выберите ученика';
      }
      if (!flexibleData.userId) {
        errors.userId = 'Выберите преподавателя';
      }
      if (!flexibleData.startDate) {
        errors.startDate = 'Выберите дату начала';
      }
      if (!flexibleData.endDate) {
        errors.endDate = 'Выберите дату окончания';
      }
      if (!flexibleData.weekSchedules || flexibleData.weekSchedules.length === 0) {
        errors.weekSchedules = 'Добавьте расписание недель';
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
          isPaid: false // Создаем как неоплаченные, предоплата их пометит как оплаченные
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

        // Создание предоплаты
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
      } else if (subscriptionType === 'flexible') {
        // Создание гибкого абонемента
        const requestData = {
          ...flexibleData,
          totalCost: flexibleTotalAmount
        };

        const response = await apiRequest('/api/flexible-subscriptions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestData),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Ошибка при создании гибкого абонемента');
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
      title="Создание абонемента"
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
              ? 'Создание...' 
              : subscriptionType === 'regular' 
                ? `Создать абонемент (${lessonsCount} занятий)` 
                : `Создать гибкий абонемент (${flexibleTotalAmount.toLocaleString()} ₸)`
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
