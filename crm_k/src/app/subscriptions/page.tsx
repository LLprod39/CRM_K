'use client';

import { useState, useEffect } from 'react';
import { 
  CalendarDays, 
  Plus, 
  Users, 
  Clock, 
  DollarSign,
  AlertCircle,
  Eye,
  Search,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '@/presentation/contexts';
import SubscriptionCalendarForm from '@/components/forms/SubscriptionCalendarForm';
import EditLessonForm from '@/components/forms/EditLessonForm';
import { apiRequest } from '@/lib/api';
import { LessonWithOptionalStudent } from '@/types';


export default function SubscriptionsPage() {
  const { user } = useAuth();
  const [isSubscriptionFormOpen, setIsSubscriptionFormOpen] = useState(false);
  const [lessons, setLessons] = useState<LessonWithOptionalStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [groupByStudent, setGroupByStudent] = useState(true);
  const [expandedStudents, setExpandedStudents] = useState<Set<number>>(new Set());
  const [selectedLesson, setSelectedLesson] = useState<LessonWithOptionalStudent | null>(null);
  const [showEditForm, setShowEditForm] = useState(false);

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


  const handleSubscriptionSuccess = () => {
    fetchLessons(); // Обновляем данные после создания абонимента
  };

  const handleLessonClick = (lesson: LessonWithOptionalStudent) => {
    // Только администраторы могут редактировать занятия
    if (user?.role !== 'ADMIN') {
      return;
    }
    setSelectedLesson(lesson);
    setShowEditForm(true);
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

  // Группировка занятий по ученикам
  const groupedLessons = filteredLessons.reduce((acc, lesson) => {
    const studentId = lesson.studentId
    if (!acc[studentId]) {
      acc[studentId] = {
        student: lesson.student,
        lessons: []
      }
    }
    acc[studentId].lessons.push(lesson)
    return acc
  }, {} as Record<number, { student: any, lessons: LessonWithOptionalStudent[] }>)

  // Управление разворачиванием/сворачиванием групп
  const toggleStudentExpansion = (studentId: number) => {
    const numericStudentId = Number(studentId)
    const newExpanded = new Set(expandedStudents)
    if (newExpanded.has(numericStudentId)) {
      newExpanded.delete(numericStudentId)
    } else {
      newExpanded.add(numericStudentId)
    }
    setExpandedStudents(newExpanded)
  }

  // Разворачиваем все группы по умолчанию
  useEffect(() => {
    if (lessons.length > 0) {
      const allStudentIds = new Set(lessons.map(l => l.studentId))
      setExpandedStudents(allStudentIds)
    }
  }, [lessons])

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
            <h1 className="text-3xl font-bold text-gray-900">
              Абонименты
            </h1>
            <p className="text-gray-600 mt-2">
              Управление занятиями на несколько дней
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
          <div className="space-y-4">
            {Object.entries(groupedLessons).map(([studentIdStr, group]) => {
              const studentId = Number(studentIdStr)
              const isExpanded = expandedStudents.has(studentId)
              const totalLessons = group.lessons.length
              
              return (
                <div key={studentId} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                  {/* Заголовок группы ученика */}
                  <div 
                    className="p-6 cursor-pointer hover:bg-gray-50 transition-colors duration-200"
                    onClick={() => toggleStudentExpansion(studentId)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        {/* Аватар ученика */}
                        <div className="flex-shrink-0">
                          {group.student?.photoUrl ? (
                            <img
                              src={group.student.photoUrl}
                              alt={group.student.fullName}
                              className="h-12 w-12 rounded-full object-cover ring-2 ring-white shadow-lg"
                            />
                          ) : (
                            <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center shadow-lg">
                              <Users className="h-6 w-6 text-blue-600" />
                            </div>
                          )}
                        </div>
                        
                        {/* Информация об ученике */}
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">
                            {group.student?.fullName || `Ученик #${studentId}`}
                          </h3>
                          <p className="text-sm text-gray-500">
                            {totalLessons} заняти{totalLessons === 1 ? 'е' : totalLessons < 5 ? 'я' : 'й'}
                          </p>
                        </div>
                      </div>
                      
                      {/* Кнопка разворачивания */}
                      <div className="flex items-center space-x-3">
                        <span className="text-sm text-gray-500">
                          {isExpanded ? 'Свернуть' : 'Развернуть'}
                        </span>
                        {isExpanded ? (
                          <ChevronDown className="w-5 h-5 text-gray-400" />
                        ) : (
                          <ChevronRight className="w-5 h-5 text-gray-400" />
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Содержимое группы */}
                  {isExpanded && (
                    <div className="border-t border-gray-100">
                      {group.lessons.map((lesson) => (
                        <div 
                          key={lesson.id} 
                          className="p-6 border-b border-gray-100 last:border-b-0 hover:bg-gray-50 transition-colors duration-200 cursor-pointer"
                          onClick={() => handleLessonClick(lesson)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                              {/* Информация о занятии */}
                              <div className="flex-1">
                                <div className="flex items-center space-x-3 mb-2">
                                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(lesson)}`}>
                                    {getStatusText(lesson)}
                                  </span>
                                </div>
                                
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                                  <div className="flex items-center space-x-2">
                                    <CalendarDays className="w-4 h-4 text-blue-600" />
                                    <span className="text-gray-600">
                                      {new Date(lesson.date).toLocaleDateString('ru-RU', { 
                                        weekday: 'short', 
                                        day: '2-digit', 
                                        month: 'short' 
                                      })}
                                    </span>
                                  </div>
                                  
                                  <div className="flex items-center space-x-2">
                                    <Clock className="w-4 h-4 text-purple-600" />
                                    <span className="text-gray-600">
                                      {new Date(lesson.date).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })} - 
                                      {new Date(lesson.endTime).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                  </div>
                                  
                                  <div className="flex items-center space-x-2">
                                    <DollarSign className="w-4 h-4 text-green-600" />
                                    <span className="font-semibold text-green-800">
                                      {lesson.cost.toLocaleString()} ₸
                                    </span>
                                  </div>
                                </div>
                                
                                {lesson.notes && (
                                  <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                                    <div className="flex items-start space-x-2">
                                      <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                                      <div>
                                        <p className="text-sm font-medium text-amber-800 mb-1">Заметки:</p>
                                        <p className="text-sm text-amber-700">{lesson.notes}</p>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                            
                            {/* Кнопка просмотра */}
                            <button
                              onClick={() => {/* Добавить действие просмотра */}}
                              className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200"
                              title="Просмотр деталей"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Форма создания абонимента */}
      <SubscriptionCalendarForm
        isOpen={isSubscriptionFormOpen}
        onClose={() => setIsSubscriptionFormOpen(false)}
        onSuccess={handleSubscriptionSuccess}
      />

      {/* Форма редактирования занятия */}
      <EditLessonForm
        isOpen={showEditForm}
        onClose={() => {
          setShowEditForm(false);
          setSelectedLesson(null);
        }}
        onSuccess={() => {
          setShowEditForm(false);
          setSelectedLesson(null);
          fetchLessons(); // Обновляем данные после редактирования
        }}
        onDelete={() => {
          setShowEditForm(false);
          setSelectedLesson(null);
          fetchLessons(); // Обновляем данные после удаления
        }}
        lesson={selectedLesson}
        userRole={user?.role}
      />
    </div>
  );
}
