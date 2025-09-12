'use client';

import { useState, useEffect } from 'react';
import { Calendar, Filter, User } from 'lucide-react';
import { Student } from '@/types';

interface LessonFiltersProps {
  onFiltersChange: (filters: {
    dateFrom: string;
    dateTo: string;
    studentId: string;
    status: string;
    period: 'today' | 'week' | 'month' | 'all';
  }) => void;
  selectedDate?: Date;
}

export default function LessonFilters({ onFiltersChange, selectedDate }: LessonFiltersProps) {
  const [filters, setFilters] = useState({
    dateFrom: '',
    dateTo: '',
    studentId: '',
    status: '',
    period: 'today' as 'today' | 'week' | 'month' | 'all'
  });
  const [students, setStudents] = useState<Student[]>([]);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Загружаем список учеников
  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('/api/students', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
        if (response.ok) {
          const data = await response.json();
          setStudents(data);
        }
      } catch (error) {
        console.error('Ошибка при загрузке учеников:', error);
      }
    };

    fetchStudents();
  }, []);

  // Устанавливаем дату при изменении selectedDate
  useEffect(() => {
    if (selectedDate) {
      const dateStr = selectedDate.toISOString().split('T')[0];
      setFilters(prev => ({
        ...prev,
        dateFrom: dateStr,
        dateTo: dateStr,
        period: 'all'
      }));
    }
  }, [selectedDate]);

  // Уведомляем родительский компонент об изменении фильтров
  useEffect(() => {
    onFiltersChange(filters);
  }, [filters, onFiltersChange]);

  const handlePeriodChange = (period: 'today' | 'week' | 'month' | 'all') => {
    const today = new Date();
    let dateFrom = '';
    let dateTo = '';

    switch (period) {
      case 'today':
        dateFrom = today.toISOString().split('T')[0];
        dateTo = today.toISOString().split('T')[0];
        break;
      case 'week':
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - today.getDay() + 1); // Понедельник
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6); // Воскресенье
        dateFrom = weekStart.toISOString().split('T')[0];
        dateTo = weekEnd.toISOString().split('T')[0];
        break;
      case 'month':
        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
        const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        dateFrom = monthStart.toISOString().split('T')[0];
        dateTo = monthEnd.toISOString().split('T')[0];
        break;
      case 'all':
        dateFrom = '';
        dateTo = '';
        break;
    }

    setFilters(prev => ({
      ...prev,
      period,
      dateFrom,
      dateTo
    }));
  };

  const handleFilterChange = (name: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [name]: value,
      period: name === 'dateFrom' || name === 'dateTo' ? 'all' : prev.period
    }));
  };

  const clearFilters = () => {
    setFilters({
      dateFrom: '',
      dateTo: '',
      studentId: '',
      status: '',
      period: 'today'
    });
  };

  // const getStatusText = (status: string) => {
  //   switch (status) {
  //     case 'SCHEDULED': return 'Запланировано';
  //     case 'COMPLETED': return 'Проведено';
  //     case 'CANCELLED': return 'Отменено';
  //     case 'PAID': return 'Оплачено';
  //     default: return 'Все статусы';
  //   }
  // };

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border">
      <div className="flex flex-col gap-4">
        {/* Основные фильтры */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          {/* Период */}
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => handlePeriodChange('today')}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                filters.period === 'today'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 hover:border-gray-400'
              }`}
            >
              Сегодня
            </button>
            <button
              onClick={() => handlePeriodChange('week')}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                filters.period === 'week'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 hover:border-gray-400'
              }`}
            >
              Неделя
            </button>
            <button
              onClick={() => handlePeriodChange('month')}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                filters.period === 'month'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 hover:border-gray-400'
              }`}
            >
              Месяц
            </button>
            <button
              onClick={() => handlePeriodChange('all')}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                filters.period === 'all'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 hover:border-gray-400'
              }`}
            >
              Все
            </button>
          </div>

          {/* Кнопка расширенных фильтров */}
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-400 transition-colors"
          >
            <Filter className="w-4 h-4 mr-2" />
            Фильтр
          </button>
        </div>

        {/* Расширенные фильтры */}
        {showAdvanced && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-gray-200">
            {/* Дата от */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Calendar className="w-4 h-4 inline mr-1" />
                Дата от
              </label>
              <input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Дата до */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Calendar className="w-4 h-4 inline mr-1" />
                Дата до
              </label>
              <input
                type="date"
                value={filters.dateTo}
                onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Ученик */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <User className="w-4 h-4 inline mr-1" />
                Ученик
              </label>
              <select
                value={filters.studentId}
                onChange={(e) => handleFilterChange('studentId', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Все ученики</option>
                {students.map((student) => (
                  <option key={student.id} value={student.id}>
                    {student.fullName}
                  </option>
                ))}
              </select>
            </div>

            {/* Статус */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Статус
              </label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Все статусы</option>
                <option value="SCHEDULED">Запланировано</option>
                <option value="COMPLETED">Проведено</option>
                <option value="CANCELLED">Отменено</option>
                <option value="PAID">Оплачено</option>
              </select>
            </div>
          </div>
        )}

        {/* Кнопка очистки фильтров */}
        {(filters.studentId || filters.status || filters.period !== 'today') && (
          <div className="flex justify-end pt-2">
            <button
              onClick={clearFilters}
              className="text-sm text-gray-500 hover:text-gray-700 underline hover:no-underline transition-all"
            >
              Очистить фильтры
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
