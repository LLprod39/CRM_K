'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight, Clock, User, Calendar as CalendarIcon, History } from 'lucide-react';
import { Lesson, LessonWithOptionalStudent, getLessonStatus, getLessonStatusText } from '@/types';
import DayLessonsModal from './DayLessonsModal';

interface MobileCalendarProps {
  lessons: LessonWithOptionalStudent[];
  onDateClick: (date: Date) => void;
  onLessonClick?: (lesson: LessonWithOptionalStudent) => void;
  onAddLesson?: (date: Date) => void;
  currentDate?: Date;
  userRole?: 'ADMIN' | 'USER';
}

export default function MobileCalendar({ 
  lessons, 
  onDateClick, 
  onLessonClick, 
  onAddLesson,
  currentDate = new Date(),
  userRole
}: MobileCalendarProps) {
  const [selectedDate, setSelectedDate] = useState(currentDate);
  const [currentMonth, setCurrentMonth] = useState(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1));
  const [showDayModal, setShowDayModal] = useState(false);
  const [selectedDayLessons, setSelectedDayLessons] = useState<LessonWithOptionalStudent[]>([]);
  const [selectedDayDate, setSelectedDayDate] = useState<Date>(new Date());
  const [activeDay, setActiveDay] = useState<number | null>(null);

  // Получаем занятия для выбранного месяца
  const monthLessons = lessons.filter(lesson => {
    const lessonDate = new Date(lesson.date);
    return lessonDate.getMonth() === currentMonth.getMonth() && 
           lessonDate.getFullYear() === currentMonth.getFullYear();
  });

  // Группируем занятия по дням
  const lessonsByDay = monthLessons.reduce((acc, lesson) => {
    const day = new Date(lesson.date).getDate();
    if (!acc[day]) {
      acc[day] = [];
    }
    acc[day].push(lesson);
    return acc;
  }, {} as Record<number, Lesson[]>);

  const monthNames = [
    'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
    'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
  ];

  const dayNames = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    const firstDay = new Date(date.getFullYear(), date.getMonth(), 1).getDay();
    return firstDay === 0 ? 6 : firstDay - 1; // Понедельник = 0
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth(prev => {
      const newMonth = new Date(prev);
      if (direction === 'prev') {
        newMonth.setMonth(prev.getMonth() - 1);
      } else {
        newMonth.setMonth(prev.getMonth() + 1);
      }
      return newMonth;
    });
  };

  const isToday = (day: number) => {
    const today = new Date();
    return day === today.getDate() && 
           currentMonth.getMonth() === today.getMonth() && 
           currentMonth.getFullYear() === today.getFullYear();
  };

  const isSelected = (day: number) => {
    return day === selectedDate.getDate() && 
           currentMonth.getMonth() === selectedDate.getMonth() && 
           currentMonth.getFullYear() === selectedDate.getFullYear();
  };

  const handleDateClick = (day: number) => {
    console.log('MobileCalendar: handleDateClick вызван для дня:', day);
    console.log('MobileCalendar: currentMonth:', currentMonth);
    console.log('MobileCalendar: lessonsByDay:', lessonsByDay);
    
    const newDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    setSelectedDate(newDate);
    
    const dayLessons = lessonsByDay[day] || [];
    console.log('MobileCalendar: занятия на день:', dayLessons.length);
    console.log('MobileCalendar: userRole:', userRole);
    console.log('MobileCalendar: onAddLesson:', !!onAddLesson);
    
    // Если день пустой и есть функция onAddLesson, и пользователь - админ, открываем форму добавления занятия
    if (dayLessons.length === 0 && onAddLesson && userRole === 'ADMIN') {
      console.log('MobileCalendar: открываем форму добавления занятия');
      onAddLesson(newDate);
      return;
    }
    
    // Если есть занятия, показываем модальное окно
    console.log('MobileCalendar: открываем модальное окно с занятиями');
    setSelectedDayLessons(dayLessons);
    setSelectedDayDate(newDate);
    setShowDayModal(true);
    console.log('MobileCalendar: showDayModal установлен в true');
  };

  // Упрощенная обработка событий для мобильных устройств
  const handleDayPress = (day: number) => {
    console.log('MobileCalendar: handleDayPress для дня:', day);
    handleDateClick(day);
  };

  const getStatusColor = (lesson: Lesson) => {
    const status = getLessonStatus(lesson);
    const isBackdate = new Date(lesson.date) < new Date();
    
    // Для занятий задним числом добавляем специальную индикацию
    if (isBackdate) {
      switch (status) {
        case 'scheduled': return 'bg-orange-100 text-orange-800 border-l-4 border-orange-400';
        case 'completed': return 'bg-green-100 text-green-800 border-l-4 border-green-400';
        case 'cancelled': return 'bg-red-100 text-red-800 border-l-4 border-red-400';
        case 'paid': return 'bg-purple-100 text-purple-800 border-l-4 border-purple-400';
        case 'prepaid': return 'bg-yellow-100 text-yellow-800 border-l-4 border-yellow-400';
        case 'unpaid': return 'bg-orange-100 text-orange-800 border-l-4 border-orange-400';
        default: return 'bg-gray-100 text-gray-800 border-l-4 border-gray-400';
      }
    }
    
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'paid': return 'bg-purple-100 text-purple-800';
      case 'prepaid': return 'bg-yellow-100 text-yellow-800';
      case 'unpaid': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const renderCalendarDays = () => {
    const daysInMonth = getDaysInMonth(currentMonth);
    const firstDay = getFirstDayOfMonth(currentMonth);
    const days = [];

    // Пустые ячейки для начала месяца
    for (let i = 0; i < firstDay; i++) {
      days.push(
        <div key={`empty-${i}`} className="h-16 border border-gray-200"></div>
      );
    }

    // Дни месяца
    for (let day = 1; day <= daysInMonth; day++) {
      const dayLessons = lessonsByDay[day] || [];
      const isCurrentDay = isToday(day);
      const isSelectedDay = isSelected(day);
      const isActiveDay = activeDay === day;

      days.push(
        <div
          key={day}
          className={`mobile-calendar-day h-20 border border-gray-200 p-2 cursor-pointer hover:bg-gray-50 active:bg-gray-100 transition-colors duration-150 touch-manipulation ${
            isCurrentDay ? 'bg-blue-50' : ''
          } ${isSelectedDay ? 'bg-blue-100' : ''} ${
            isActiveDay ? 'touch-active' : ''
          }`}
          onClick={() => {
            console.log('MobileCalendar: onClick для дня:', day);
            handleDayPress(day);
          }}
          onTouchEnd={() => {
            console.log('MobileCalendar: onTouchEnd для дня:', day);
            handleDayPress(day);
          }}
          style={{ 
            minHeight: '80px',
            WebkitTapHighlightColor: 'transparent',
            WebkitTouchCallout: 'none',
            WebkitUserSelect: 'none',
            userSelect: 'none'
          }}
        >
          <div className="flex justify-between items-center mb-1">
            <span className={`text-base font-semibold ${isCurrentDay ? 'text-blue-600' : 'text-gray-900'}`}>
              {day}
            </span>
            {dayLessons.length > 0 && (
              <span className={`text-sm text-white rounded-full w-6 h-6 flex items-center justify-center font-bold ${
                dayLessons.length === 1 ? 'bg-green-500' : 
                dayLessons.length === 2 ? 'bg-yellow-500' : 
                dayLessons.length >= 3 ? 'bg-red-500' : 'bg-blue-500'
              }`}>
                {dayLessons.length}
              </span>
            )}
          </div>
          {/* На мобильной версии показываем только количество занятий */}
          {dayLessons.length > 0 && (
            <div className="text-sm text-gray-500 text-center font-medium">
              {dayLessons.length} занят{dayLessons.length === 1 ? 'ие' : dayLessons.length < 5 ? 'ия' : 'ий'}
            </div>
          )}
        </div>
      );
    }

    return days;
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border">
      {/* Заголовок календаря */}
      <div className="mobile-calendar-header flex items-center justify-between p-4 border-b border-gray-200">
        <h3 className="text-xl font-semibold text-gray-900">
          {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
        </h3>
        <div className="flex gap-2">
          <button
            onClick={() => navigateMonth('prev')}
            className="mobile-calendar-nav-button p-3 hover:bg-gray-100 active:bg-gray-200 rounded-lg touch-manipulation transition-colors duration-150"
            style={{ 
              WebkitTapHighlightColor: 'transparent',
              minWidth: '44px',
              minHeight: '44px'
            }}
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button
            onClick={() => navigateMonth('next')}
            className="mobile-calendar-nav-button p-3 hover:bg-gray-100 active:bg-gray-200 rounded-lg touch-manipulation transition-colors duration-150"
            style={{ 
              WebkitTapHighlightColor: 'transparent',
              minWidth: '44px',
              minHeight: '44px'
            }}
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Дни недели */}
      <div className="grid grid-cols-7 border-b border-gray-200">
        {dayNames.map((day) => (
          <div key={day} className="p-3 text-center text-base font-semibold text-gray-600 bg-gray-50">
            {day}
          </div>
        ))}
      </div>

      {/* Календарная сетка */}
      <div className="grid grid-cols-7">
        {renderCalendarDays()}
      </div>

      {/* Легенда статусов */}
      <div className="p-4 border-t border-gray-200">
        <div className="space-y-2">
          <div className="flex flex-wrap gap-3 text-xs">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-blue-100 rounded"></div>
              <span>Запланировано</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-green-100 rounded"></div>
              <span>Проведено</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-yellow-100 rounded"></div>
              <span>Предоплачено</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-purple-100 rounded"></div>
              <span>Оплачено</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-orange-100 rounded"></div>
              <span>Не оплачено</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-red-100 rounded"></div>
              <span>Отменено</span>
            </div>
          </div>
          <div className="flex items-center gap-1 text-xs text-gray-600">
            <History className="w-3 h-3" />
            <span>Задним числом (с полосой)</span>
          </div>
        </div>
      </div>

      {/* Модальное окно для мобильной версии */}
      {onLessonClick && (
        <DayLessonsModal
          isOpen={showDayModal}
          onClose={() => {
            console.log('MobileCalendar: закрываем модальное окно');
            setShowDayModal(false);
          }}
          lessons={selectedDayLessons}
          date={selectedDayDate}
          onLessonClick={onLessonClick}
          userRole={userRole}
        />
      )}
      
      {/* Отладочная информация */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-4 left-4 bg-black text-white p-2 text-xs rounded">
          showDayModal: {showDayModal.toString()}<br/>
          selectedDayLessons: {selectedDayLessons.length}<br/>
          activeDay: {activeDay}
        </div>
      )}
    </div>
  );
}
