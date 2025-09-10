'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight, Clock, User, History } from 'lucide-react';
import { Lesson, LessonWithOptionalStudent, getLessonStatus, getLessonStatusText } from '@/types';
import MobileCalendar from './MobileCalendar';
import DayLessonsModal from './DayLessonsModal';

interface CalendarProps {
  lessons: LessonWithOptionalStudent[];
  onLessonClick: (lesson: LessonWithOptionalStudent) => void;
  onDateClick: (date: Date) => void;
  currentDate?: Date;
}

export default function Calendar({ lessons, onLessonClick, onDateClick, currentDate = new Date() }: CalendarProps) {
  const [selectedDate, setSelectedDate] = useState(currentDate);
  const [currentMonth, setCurrentMonth] = useState(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1));
  const [showDayModal, setShowDayModal] = useState(false);
  const [selectedDayLessons, setSelectedDayLessons] = useState<LessonWithOptionalStudent[]>([]);
  const [selectedDayDate, setSelectedDayDate] = useState<Date>(new Date());

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
    const newDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    setSelectedDate(newDate);
    
    // Показываем модальное окно для всех дней (с занятиями и без)
    const dayLessons = lessonsByDay[day] || [];
    setSelectedDayLessons(dayLessons);
    setSelectedDayDate(newDate);
    setShowDayModal(true);
    
    console.log('Calendar: Модальное окно должно показаться', { showDayModal: true, dayLessons: dayLessons.length });
    
    // Временно убираем вызов onDateClick, чтобы избежать переключения режима
    // onDateClick(newDate);
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

  // const getStatusText = (status: string) => {
  //   switch (status) {
  //     case 'SCHEDULED': return 'Запланировано';
  //     case 'COMPLETED': return 'Проведено';
  //     case 'CANCELLED': return 'Отменено';
  //     case 'PAID': return 'Оплачено';
  //     default: return status;
  //   }
  // };

  const renderCalendarDays = () => {
    const daysInMonth = getDaysInMonth(currentMonth);
    const firstDay = getFirstDayOfMonth(currentMonth);
    const days = [];

    // Пустые ячейки для начала месяца
    for (let i = 0; i < firstDay; i++) {
      days.push(
        <div key={`empty-${i}`} className="h-24 border border-gray-200"></div>
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
          className={`h-24 border border-gray-200 p-1 cursor-pointer hover:bg-gray-50 hover:shadow-sm transition-all duration-200 ${
            isCurrentDay ? 'bg-blue-50' : ''
          } ${isSelectedDay ? 'bg-blue-100' : ''} ${
            dayLessons.length > 0 ? 'hover:scale-[1.02]' : ''
          }`}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleDateClick(day);
          }}
        >
          <div className="flex justify-between items-start mb-1">
            <span className={`text-sm font-medium ${isCurrentDay ? 'text-blue-600' : 'text-gray-900'}`}>
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
          <div className="space-y-0.5">
            {dayLessons.slice(0, 1).map((lesson) => {
              const isBackdate = new Date(lesson.date) < new Date();
              return (
                <div
                  key={lesson.id}
                  className={`text-xs p-1 rounded cursor-pointer hover:opacity-80 ${getStatusColor(lesson)}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onLessonClick(lesson);
                  }}
                  title={`${lesson.student?.fullName || `Ученик #${lesson.studentId}`} - ${new Date(lesson.date).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })} - ${lesson.endTime ? new Date(lesson.endTime).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }) : ''}${isBackdate ? ' (задним числом)' : ''}`}
                >
                  <div className="flex items-center gap-1">
                    {isBackdate ? <History className="w-2.5 h-2.5" /> : <Clock className="w-2.5 h-2.5" />}
                    <span className="truncate font-medium">
                      {new Date(lesson.date).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <User className="w-2.5 h-2.5" />
                    <span className="truncate text-xs">{lesson.student?.fullName || `Ученик #${lesson.studentId}`}</span>
                  </div>
                </div>
              );
            })}
            {dayLessons.length > 1 && (
              <div className="text-xs text-gray-500 text-center font-medium">
                +{dayLessons.length - 1} еще
              </div>
            )}
          </div>
        </div>
      );
    }

    return days;
  };

  return (
    <>
      {/* Десктопная версия */}
      <div className="hidden md:block bg-white rounded-lg shadow-sm border">
        {/* Заголовок календаря */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
          </h3>
          <div className="flex gap-2">
            <button
              onClick={() => navigateMonth('prev')}
              className="p-2 hover:bg-gray-100 rounded-md"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => navigateMonth('next')}
              className="p-2 hover:bg-gray-100 rounded-md"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Дни недели */}
        <div className="grid grid-cols-7 border-b border-gray-200">
          {dayNames.map((day) => (
            <div key={day} className="p-3 text-center text-sm font-medium text-gray-500 bg-gray-50">
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
          <div className="space-y-3">
            <div className="text-sm font-medium text-gray-700">Статусы занятий:</div>
            <div className="flex flex-wrap gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-100 rounded"></div>
                <span>Запланировано</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-100 rounded"></div>
                <span>Проведено</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-yellow-100 rounded"></div>
                <span>Предоплачено</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-purple-100 rounded"></div>
                <span>Оплачено</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-orange-100 rounded"></div>
                <span>Не оплачено</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-100 rounded"></div>
                <span>Отменено</span>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <History className="w-4 h-4" />
              <span>Занятия задним числом (с цветной полосой слева)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Мобильная версия */}
      <div className="md:hidden">
        <MobileCalendar
          lessons={lessons}
          onLessonClick={onLessonClick}
          onDateClick={onDateClick}
          currentDate={currentDate}
        />
      </div>

      {/* Модальное окно для мобильной версии */}
      <DayLessonsModal
        isOpen={showDayModal}
        onClose={() => setShowDayModal(false)}
        lessons={selectedDayLessons}
        date={selectedDayDate}
        onLessonClick={onLessonClick}
      />
    </>
  );
}
