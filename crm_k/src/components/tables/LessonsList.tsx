'use client';

import { Clock, User, DollarSign, Edit, Eye, Calendar, AlertCircle } from 'lucide-react';
import { LessonWithOptionalStudent, getCombinedLessonStatus } from '@/types';
import { getLessonStatusInfo } from '@/lib/lessonStatusUtils';
import Card, { CardHeader, CardTitle } from '../ui/Card';

interface LessonsListProps {
  lessons: LessonWithOptionalStudent[];
  onLessonClick: (lesson: LessonWithOptionalStudent) => void;
  onEditLesson: (lesson: LessonWithOptionalStudent) => void;
  selectedDate?: Date;
  userRole?: 'ADMIN' | 'USER';
}

export default function LessonsList({ lessons, onLessonClick, onEditLesson, selectedDate, userRole }: LessonsListProps) {

  const getStatusInfo = (lesson: LessonWithOptionalStudent) => {
    return getLessonStatusInfo(
      lesson.isCompleted,
      lesson.isPaid,
      lesson.isCancelled,
      new Date(lesson.date)
    );
  };

  const getStatusColor = (lesson: LessonWithOptionalStudent) => {
    const statusInfo = getStatusInfo(lesson);
    return `${statusInfo.bgColor} ${statusInfo.color} border border-current`;
  };

  const getStatusText = (lesson: LessonWithOptionalStudent) => {
    const statusInfo = getStatusInfo(lesson);
    return statusInfo.label;
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
        const selectedDateOnly = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
        const lessonDateOnly = new Date(lessonDate.getFullYear(), lessonDate.getMonth(), lessonDate.getDate());
        return lessonDateOnly.getTime() === selectedDateOnly.getTime();
      })
    : lessons;

  // Сортируем занятия по дате
  const sortedLessons = [...filteredLessons].sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  if (sortedLessons.length === 0) {
    return (
      <Card padding="none">
        <CardHeader
          icon={<Calendar className="w-5 h-5 text-blue-600" />}
        >
          <CardTitle>
            {selectedDate ? `Занятия на ${formatDate(selectedDate)}` : 'Все занятия'}
          </CardTitle>
        </CardHeader>
        <div className="p-6">
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-gradient-to-br from-gray-50 to-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Clock className="h-10 w-10 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Нет занятий</h3>
            <p className="text-gray-500">
              {selectedDate 
                ? `На эту дату не запланировано занятий`
                : 'Занятия не найдены'
              }
            </p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card padding="none">
      <CardHeader
        icon={<Calendar className="w-5 h-5 text-blue-600" />}
      >
        <CardTitle
          subtitle={`Найдено занятий: ${sortedLessons.length}`}
        >
          {selectedDate ? `Занятия на ${formatDate(selectedDate)}` : 'Все занятия'}
        </CardTitle>
      </CardHeader>

      <div className="divide-y divide-gray-100">
        {sortedLessons.map((lesson) => (
          <div
            key={lesson.id}
            className="p-6 hover:bg-gray-50 cursor-pointer transition-all duration-200 hover:shadow-sm"
            onClick={() => onLessonClick(lesson)}
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-4 mb-3">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-gray-50 rounded-lg">
                      <Clock className="w-4 h-4 text-gray-600" />
                    </div>
                    <span className="text-sm font-medium text-gray-700">
                      {formatDateTime(lesson.date)}
                    </span>
                  </div>
                  <span className={`px-3 py-1.5 text-xs font-medium rounded-lg flex items-center gap-1 ${getStatusColor(lesson)}`}>
                    <span>{getStatusInfo(lesson).icon}</span>
                    {getStatusText(lesson)}
                  </span>
                </div>
                
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <User className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-900">{lesson.student?.fullName || 'Неизвестно'}</span>
                      <span className="text-xs text-gray-500 ml-1">({lesson.student?.age || '?'} лет)</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-yellow-50 rounded-lg">
                      <DollarSign className="w-4 h-4 text-yellow-600" />
                    </div>
                    <span className="text-sm font-semibold text-gray-900">{lesson.cost.toLocaleString()} ₸</span>
                  </div>
                </div>

                {lesson.notes && (
                  <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Заметки:</span> {lesson.notes}
                    </p>
                  </div>
                )}

                {(lesson as any).comment && (
                  <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-100">
                    <p className="text-sm text-blue-700">
                      <span className="font-medium">Комментарий о поведении:</span> {(lesson as any).comment}
                    </p>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 ml-4">
                {userRole === 'ADMIN' && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onEditLesson(lesson);
                    }}
                    className="p-2.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200"
                    title="Редактировать"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onLessonClick(lesson);
                  }}
                  className="p-2.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-all duration-200"
                  title="Просмотр"
                >
                  <Eye className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
