'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, Plus, Clock, Bell, Printer } from 'lucide-react';
import { LessonWithOptionalStudent, getLessonStatus } from '@/types';
import CalendarComponent from '@/components/ui/Calendar';
import LessonsList from '@/components/tables/LessonsList';
import LessonFilters from '@/components/ui/LessonFilters';
import AddLessonForm from '@/components/forms/AddLessonForm';
import EditLessonForm from '@/components/forms/EditLessonForm';
import { printSchedule } from '@/lib/print';
import { autoUpdateLessonStatuses } from '@/lib/lessonUtils';
import { apiRequest } from '@/lib/api';
import { useAuth } from '@/presentation/contexts';

export default function SchedulePage() {
  const { user } = useAuth();
  const router = useRouter();
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
  }, [filters, viewMode]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchData = async () => {
    setLoading(true);
    try {
      // Сначала автоматически обновляем статусы прошедших занятий
      const token = localStorage.getItem('token');
      if (token) {
        try {
          await autoUpdateLessonStatuses(token);
        } catch (error) {
          console.error('Ошибка при автоматическом обновлении статусов:', error);
        }
      }

      // Загружаем занятия - в режиме календаря без фильтров, в режиме списка с фильтрами
      const lessonParams = new URLSearchParams();
      if (viewMode === 'list') {
        if (filters.dateFrom) lessonParams.append('dateFrom', filters.dateFrom);
        if (filters.dateTo) lessonParams.append('dateTo', filters.dateTo);
        if (filters.studentId) lessonParams.append('studentId', filters.studentId);
        if (filters.status) lessonParams.append('status', filters.status);
      }

      const [lessonsResponse] = await Promise.all([
        apiRequest(`/api/lessons?${lessonParams.toString()}`)
        // apiRequest('/api/students')
      ]);

      if (lessonsResponse.ok) {
        const lessonsData = await lessonsResponse.json();
        setLessons(lessonsData);
      }

      // if (studentsResponse.ok) {
      //   const studentsData = await response.json();
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
    // Календарь сам покажет модальное окно с занятиями на выбранный день
  };

  const handleAddLesson = (date: Date) => {
    // Только администраторы могут создавать занятия
    if (user?.role !== 'ADMIN') {
      return;
    }
    setSelectedDate(date);
    setShowAddForm(true);
  };

  const handleLessonClick = (lesson: LessonWithOptionalStudent) => {
    setSelectedLesson(lesson);
    setShowEditForm(true);
  };

  const handleEditLesson = (lesson: LessonWithOptionalStudent) => {
    // Только администраторы могут редактировать занятия
    if (user?.role !== 'ADMIN') {
      return;
    }
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

  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  
  const monthLessons = lessons.filter(lesson => {
    const lessonDate = new Date(lesson.date);
    return lessonDate >= monthStart && lessonDate <= monthEnd;
  });

  // Предстоящие занятия (следующие 3 дня)
  const upcomingLessons = lessons.filter(lesson => {
    const lessonDate = new Date(lesson.date);
    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
    return lessonDate > today && lessonDate <= threeDaysFromNow && getLessonStatus(lesson) === 'scheduled';
  }).slice(0, 3);

  return (
    <>
      {/* Десктопная версия */}
      <div className="space-y-6 hidden lg:block">
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
            onClick={() => {
              const lessonsForPrint = lessons.map(lesson => ({
                date: lesson.date,
                student: lesson.student ? { fullName: lesson.student.fullName } : undefined,
                cost: lesson.cost,
                status: getLessonStatus(lesson)
              }));
              printSchedule(lessonsForPrint, selectedDate);
            }}
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
          {user?.role === 'ADMIN' && (
            <button 
              onClick={() => setShowAddForm(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-xl shadow-lg text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 transition-all duration-200 hover:scale-105"
            >
              <Plus className="w-4 h-4 mr-2" />
              Добавить занятие
            </button>
          )}
        </div>
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

      {/* Фильтры - только в режиме списка */}
      {viewMode === 'list' && (
        <LessonFilters 
          onFiltersChange={handleFiltersChange}
          selectedDate={selectedDate}
        />
      )}

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
          onAddLesson={handleAddLesson}
          currentDate={selectedDate}
          userRole={user?.role}
        />
      ) : (
        <LessonsList
          lessons={lessons}
          onLessonClick={handleLessonClick}
          onEditLesson={handleEditLesson}
          selectedDate={selectedDate}
          userRole={user?.role}
        />
      )}

      {/* Статистика */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
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
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Calendar className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Занятий в неделю</p>
              <p className="text-2xl font-bold text-gray-900">{weekLessons.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Calendar className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Занятий в месяц</p>
              <p className="text-2xl font-bold text-gray-900">{monthLessons.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Мобильная версия */}
      <div className="lg:hidden">
        {/* Минимальный заголовок */}
        <div className="p-2 mb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">Расписание</h1>
              <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                {lessons.length}
              </span>
            </div>
            
            {/* Переключатель вида в компактном виде */}
            <div className="flex bg-gray-100 rounded-xl p-0.5">
              <button
                onClick={() => setViewMode('calendar')}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  viewMode === 'calendar'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600'
                }`}
              >
                📅
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  viewMode === 'list'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600'
                }`}
              >
                📋
              </button>
            </div>
          </div>
        </div>

        {/* Основной контент - календарь в полноэкранном режиме */}
        {loading ? (
          <div className="text-center py-12">
            <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Загрузка...</p>
          </div>
        ) : viewMode === 'calendar' ? (
          <CalendarComponent
            lessons={lessons}
            onLessonClick={handleLessonClick}
            onDateClick={handleDateClick}
            onAddLesson={handleAddLesson}
            currentDate={selectedDate}
            userRole={user?.role}
          />
        ) : (
          <div className="p-2">
            {/* Компактные фильтры только для списка */}
            <div className="mb-4 p-3 bg-white rounded-xl border border-gray-200">
              <LessonFilters
                filters={filters}
                onFiltersChange={setFilters}
                students={[]}
              />
            </div>
            
            <div className="bg-white rounded-xl border border-gray-200">
              <LessonsList
                lessons={lessons}
                onLessonClick={handleLessonClick}
                onEditLesson={handleEditLesson}
                selectedDate={selectedDate}
                userRole={user?.role}
              />
            </div>
          </div>
        )}

        {/* Кнопка добавления в нижнем правом углу */}
        {user?.role === 'ADMIN' && (
          <button
            onClick={() => setShowAddForm(true)}
            className="fixed bottom-20 right-4 w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg flex items-center justify-center z-40 hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-6 h-6" />
          </button>
        )}
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
        userRole={user?.role}
      />
    </>
  );
}
