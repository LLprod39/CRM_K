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

      <div className="space-y-4">
        {sortedLessons.map((lesson) => (
          <div
            key={lesson.id}
            className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-lg cursor-pointer transition-all duration-300 overflow-hidden group"
            onClick={() => onLessonClick(lesson)}
          >
            <div className="p-4 sm:p-6">
              <div className="flex items-start justify-between">
                {/* Основная информация */}
                <div className="flex items-start space-x-4 flex-1">
                  {/* Аватар ученика */}
                  <div className="flex-shrink-0">
                    {lesson.student?.photoUrl ? (
                      <img
                        src={lesson.student.photoUrl}
                        alt={lesson.student.fullName}
                        className="h-12 w-12 sm:h-14 sm:w-14 rounded-full object-cover ring-2 ring-white shadow-lg group-hover:ring-blue-200 transition-all duration-300"
                      />
                    ) : (
                      <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-full bg-gradient-to-br from-purple-100 to-purple-200 flex items-center justify-center shadow-lg group-hover:from-purple-200 group-hover:to-purple-300 transition-all duration-300">
                        <User className="h-6 w-6 sm:h-7 sm:w-7 text-purple-600" />
                      </div>
                    )}
                  </div>

                  {/* Информация о занятии */}
                  <div className="flex-1 min-w-0">
                    {/* Заголовок с именем и статусом */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <h3 className="text-lg font-semibold text-gray-900 truncate group-hover:text-blue-600 transition-colors duration-200">
                          {lesson.student?.fullName || 'Неизвестно'}
                        </h3>
                        <span className="text-xs text-gray-500 font-medium">
                          ({lesson.student?.age || '?'} лет)
                        </span>
                      </div>
                      <span className={`px-3 py-1.5 text-xs font-semibold rounded-full flex items-center space-x-1 ${getStatusColor(lesson)}`}>
                        <span>{getStatusInfo(lesson).icon}</span>
                        <span>{getStatusText(lesson)}</span>
                      </span>
                    </div>

                    {/* Детали занятия */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
                      {/* Дата и время */}
                      <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg group-hover:bg-blue-50 transition-colors duration-200">
                        <div className="p-2 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors duration-200">
                          <Clock className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {new Date(lesson.date).toLocaleDateString('ru-RU', { 
                              weekday: 'short', 
                              day: '2-digit', 
                              month: 'short' 
                            })}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(lesson.date).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })} - 
                            {new Date(lesson.endTime).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>

                      {/* Стоимость */}
                      <div className="flex items-center space-x-2 p-3 bg-green-50 rounded-lg group-hover:bg-green-100 transition-colors duration-200">
                        <div className="p-2 bg-green-100 rounded-lg group-hover:bg-green-200 transition-colors duration-200">
                          <DollarSign className="w-4 h-4 text-green-600" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-green-800">
                            {lesson.cost.toLocaleString()} ₸
                          </p>
                          <p className="text-xs text-green-600">Стоимость</p>
                        </div>
                      </div>

                      {/* Статус оплаты */}
                      <div className="flex items-center space-x-2 p-3 bg-purple-50 rounded-lg group-hover:bg-purple-100 transition-colors duration-200">
                        <div className="p-2 bg-purple-100 rounded-lg group-hover:bg-purple-200 transition-colors duration-200">
                          <Calendar className="w-4 h-4 text-purple-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-purple-800">
                            {lesson.isPaid ? 'Оплачено' : 'Не оплачено'}
                          </p>
                          <p className="text-xs text-purple-600">Статус оплаты</p>
                        </div>
                      </div>
                    </div>

                    {/* Дополнительная информация */}
                    <div className="space-y-2">
                      {lesson.notes && (
                        <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg group-hover:bg-amber-100 transition-colors duration-200">
                          <div className="flex items-start space-x-2">
                            <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                            <div>
                              <p className="text-sm font-medium text-amber-800 mb-1">Заметки:</p>
                              <p className="text-sm text-amber-700">{lesson.notes}</p>
                            </div>
                          </div>
                        </div>
                      )}

                      {(lesson as any).comment && (
                        <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg group-hover:bg-blue-100 transition-colors duration-200">
                          <div className="flex items-start space-x-2">
                            <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                            <div>
                              <p className="text-sm font-medium text-blue-800 mb-1">Комментарий о поведении:</p>
                              <p className="text-sm text-blue-700">{(lesson as any).comment}</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Действия */}
                <div className="flex items-center space-x-2 ml-4">
                  {userRole === 'ADMIN' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditLesson(lesson);
                      }}
                      className="p-2.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200 opacity-0 group-hover:opacity-100"
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
                    className="p-2.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-all duration-200 opacity-0 group-hover:opacity-100"
                    title="Просмотр"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
