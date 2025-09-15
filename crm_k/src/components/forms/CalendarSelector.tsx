'use client';

import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar, Clock } from 'lucide-react';

interface CalendarSelectorProps {
  startDate: string;
  endDate: string;
  selectedDays: string[]; // Массив дат в формате 'YYYY-MM-DD'
  onDaysChange: (days: string[]) => void;
  onPeriodChange?: (startDate: string, endDate: string) => void; // Новый колбэк для изменения периода
  className?: string;
}

interface DayInfo {
  date: string;
  dayOfWeek: number;
  isInRange: boolean;
  isSelected: boolean;
  isToday: boolean;
}

export default function CalendarSelector({
  startDate,
  endDate,
  selectedDays,
  onDaysChange,
  onPeriodChange,
  className = ''
}: CalendarSelectorProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [days, setDays] = useState<DayInfo[]>([]);

  const monthNames = [
    'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
    'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
  ];

  const dayNames = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
  const fullDayNames = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота', 'Воскресенье'];

  // Генерируем календарь для текущего месяца
  useEffect(() => {
    const today = new Date();
    
    // Находим первый день месяца
    const firstDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    const lastDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
    
    // Находим первый понедельник для отображения
    const startOfWeek = new Date(firstDay);
    const dayOfWeek = firstDay.getDay();
    const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    startOfWeek.setDate(firstDay.getDate() - daysToSubtract);
    
    const calendarDays: DayInfo[] = [];
    const currentDay = new Date(startOfWeek);
    
    // Генерируем 42 дня (6 недель)
    for (let i = 0; i < 42; i++) {
      const dateStr = currentDay.toISOString().split('T')[0];
      const isInRange = true; // Теперь все дни доступны для выбора
      const isSelected = selectedDays.includes(dateStr);
      const isToday = dateStr === today.toISOString().split('T')[0];
      
      calendarDays.push({
        date: dateStr,
        dayOfWeek: currentDay.getDay(),
        isInRange,
        isSelected,
        isToday
      });
      
      currentDay.setDate(currentDay.getDate() + 1);
    }
    
    setDays(calendarDays);
  }, [currentMonth, selectedDays]);

  const toggleDay = (date: string) => {
    const newSelectedDays = selectedDays.includes(date)
      ? selectedDays.filter(d => d !== date)
      : [...selectedDays, date].sort();
    
    onDaysChange(newSelectedDays);
  };

  const selectAllDays = () => {
    // Выбираем все дни текущего месяца
    const firstDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    const lastDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
    const allDays: string[] = [];
    
    const current = new Date(firstDay);
    while (current <= lastDay) {
      allDays.push(current.toISOString().split('T')[0]);
      current.setDate(current.getDate() + 1);
    }
    
    onDaysChange(allDays);
  };

  const clearAllDays = () => {
    onDaysChange([]);
  };

  const goToPreviousMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const goToCurrentMonth = () => {
    setCurrentMonth(new Date());
  };

  // Если период не выбран, показываем календарь с возможностью выбора любого дня
  if (!startDate || !endDate) {
    // Устанавливаем период по умолчанию на текущий месяц
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    
    const defaultStartDate = firstDay.toISOString().split('T')[0];
    const defaultEndDate = lastDay.toISOString().split('T')[0];
    
    // Автоматически устанавливаем период по умолчанию
    useEffect(() => {
      if (onPeriodChange) {
        onPeriodChange(defaultStartDate, defaultEndDate);
      }
    }, []);
    
    return (
      <div className={`bg-white rounded-lg border border-gray-200 ${className}`}>
        {/* Заголовок */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <Calendar className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">
              Выбор дней занятий
            </h3>
          </div>
        </div>

        {/* Информация о периоде */}
        <div className="p-4 bg-blue-50 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <p className="text-sm text-blue-800">
              Период: <span className="font-medium">{defaultStartDate}</span> - <span className="font-medium">{defaultEndDate}</span>
            </p>
            <button
              onClick={() => {
                const newStartDate = prompt('Введите дату начала (YYYY-MM-DD):', defaultStartDate);
                const newEndDate = prompt('Введите дату окончания (YYYY-MM-DD):', defaultEndDate);
                if (newStartDate && newEndDate && onPeriodChange) {
                  onPeriodChange(newStartDate, newEndDate);
                }
              }}
              className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors font-medium"
            >
              Изменить период
            </button>
          </div>
        </div>

        {/* Календарная сетка */}
        <div className="p-4">
          <div className="text-center py-8 text-gray-500">
            <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>Загрузка календаря...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg border border-gray-200 ${className}`}>
      {/* Заголовок календаря */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <Calendar className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">
            {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
          </h3>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={goToPreviousMonth}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="Предыдущий месяц"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={goToCurrentMonth}
            className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors"
          >
            Сегодня
          </button>
          <button
            onClick={goToNextMonth}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="Следующий месяц"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Кнопки управления */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600">
            Выберите дни занятий в календаре
          </p>
          <div className="flex space-x-2">
            <button
              onClick={selectAllDays}
              className="px-3 py-1 text-xs bg-green-100 text-green-700 rounded-md hover:bg-green-200 transition-colors font-medium"
            >
              Выбрать месяц
            </button>
            <button
              onClick={clearAllDays}
              className="px-3 py-1 text-xs bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors font-medium"
            >
              Очистить все
            </button>
          </div>
        </div>
      </div>

      {/* Дни недели */}
      <div className="grid grid-cols-7 gap-1 p-4">
        {dayNames.map(day => (
          <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">
            {day}
          </div>
        ))}
      </div>

      {/* Календарная сетка */}
      <div className="grid grid-cols-7 gap-1 p-4 pt-0">
        {days.map((day, index) => (
          <button
            key={index}
            onClick={() => toggleDay(day.date)}
            className={`
              relative p-2 text-sm rounded-lg transition-all duration-200 hover:bg-blue-50 cursor-pointer
              ${day.isSelected 
                ? 'bg-blue-500 text-white hover:bg-blue-600' 
                : day.isToday 
                  ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200' 
                  : 'text-gray-700 hover:bg-gray-50'
              }
            `}
            title={`${day.date} - ${fullDayNames[day.dayOfWeek]}`}
          >
            <span>{new Date(day.date).getDate()}</span>
            {day.isSelected && (
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
            )}
          </button>
        ))}
      </div>

      {/* Статистика */}
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-blue-500 rounded"></div>
              <span className="text-gray-600">Выбрано дней: {selectedDays.length}</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-yellow-100 rounded"></div>
              <span className="text-gray-600">Сегодня</span>
            </div>
          </div>
          {selectedDays.length > 0 && (
            <div className="text-blue-600 font-medium">
              {selectedDays.length} занятий
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
