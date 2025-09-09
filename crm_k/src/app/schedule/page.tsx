'use client';

import { useState, useEffect } from 'react';
import { Calendar, Plus, Clock, Users, Bell, Printer } from 'lucide-react';
import { LessonWithOptionalStudent } from '@/types';
import CalendarComponent from '@/components/ui/Calendar';
import LessonsList from '@/components/tables/LessonsList';
import LessonFilters from '@/components/ui/LessonFilters';
import AddLessonForm from '@/components/forms/AddLessonForm';
import EditLessonForm from '@/components/forms/EditLessonForm';
import { printSchedule } from '@/lib/print';

export default function SchedulePage() {
  const [lessons, setLessons] = useState<LessonWithOptionalStudent[]>([]);
  // const [students] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedLesson, setSelectedLesson] = useState<LessonWithOptionalStudent | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [filters, setFilters] = useState({
    dateFrom: '',
    dateTo: '',
    studentId: '',
    status: '',
    period: 'today' as 'today' | 'week' | 'month' | 'all'
  });

  // Загружаем данные
  useEffect(() => {
    fetchData();
  }, [filters]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchData = async () => {
    setLoading(true);
    try {
      // Загружаем занятия с фильтрами
      const lessonParams = new URLSearchParams();
      if (filters.dateFrom) lessonParams.append('dateFrom', filters.dateFrom);
      if (filters.dateTo) lessonParams.append('dateTo', filters.dateTo);
      if (filters.studentId) lessonParams.append('studentId', filters.studentId);
      if (filters.status) lessonParams.append('status', filters.status);

      const [lessonsResponse] = await Promise.all([
        fetch(`/api/lessons?${lessonParams.toString()}`)
        // fetch('/api/students')
      ]);

      if (lessonsResponse.ok) {
        const lessonsData = await lessonsResponse.json();
        setLessons(lessonsData);
      }

      // if (studentsResponse.ok) {
      //   const studentsData = await studentsResponse.json();
      //   setStudents(studentsData);
      // }
    } catch (error) {
      console.error('Ошибка при загрузке данных:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFiltersChange = (newFilters: typeof filters) => {
    setFilters(newFilters);
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    setViewMode('list');
  };

  const handleLessonClick = (lesson: LessonWithOptionalStudent) => {
    setSelectedLesson(lesson);
    setShowEditForm(true);
  };

  const handleEditLesson = (lesson: LessonWithOptionalStudent) => {
    setSelectedLesson(lesson);
    setShowEditForm(true);
  };

  const handleAddSuccess = () => {
    fetchData();
  };

  const handleEditSuccess = () => {
    fetchData();
  };

  const handleDeleteSuccess = () => {
    fetchData();
  };

  // Статистика
  const today = new Date();
  const todayLessons = lessons.filter(lesson => {
    const lessonDate = new Date(lesson.date);
    return lessonDate.toDateString() === today.toDateString();
  });

  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - today.getDay() + 1);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  
  const weekLessons = lessons.filter(lesson => {
    const lessonDate = new Date(lesson.date);
    return lessonDate >= weekStart && lessonDate <= weekEnd;
  });

  const activeStudents = new Set(lessons.map(lesson => lesson.studentId)).size;

  // Предстоящие занятия (следующие 3 дня)
  const upcomingLessons = lessons.filter(lesson => {
    const lessonDate = new Date(lesson.date);
    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
    return lessonDate > today && lessonDate <= threeDaysFromNow && lesson.status === 'SCHEDULED';
  }).slice(0, 3);

  return (
    <div className="space-y-6">
      {/* Заголовок и действия */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Расписание</h1>
          <p className="mt-2 text-gray-600">
            Управление расписанием занятий
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex flex-col sm:flex-row gap-3">
          <button 
            onClick={() => printSchedule(lessons, selectedDate)}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-xl shadow-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-all duration-200 hover:scale-105"
          >
            <Printer className="w-4 h-4 mr-2" />
            Печать
          </button>
          <button 
            onClick={() => setViewMode(viewMode === 'calendar' ? 'list' : 'calendar')}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-xl shadow-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-all duration-200 hover:scale-105"
          >
            <Calendar className="w-4 h-4 mr-2" />
            {viewMode === 'calendar' ? 'Список' : 'Календарь'}
          </button>
          <button 
            onClick={() => setShowAddForm(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-xl shadow-lg text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 transition-all duration-200 hover:scale-105"
          >
            <Plus className="w-4 h-4 mr-2" />
            Добавить занятие
          </button>
        </div>
      </div>

      {/* Уведомления о предстоящих занятиях */}
      {upcomingLessons.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Bell className="w-5 h-5 text-blue-600" />
            <h3 className="text-sm font-medium text-blue-900">Предстоящие занятия</h3>
          </div>
          <div className="space-y-1">
            {upcomingLessons.map((lesson) => (
              <div key={lesson.id} className="text-sm text-blue-800">
                <span className="font-medium">
                  {new Date(lesson.date).toLocaleDateString('ru-RU', { 
                    day: '2-digit', 
                    month: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
                {' - '}
                <span>{lesson.student?.fullName || 'Неизвестно'}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Фильтры */}
      <LessonFilters 
        onFiltersChange={handleFiltersChange}
        selectedDate={selectedDate}
      />

      {/* Основной контент */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="text-gray-500">Загрузка...</div>
        </div>
      ) : viewMode === 'calendar' ? (
        <CalendarComponent
          lessons={lessons}
          onLessonClick={handleLessonClick}
          onDateClick={handleDateClick}
          currentDate={selectedDate}
        />
      ) : (
        <LessonsList
          lessons={lessons}
          onLessonClick={handleLessonClick}
          onEditLesson={handleEditLesson}
          selectedDate={selectedDate}
        />
      )}

      {/* Статистика */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Clock className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Занятий сегодня</p>
              <p className="text-2xl font-bold text-gray-900">{todayLessons.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <Users className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Активных учеников</p>
              <p className="text-2xl font-bold text-gray-900">{activeStudents}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Calendar className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Занятий в неделю</p>
              <p className="text-2xl font-bold text-gray-900">{weekLessons.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Формы */}
      <AddLessonForm
        isOpen={showAddForm}
        onClose={() => setShowAddForm(false)}
        onSuccess={handleAddSuccess}
        selectedDate={selectedDate}
      />

      <EditLessonForm
        isOpen={showEditForm}
        onClose={() => {
          setShowEditForm(false);
          setSelectedLesson(null);
        }}
        onSuccess={handleEditSuccess}
        onDelete={handleDeleteSuccess}
        lesson={selectedLesson}
      />
    </div>
  );
}
