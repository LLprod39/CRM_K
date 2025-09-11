'use client';

import { useState, useEffect, useRef } from 'react';
import { Calendar, Clock, Plus, Minus } from 'lucide-react';

interface DateTimePickerProps {
  value: string; // ISO string format
  onChange: (value: string) => void;
  min?: string;
  max?: string;
  disabled?: boolean;
  className?: string;
  showDurationSelector?: boolean;
  defaultDuration?: number; // в минутах
  onValidationChange?: (isValid: boolean, errors: string[]) => void;
}

const POPULAR_TIMES = [
  { label: '9:00', value: '09:00' },
  { label: '10:00', value: '10:00' },
  { label: '11:00', value: '11:00' },
  { label: '14:00', value: '14:00' },
  { label: '15:00', value: '15:00' },
  { label: '16:00', value: '16:00' },
  { label: '17:00', value: '17:00' },
  { label: '18:00', value: '18:00' },
];

const DURATION_OPTIONS = [
  { label: '30 мин', value: 30 },
  { label: '45 мин', value: 45 },
  { label: '1 час', value: 60 },
  { label: '1.5 часа', value: 90 },
  { label: '2 часа', value: 120 },
];

export default function DateTimePicker({
  value,
  onChange,
  min,
  max,
  disabled = false,
  className = '',
  showDurationSelector = true,
  defaultDuration = 60,
  onValidationChange
}: DateTimePickerProps) {
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [duration, setDuration] = useState(defaultDuration);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const lastValueRef = useRef<string>('');

  // Функция валидации
  const validateDateTime = (dateValue: string, timeValue: string, durationValue: number) => {
    const errors: string[] = [];
    
    if (!dateValue || !timeValue) {
      return errors;
    }

    // Создаем дату в локальном часовом поясе
    const [year, month, day] = dateValue.split('-').map(Number);
    const [hours, minutes] = timeValue.split(':').map(Number);
    
    const startDateTime = new Date(year, month - 1, day, hours, minutes, 0, 0);
    const endDateTime = new Date(startDateTime.getTime() + durationValue * 60000);
    const now = new Date();

    // Проверка на прошедшее время
    if (startDateTime < now && min) {
      errors.push('Нельзя создавать занятия в прошедшем времени');
    }

    // Проверка на слишком раннее время (до 8:00)
    if (startDateTime.getHours() < 8) {
      errors.push('Занятия не проводятся раньше 8:00');
    }

    // Проверка на слишком позднее время (после 20:00)
    if (endDateTime.getHours() > 20 || (endDateTime.getHours() === 20 && endDateTime.getMinutes() > 0)) {
      errors.push('Занятия не проводятся позже 20:00');
    }

    // Проверка на выходные дни (суббота и воскресенье)
    const dayOfWeek = startDateTime.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      errors.push('Занятия не проводятся в выходные дни');
    }

    // Проверка минимальной длительности
    if (durationValue < 15) {
      errors.push('Минимальная длительность занятия - 15 минут');
    }

    // Проверка максимальной длительности
    if (durationValue > 180) {
      errors.push('Максимальная длительность занятия - 3 часа');
    }

    setValidationErrors(errors);
    onValidationChange?.(errors.length === 0, errors);
    
    return errors;
  };

  // Инициализация значений
  useEffect(() => {
    if (value) {
      const dateTime = new Date(value);
      const newDate = dateTime.toISOString().slice(0, 10);
      const newTime = dateTime.toTimeString().slice(0, 5);
      
      // Обновляем только если значения действительно изменились
      if (date !== newDate) {
        setDate(newDate);
      }
      if (time !== newTime) {
        setTime(newTime);
      }
    } else if (!date || !time) {
      // Устанавливаем значения по умолчанию только если они не установлены
      const now = new Date();
      setDate(now.toISOString().slice(0, 10));
      setTime(now.toTimeString().slice(0, 5));
    }
  }, [value, date, time]);

  // Обновление родительского компонента при изменении даты/времени
  useEffect(() => {
    if (date && time) {
      // Создаем дату в локальном часовом поясе, чтобы избежать смещения
      const [year, month, day] = date.split('-').map(Number);
      const [hours, minutes] = time.split(':').map(Number);
      
      const newDateTime = new Date(year, month - 1, day, hours, minutes, 0, 0);
      const newValue = newDateTime.toISOString();
      
      // Проверяем, что время действительно изменилось и не является циклическим обновлением
      if (lastValueRef.current !== newValue && value !== newValue) {
        lastValueRef.current = newValue;
        onChange(newValue);
      }
    }
  }, [date, time, value, onChange]);

  const handleDateChange = (newDate: string) => {
    setDate(newDate);
    validateDateTime(newDate, time, duration);
  };

  const handleTimeChange = (newTime: string) => {
    setTime(newTime);
    validateDateTime(date, newTime, duration);
  };

  const handlePopularTimeClick = (timeValue: string) => {
    setTime(timeValue);
    validateDateTime(date, timeValue, duration);
  };

  const handleDurationChange = (newDuration: number) => {
    setDuration(newDuration);
    validateDateTime(date, time, newDuration);
  };

  const adjustTime = (adjustmentMinutes: number) => {
    if (!date || !time) return;
    
    // Создаем дату в локальном часовом поясе
    const [year, month, day] = date.split('-').map(Number);
    const [hours, minutes] = time.split(':').map(Number);
    
    const currentDateTime = new Date(year, month - 1, day, hours, minutes, 0, 0);
    const newDateTime = new Date(currentDateTime.getTime() + adjustmentMinutes * 60000);
    
    setTime(newDateTime.toTimeString().slice(0, 5));
  };

  const getEndTime = () => {
    if (!date || !time) return '';
    
    // Создаем дату в локальном часовом поясе
    const [year, month, day] = date.split('-').map(Number);
    const [hours, minutes] = time.split(':').map(Number);
    
    const startDateTime = new Date(year, month - 1, day, hours, minutes, 0, 0);
    const endDateTime = new Date(startDateTime.getTime() + duration * 60000);
    return endDateTime.toTimeString().slice(0, 5);
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('ru-RU', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Дата */}
      <div className="space-y-2">
        <label className="flex items-center text-sm font-medium text-gray-700">
          <Calendar className="w-4 h-4 mr-2" />
          Дата проведения
        </label>
        <div className="flex items-center space-x-2">
          <input
            type="date"
            value={date}
            onChange={(e) => handleDateChange(e.target.value)}
            min={min?.slice(0, 10)}
            max={max?.slice(0, 10)}
            disabled={disabled}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
          />
          {date && (
            <div className="text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded-lg">
              {formatDate(date)}
            </div>
          )}
        </div>
      </div>

      {/* Время начала */}
      <div className="space-y-2">
        <label className="flex items-center text-sm font-medium text-gray-700">
          <Clock className="w-4 h-4 mr-2" />
          Время начала
        </label>
        
        <div className="flex items-center space-x-2">
          <input
            type="time"
            value={time}
            onChange={(e) => handleTimeChange(e.target.value)}
            disabled={disabled}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
          />
          
          {/* Кнопки быстрой настройки времени */}
          <div className="flex space-x-1">
            <button
              type="button"
              onClick={() => adjustTime(-15)}
              disabled={disabled}
              className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded disabled:opacity-50 disabled:cursor-not-allowed"
              title="Минус 15 минут"
            >
              <Minus className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => adjustTime(15)}
              disabled={disabled}
              className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded disabled:opacity-50 disabled:cursor-not-allowed"
              title="Плюс 15 минут"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Популярные времена */}
        <div className="flex flex-wrap gap-2">
          {POPULAR_TIMES.map((timeOption) => (
            <button
              key={timeOption.value}
              type="button"
              onClick={() => handlePopularTimeClick(timeOption.value)}
              disabled={disabled}
              className={`px-3 py-1 text-sm rounded-lg border transition-colors ${
                time === timeOption.value
                  ? 'bg-blue-100 border-blue-300 text-blue-700'
                  : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {timeOption.label}
            </button>
          ))}
        </div>
      </div>

      {/* Длительность занятия */}
      {showDurationSelector && (
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">
            Длительность занятия
          </label>
          
          <div className="flex flex-wrap gap-2">
            {DURATION_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => handleDurationChange(option.value)}
                disabled={disabled}
                className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
                  duration === option.value
                    ? 'bg-green-100 border-green-300 text-green-700'
                    : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Время окончания */}
      {date && time && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="text-sm text-blue-800">
            <span className="font-medium">Время окончания:</span> {getEndTime()}
          </div>
          <div className="text-xs text-blue-600 mt-1">
            Длительность: {duration} минут
          </div>
        </div>
      )}

      {/* Ошибки валидации */}
      {validationErrors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <div className="text-sm text-red-800">
            <span className="font-medium">Ошибки:</span>
          </div>
          <ul className="text-xs text-red-600 mt-1 list-disc list-inside">
            {validationErrors.map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}