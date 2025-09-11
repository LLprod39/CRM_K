'use client';

import { useState } from 'react';
import { X, CheckCircle, AlertCircle, Clock, History, ArrowUpDown, Filter } from 'lucide-react';
import { LessonWithOptionalStudent, getLessonStatus, getLessonStatusText } from '@/types';

interface DayLessonsModalProps {
  isOpen: boolean;
  onClose: () => void;
  lessons: LessonWithOptionalStudent[];
  date: Date;
  onLessonClick: (lesson: LessonWithOptionalStudent) => void;
}

export default function DayLessonsModal({ 
  isOpen, 
  onClose, 
  lessons, 
  date, 
  onLessonClick 
}: DayLessonsModalProps) {
  console.log('DayLessonsModal: isOpen =', isOpen, 'lessons =', lessons.length);
  const [sortField, setSortField] = useState<'time' | 'student' | 'status' | 'cost'>('time');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  if (!isOpen) return null;

  const getStatusColor = (lesson: LessonWithOptionalStudent) => {
    const status = getLessonStatus(lesson);
    const isBackdate = new Date(lesson.date) < new Date();
    
    // Для занятий задним числом добавляем специальную индикацию
    if (isBackdate) {
      switch (status) {
        case 'scheduled': return 'bg-orange-100 text-orange-800 border-orange-300 border-l-4';
        case 'completed': return 'bg-green-100 text-green-800 border-green-300 border-l-4';
        case 'cancelled': return 'bg-red-100 text-red-800 border-red-300 border-l-4';
        case 'paid': return 'bg-purple-100 text-purple-800 border-purple-300 border-l-4';
        case 'prepaid': return 'bg-yellow-100 text-yellow-800 border-yellow-300 border-l-4';
        case 'unpaid': return 'bg-orange-100 text-orange-800 border-orange-300 border-l-4';
        default: return 'bg-gray-100 text-gray-800 border-gray-300 border-l-4';
      }
    }
    
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
      case 'paid': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'prepaid': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'unpaid': return 'bg-orange-100 text-orange-800 border-orange-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (lesson: LessonWithOptionalStudent) => {
    const status = getLessonStatus(lesson);
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      case 'cancelled': return <AlertCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString('ru-RU', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const formatDuration = (startDate: Date, endDate?: Date) => {
    if (!endDate) return '';
    const start = new Date(startDate);
    const end = new Date(endDate);
    const duration = end.getTime() - start.getTime();
    const hours = Math.floor(duration / (1000 * 60 * 60));
    const minutes = Math.floor((duration % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}ч ${minutes}м`;
  };


  const getLessonTypeText = (lessonType: string) => {
    switch (lessonType) {
      case 'individual': return 'Индивидуальное';
      case 'group': return 'Групповое';
      default: return lessonType;
    }
  };

  // Функции для сортировки и фильтрации
  const handleSort = (field: 'time' | 'student' | 'status' | 'cost') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortedAndFilteredLessons = () => {
    let filtered = lessons;
    
    // Фильтрация по статусу
    if (statusFilter !== 'all') {
      filtered = lessons.filter(lesson => getLessonStatus(lesson) === statusFilter);
    }
    
    // Сортировка
    return filtered.sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortField) {
        case 'time':
          aValue = new Date(a.date).getTime();
          bValue = new Date(b.date).getTime();
          break;
        case 'student':
          aValue = a.student?.fullName || `Ученик #${a.studentId}`;
          bValue = b.student?.fullName || `Ученик #${b.studentId}`;
          break;
        case 'status':
          aValue = getLessonStatus(a);
          bValue = getLessonStatus(b);
          break;
        case 'cost':
          aValue = a.cost || 0;
          bValue = b.cost || 0;
          break;
        default:
          return 0;
      }
      
      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
      case 'scheduled': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'paid': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'prepaid': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'unpaid': return 'bg-orange-100 text-orange-800 border-orange-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const sortedLessons = getSortedAndFilteredLessons();

  return (
    <div 
      className="fixed inset-0 backdrop-blur-sm bg-black/50 flex items-center justify-center z-[9999] p-4" 
      style={{ zIndex: 9999 }}
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-lg shadow-xl border border-gray-200 w-full max-w-7xl max-h-[95vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Заголовок */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900">
              Занятия на {date.toLocaleDateString('ru-RU', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
              {date < new Date() && (
                <span className="ml-3 inline-flex items-center gap-1 px-2 py-1 text-sm bg-orange-100 text-orange-800 rounded-full">
                  <History className="w-3 h-3" />
                  Задним числом
                </span>
              )}
            </h2>
            <div className="flex items-center gap-2 mt-2">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                lessons.length === 0 ? 'bg-gray-100 text-gray-700' :
                lessons.length === 1 ? 'bg-green-100 text-green-700' :
                lessons.length === 2 ? 'bg-yellow-100 text-yellow-700' :
                'bg-red-100 text-red-700'
              }`}>
                {lessons.length === 0 ? 'Свободный день' : `${lessons.length} занят${lessons.length === 1 ? 'ие' : lessons.length < 5 ? 'ия' : 'ий'}`}
              </span>
              {lessons.length > 0 && (
                <span className="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
                  {lessons.reduce((total, lesson) => {
                    if (lesson.endTime) {
                      const duration = new Date(lesson.endTime).getTime() - new Date(lesson.date).getTime();
                      return total + duration;
                    }
                    return total;
                  }, 0) > 0 ? Math.round(lessons.reduce((total, lesson) => {
                    if (lesson.endTime) {
                      const duration = new Date(lesson.endTime).getTime() - new Date(lesson.date).getTime();
                      return total + duration;
                    }
                    return total;
                  }, 0) / (1000 * 60 * 60) * 10) / 10 : 0}ч
                </span>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors duration-200 p-2 hover:bg-gray-100 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Фильтры и сортировка */}
        {lessons.length > 0 && (
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-gray-500" />
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="all">Все статусы</option>
                    <option value="scheduled">Запланировано</option>
                    <option value="completed">Завершено</option>
                    <option value="cancelled">Отменено</option>
                    <option value="paid">Оплачено</option>
                    <option value="prepaid">Предоплачено</option>
                    <option value="unpaid">Не оплачено</option>
                  </select>
                </div>
                <div className="text-sm text-gray-600">
                  Показано: {sortedLessons.length} из {lessons.length} занятий
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Контент */}
        <div className="overflow-y-auto max-h-[calc(95vh-200px)]">
          {lessons.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Свободный день</h3>
              <p className="text-gray-600 mb-6">
                На {date.toLocaleDateString('ru-RU', { 
                  day: 'numeric', 
                  month: 'long', 
                  year: 'numeric' 
                })} не запланировано занятий
              </p>
              <div className="bg-gray-50 rounded-lg p-6 max-w-md mx-auto">
                <h4 className="text-lg font-medium text-gray-800 mb-4">Возможности дня:</h4>
                <div className="space-y-3 text-left">
                  <div className="flex items-center gap-3 text-gray-700">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm">Добавить новое занятие</span>
                  </div>
                  <div className="flex items-center gap-3 text-gray-700">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="text-sm">Планирование на будущее</span>
                  </div>
                  <div className="flex items-center gap-3 text-gray-700">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    <span className="text-sm">Время для подготовки</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th 
                      className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('time')}
                    >
                      <div className="flex items-center gap-2">
                        Время
                        <ArrowUpDown className="w-3 h-3" />
                      </div>
                    </th>
                    <th 
                      className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('student')}
                    >
                      <div className="flex items-center gap-2">
                        Ученик
                        <ArrowUpDown className="w-3 h-3" />
                      </div>
                    </th>
                    <th 
                      className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('status')}
                    >
                      <div className="flex items-center gap-2">
                        Статус
                        <ArrowUpDown className="w-3 h-3" />
                      </div>
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Тип
                    </th>
                    <th 
                      className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('cost')}
                    >
                      <div className="flex items-center gap-2">
                        Стоимость
                        <ArrowUpDown className="w-3 h-3" />
                      </div>
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Длительность
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Заметки
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {sortedLessons.map((lesson) => {
                    const status = getLessonStatus(lesson);
                    const isBackdate = new Date(lesson.date) < new Date();
                    
                    return (
                      <tr 
                        key={lesson.id}
                        className="hover:bg-gray-50 cursor-pointer transition-colors duration-150"
                        onClick={() => {
                          onLessonClick(lesson);
                          onClose();
                        }}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex flex-col">
                            <div className="text-sm font-medium text-gray-900">
                              {formatTime(lesson.date)}
                            </div>
                            {lesson.endTime && (
                              <div className="text-xs text-gray-500">
                                до {formatTime(lesson.endTime)}
                              </div>
                            )}
                            {isBackdate && (
                              <div className="flex items-center gap-1 mt-1">
                                <History className="w-3 h-3 text-orange-500" />
                                <span className="text-xs text-orange-600">Задним числом</span>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-8 w-8">
                              <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                                <span className="text-sm font-medium text-blue-800">
                                  {(lesson.student?.fullName || `#${lesson.studentId}`).charAt(0).toUpperCase()}
                                </span>
                              </div>
                            </div>
                            <div className="ml-3">
                              <div className="text-sm font-medium text-gray-900">
                                {lesson.student?.fullName || `Ученик #${lesson.studentId}`}
                              </div>
                              <div className="text-xs text-gray-500">
                                ID: {lesson.id}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusBadgeColor(status)}`}>
                            {getStatusIcon(lesson)}
                            {getLessonStatusText(status)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {getLessonTypeText(lesson.lessonType || 'individual')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {lesson.cost} ₸
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {lesson.endTime ? formatDuration(lesson.date, lesson.endTime) : '-'}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500 max-w-xs">
                          <div className="truncate" title={lesson.notes || ''}>
                            {lesson.notes || '-'}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Подвал */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-600">
              <span>Нажмите на занятие для редактирования</span>
              {lessons.length > 0 && (
                <span className="ml-4">
                  • Всего занятий: {lessons.length}
                  {sortedLessons.length !== lessons.length && ` • Показано: ${sortedLessons.length}`}
                </span>
              )}
            </div>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors duration-200 font-medium"
            >
              Закрыть
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
