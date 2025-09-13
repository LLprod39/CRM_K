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
        case 'prepaid': return 'bg-yellow-100 text-yellow-800 border-l-4 border-yellow-400';
        case 'cancelled': return 'bg-red-100 text-red-800 border-l-4 border-red-400';
        case 'completed': return 'bg-green-100 text-green-800 border-l-4 border-green-400';
        case 'debt': return 'bg-orange-100 text-orange-800 border-l-4 border-orange-400';
        case 'unpaid': return 'bg-gray-100 text-gray-800 border-l-4 border-gray-400';
        default: return 'bg-gray-100 text-gray-800 border-l-4 border-gray-400';
      }
    }
    
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'prepaid': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'debt': return 'bg-orange-100 text-orange-800';
      case 'unpaid': return 'bg-gray-100 text-gray-800';
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
        <div key={`empty-${i}`} className="bg-white"></div>
      );
    }

    // Дни месяца
    for (let day = 1; day <= daysInMonth; day++) {
      const dayLessons = lessonsByDay[day] || [];
      const isCurrentDay = isToday(day);
      const isSelectedDay = isSelected(day);

      days.push(
        <div
          key={day}
          className={`mobile-calendar-day p-3 cursor-pointer hover:bg-gray-50 touch-manipulation ${
            isCurrentDay ? 'bg-blue-50' : ''
          } ${isSelectedDay ? 'bg-blue-100' : ''}`}
          onClick={() => {
            handleDayPress(day);
          }}
          style={{ 
            WebkitTapHighlightColor: 'transparent',
            WebkitTouchCallout: 'none',
            WebkitUserSelect: 'none',
            userSelect: 'none'
          }}
        >
          {/* Верхняя часть с номером дня и индикатором */}
          <div className="flex justify-between items-start">
            <span className={`text-lg font-semibold ${isCurrentDay ? 'text-blue-600' : 'text-gray-900'}`}>
              {day}
            </span>
            {dayLessons.length > 0 && (
              <span className={`text-xs text-white rounded-full w-5 h-5 flex items-center justify-center font-bold ${
                dayLessons.length === 1 ? 'bg-green-500' : 
                dayLessons.length === 2 ? 'bg-yellow-500' : 
                dayLessons.length >= 3 ? 'bg-red-500' : 'bg-blue-500'
              }`}>
                {dayLessons.length}
              </span>
            )}
          </div>
          
          {/* Нижняя часть с информацией о занятиях */}
          <div className="flex-1 flex flex-col justify-end">
            {dayLessons.length > 0 ? (
              <div className="space-y-1">
                {/* Показываем первое занятие */}
                {dayLessons.slice(0, 1).map((lesson, index) => (
                  <div key={index} className="text-xs p-1 bg-blue-100 text-blue-800 rounded truncate">
                    {lesson.startTime || new Date(lesson.date).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                ))}
                {/* Если занятий больше одного, показываем "+N" */}
                {dayLessons.length > 1 && (
                  <div className="text-xs text-gray-500 text-center font-medium">
                    +{dayLessons.length - 1}
                  </div>
                )}
              </div>
            ) : (
              <div className="h-4"></div>
            )}
          </div>
        </div>
      );
    }

    return days;
  };

  return (
    <div className="mobile-calendar-container">
      {/* Компактный заголовок календаря */}
      <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">
          {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
        </h3>
        <div className="flex gap-1">
          <button
            onClick={() => navigateMonth('prev')}
            className="p-2 hover:bg-gray-100 active:bg-gray-200 rounded-lg touch-manipulation transition-colors duration-150"
            style={{ 
              WebkitTapHighlightColor: 'transparent',
              minWidth: '40px',
              minHeight: '40px'
            }}
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={() => navigateMonth('next')}
            className="p-2 hover:bg-gray-100 active:bg-gray-200 rounded-lg touch-manipulation transition-colors duration-150"
            style={{ 
              WebkitTapHighlightColor: 'transparent',
              minWidth: '40px',
              minHeight: '40px'
            }}
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Дни недели */}
      <div className="grid grid-cols-7 border-b border-gray-200 bg-gray-50">
        {dayNames.map((day) => (
          <div key={day} className="py-2 text-center text-sm font-semibold text-gray-600">
            {day}
          </div>
        ))}
      </div>

      {/* Календарная сетка - увеличенная */}
      <div className="mobile-calendar-grid">
        {renderCalendarDays()}
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
