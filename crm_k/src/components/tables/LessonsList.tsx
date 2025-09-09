'use client';

import { useState } from 'react';
import { Clock, User, DollarSign, Edit, Eye, Calendar } from 'lucide-react';
import { LessonWithOptionalStudent } from '@/types';

interface LessonsListProps {
  lessons: LessonWithOptionalStudent[];
  onLessonClick: (lesson: LessonWithOptionalStudent) => void;
  onEditLesson: (lesson: LessonWithOptionalStudent) => void;
  selectedDate?: Date;
}

export default function LessonsList({ lessons, onLessonClick, onEditLesson, selectedDate }: LessonsListProps) {
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SCHEDULED': return 'bg-blue-100 text-blue-800';
      case 'COMPLETED': return 'bg-green-100 text-green-800';
      case 'CANCELLED': return 'bg-red-100 text-red-800';
      case 'PAID': return 'bg-purple-100 text-purple-800';
      case 'PREPAID': return 'bg-yellow-100 text-yellow-800';
      case 'UNPAID': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'SCHEDULED': return 'Запланировано';
      case 'COMPLETED': return 'Проведено';
      case 'CANCELLED': return 'Отменено';
      case 'PAID': return 'Оплачено';
      case 'PREPAID': return 'Предоплачено';
      case 'UNPAID': return 'Не оплачено';
      default: return status;
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  // const formatTime = (date: Date) => {
  //   return new Date(date).toLocaleTimeString('ru-RU', {
  //     hour: '2-digit',
  //     minute: '2-digit'
  //   });
  // };

  const formatDateTime = (date: Date) => {
    return new Date(date).toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Фильтруем занятия по выбранной дате, если она указана
  const filteredLessons = selectedDate 
    ? lessons.filter(lesson => {
        const lessonDate = new Date(lesson.date);
        return lessonDate.toDateString() === selectedDate.toDateString();
      })
    : lessons;

  // Сортируем занятия по дате
  const sortedLessons = [...filteredLessons].sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  if (sortedLessons.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">
              {selectedDate ? `Занятия на ${formatDate(selectedDate)}` : 'Все занятия'}
            </h3>
            <div className="flex gap-2">
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-1 text-sm rounded-md ${
                  viewMode === 'list' 
                    ? 'bg-blue-100 text-blue-700' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Список
              </button>
              <button
                onClick={() => setViewMode('calendar')}
                className={`px-3 py-1 text-sm rounded-md ${
                  viewMode === 'calendar' 
                    ? 'bg-blue-100 text-blue-700' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Calendar className="w-4 h-4 inline mr-1" />
                Календарь
              </button>
            </div>
          </div>
        </div>
        <div className="p-6">
          <div className="text-center py-12">
            <Clock className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Нет занятий</h3>
            <p className="mt-1 text-sm text-gray-500">
              {selectedDate 
                ? `На ${formatDate(selectedDate)} не запланировано занятий.`
                : 'Занятия не найдены.'
              }
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">
            {selectedDate ? `Занятия на ${formatDate(selectedDate)}` : 'Все занятия'}
            <span className="ml-2 text-sm text-gray-500">({sortedLessons.length})</span>
          </h3>
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1 text-sm rounded-md ${
                viewMode === 'list' 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Список
            </button>
            <button
              onClick={() => setViewMode('calendar')}
              className={`px-3 py-1 text-sm rounded-md ${
                viewMode === 'calendar' 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Calendar className="w-4 h-4 inline mr-1" />
              Календарь
            </button>
          </div>
        </div>
      </div>

      <div className="divide-y divide-gray-200">
        {sortedLessons.map((lesson) => (
          <div
            key={lesson.id}
            className="p-6 hover:bg-gray-50 cursor-pointer"
            onClick={() => onLessonClick(lesson)}
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-4 mb-2">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Clock className="w-4 h-4" />
                    <span className="text-sm font-medium">
                      {formatDateTime(lesson.date)}
                    </span>
                  </div>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(lesson.status)}`}>
                    {getStatusText(lesson.status)}
                  </span>
                </div>
                
                <div className="flex items-center gap-4 text-gray-600">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    <span className="text-sm">{lesson.student?.fullName || 'Неизвестно'}</span>
                    <span className="text-xs text-gray-400">({lesson.student?.age || '?'} лет)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4" />
                    <span className="text-sm font-medium">{lesson.cost} ₽</span>
                  </div>
                </div>

                {lesson.notes && (
                  <div className="mt-2 text-sm text-gray-600">
                    <span className="font-medium">Заметки:</span> {lesson.notes}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 ml-4">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onEditLesson(lesson);
                  }}
                  className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md"
                  title="Редактировать"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onLessonClick(lesson);
                  }}
                  className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-md"
                  title="Просмотр"
                >
                  <Eye className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
