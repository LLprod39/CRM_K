'use client';

import { useState, useEffect } from 'react';
import { 
  CalendarDays, 
  Plus, 
  Users, 
  Clock, 
  DollarSign,
  TrendingUp,
  CheckCircle,
  AlertCircle,
  Eye,
  Filter,
  Search
} from 'lucide-react';
import { useAuth } from '@/presentation/contexts';
import SubscriptionCalendarForm from '@/components/forms/SubscriptionCalendarForm';
import { apiRequest } from '@/lib/api';
import { LessonWithOptionalStudent } from '@/types';

interface SubscriptionStats {
  totalSubscriptions: number;
  activeSubscriptions: number;
  totalRevenue: number;
  upcomingLessons: number;
}

export default function SubscriptionsPage() {
  const { user } = useAuth();
  const [isSubscriptionFormOpen, setIsSubscriptionFormOpen] = useState(false);
  const [lessons, setLessons] = useState<LessonWithOptionalStudent[]>([]);
  const [stats, setStats] = useState<SubscriptionStats>({
    totalSubscriptions: 0,
    activeSubscriptions: 0,
    totalRevenue: 0,
    upcomingLessons: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Загружаем данные при открытии страницы
  useEffect(() => {
    fetchLessons();
  }, []);

  const fetchLessons = async () => {
    try {
      setLoading(true);
      const response = await apiRequest('/api/lessons');
      if (response.ok) {
        const data = await response.json();
        setLessons(data);
        calculateStats(data);
      } else {
        setError('Ошибка при загрузке занятий');
      }
    } catch (err) {
      setError('Ошибка при загрузке занятий');
      console.error('Ошибка загрузки занятий:', err);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (lessonsData: LessonWithOptionalStudent[]) => {
    const now = new Date();
    const upcomingLessons = lessonsData.filter(lesson => 
      new Date(lesson.date) > now && !lesson.isCancelled
    );
    
    const activeSubscriptions = lessonsData.filter(lesson => 
      !lesson.isCancelled && !lesson.isCompleted
    );

    const totalRevenue = lessonsData
      .filter(lesson => lesson.isPaid)
      .reduce((sum, lesson) => sum + lesson.cost, 0);

    setStats({
      totalSubscriptions: lessonsData.length,
      activeSubscriptions: activeSubscriptions.length,
      totalRevenue,
      upcomingLessons: upcomingLessons.length
    });
  };

  const handleSubscriptionSuccess = () => {
    fetchLessons(); // Обновляем данные после создания абонимента
  };

  // Фильтрация занятий
  const filteredLessons = lessons.filter(lesson => {
    const matchesSearch = !searchTerm || 
      lesson.student?.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lesson.student?.parentName.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'scheduled' && !lesson.isPaid && !lesson.isCompleted && !lesson.isCancelled) ||
      (statusFilter === 'prepaid' && lesson.isPaid && !lesson.isCompleted && !lesson.isCancelled) ||
      (statusFilter === 'completed' && lesson.isCompleted) ||
      (statusFilter === 'cancelled' && lesson.isCancelled);

    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (lesson: LessonWithOptionalStudent) => {
    if (lesson.isCancelled) return 'bg-orange-100 text-orange-800';
    if (lesson.isCompleted && lesson.isPaid) return 'bg-purple-100 text-purple-800';
    if (lesson.isCompleted && !lesson.isPaid) return 'bg-red-100 text-red-800';
    if (!lesson.isCompleted && lesson.isPaid) return 'bg-yellow-100 text-yellow-800';
    return 'bg-blue-100 text-blue-800';
  };

  const getStatusText = (lesson: LessonWithOptionalStudent) => {
    if (lesson.isCancelled) return 'Отменено';
    if (lesson.isCompleted && lesson.isPaid) return 'Проведено';
    if (lesson.isCompleted && !lesson.isPaid) return 'Задолженность';
    if (!lesson.isCompleted && lesson.isPaid) return 'Предоплачено';
    return 'Запланировано';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Заголовок страницы */}
      <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl p-6 border border-purple-200">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
              <CalendarDays className="w-8 h-8 mr-3 text-purple-600" />
              Абонименты
            </h1>
            <p className="text-gray-600 mt-2">
              Управление занятиями на несколько дней и создание абониментов
            </p>
          </div>
          <button
            onClick={() => setIsSubscriptionFormOpen(true)}
            className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors flex items-center shadow-lg"
          >
            <Plus className="w-5 h-5 mr-2" />
            Создать абонимент
          </button>
        </div>
      </div>

      {/* Статистика */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-lg">
              <CalendarDays className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Всего занятий</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalSubscriptions}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Активные</p>
              <p className="text-2xl font-bold text-gray-900">{stats.activeSubscriptions}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 bg-yellow-100 rounded-lg">
              <DollarSign className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Доход</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.totalRevenue.toLocaleString()} ₸
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 bg-purple-100 rounded-lg">
              <Clock className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Предстоящие</p>
              <p className="text-2xl font-bold text-gray-900">{stats.upcomingLessons}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Фильтры и поиск */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Поиск по ученику или родителю..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              />
            </div>
          </div>
          <div className="sm:w-48">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            >
              <option value="all">Все статусы</option>
              <option value="scheduled">Запланировано</option>
              <option value="prepaid">Предоплачено</option>
              <option value="completed">Проведено</option>
              <option value="cancelled">Отменено</option>
            </select>
          </div>
        </div>
      </div>

      {/* Список занятий */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center">
            <Eye className="w-5 h-5 mr-2" />
            Список занятий ({filteredLessons.length})
          </h2>
        </div>

        {error && (
          <div className="p-6">
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md flex items-center">
              <AlertCircle className="w-5 h-5 mr-2" />
              {error}
            </div>
          </div>
        )}

        {filteredLessons.length === 0 ? (
          <div className="p-12 text-center">
            <CalendarDays className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm || statusFilter !== 'all' ? 'Занятия не найдены' : 'Нет занятий'}
            </h3>
            <p className="text-gray-500 mb-6">
              {searchTerm || statusFilter !== 'all' 
                ? 'Попробуйте изменить фильтры поиска' 
                : 'Создайте первое занятие, нажав кнопку "Создать абонимент"'
              }
            </p>
            {!searchTerm && statusFilter === 'all' && (
              <button
                onClick={() => setIsSubscriptionFormOpen(true)}
                className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors flex items-center mx-auto"
              >
                <Plus className="w-5 h-5 mr-2" />
                Создать абонимент
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredLessons.map((lesson) => (
              <div key={lesson.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      {lesson.student?.photoUrl ? (
                        <img
                          src={lesson.student.photoUrl}
                          alt={lesson.student.fullName}
                          className="h-12 w-12 rounded-full object-cover"
                        />
                      ) : (
                        <div className="h-12 w-12 rounded-full bg-gray-200 flex items-center justify-center">
                          <Users className="h-6 w-6 text-gray-500" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <h3 className="text-lg font-medium text-gray-900 truncate">
                          {lesson.student?.fullName || `Ученик #${lesson.studentId}`}
                        </h3>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(lesson)}`}>
                          {getStatusText(lesson)}
                        </span>
                      </div>
                      <div className="mt-1 flex items-center space-x-4 text-sm text-gray-500">
                        <span className="flex items-center">
                          <CalendarDays className="w-4 h-4 mr-1" />
                          {new Date(lesson.date).toLocaleDateString('ru-RU')}
                        </span>
                        <span className="flex items-center">
                          <Clock className="w-4 h-4 mr-1" />
                          {new Date(lesson.date).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })} - 
                          {new Date(lesson.endTime).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <span className="flex items-center">
                          <DollarSign className="w-4 h-4 mr-1" />
                          {lesson.cost.toLocaleString()} ₸
                        </span>
                      </div>
                      {lesson.student?.parentName && (
                        <p className="text-sm text-gray-500 mt-1">
                          Родитель: {lesson.student.parentName}
                        </p>
                      )}
                      {lesson.notes && (
                        <p className="text-sm text-gray-600 mt-2 bg-gray-50 p-2 rounded">
                          {lesson.notes}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {lesson.teacher && (
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">
                          {lesson.teacher.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {lesson.teacher.email}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Форма создания абонимента */}
      <SubscriptionCalendarForm
        isOpen={isSubscriptionFormOpen}
        onClose={() => setIsSubscriptionFormOpen(false)}
        onSuccess={handleSubscriptionSuccess}
      />
    </div>
  );
}
