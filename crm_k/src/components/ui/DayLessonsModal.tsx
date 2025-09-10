'use client';

import { useState } from 'react';
import { X, CheckCircle, AlertCircle, Clock, History } from 'lucide-react';
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

  const getLocationText = (location: string) => {
    switch (location) {
      case 'office': return 'В офисе';
      case 'online': return 'Онлайн';
      case 'home': return 'На дому';
      default: return location;
    }
  };

  const getLessonTypeText = (lessonType: string) => {
    switch (lessonType) {
      case 'individual': return 'Индивидуальное';
      case 'group': return 'Групповое';
      default: return lessonType;
    }
  };

  return (
    <div 
      className="fixed inset-0 backdrop-blur-sm bg-black/50 flex items-center justify-center z-[9999] p-4" 
      style={{ zIndex: 9999 }}
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-lg shadow-xl border border-gray-200 w-full max-w-3xl max-h-[90vh] overflow-hidden"
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

        {/* Контент */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
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
            <div className="space-y-4">
              {lessons
                .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                .map((lesson, index) => (
                <div
                  key={lesson.id}
                  className={`p-4 rounded-lg border cursor-pointer hover:shadow-md transition-all duration-200 bg-white hover:bg-gray-50 ${getStatusColor(lesson)}`}
                  onClick={() => {
                    onLessonClick(lesson);
                    onClose();
                  }}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 rounded-lg bg-gray-100">
                        {getStatusIcon(lesson)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm text-gray-900">
                            {getLessonStatusText(getLessonStatus(lesson))}
                          </span>
                          {new Date(lesson.date) < new Date() && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-xs bg-orange-100 text-orange-700 rounded">
                              <History className="w-3 h-3" />
                              Задним числом
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          ID: {lesson.id}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-lg text-gray-900">
                        {formatTime(lesson.date)}
                        {lesson.endTime && ` - ${formatTime(lesson.endTime)}`}
                      </div>
                      {lesson.endTime && (
                        <div className="text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded-full mt-1">
                          {formatDuration(lesson.date, lesson.endTime)}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="font-medium text-gray-900">
                        {lesson.student?.fullName || `Ученик #${lesson.studentId}`}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <span className="text-sm text-gray-600">Стоимость:</span>
                        <span className="font-medium text-gray-900">{lesson.cost} ₸</span>
                      </div>
                      
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <span className="text-sm text-gray-600">Место:</span>
                        <span className="font-medium text-gray-900">{getLocationText(lesson.location || 'office')}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm text-gray-600">Тип занятия:</span>
                      <span className="font-medium text-gray-900">{getLessonTypeText(lesson.lessonType || 'individual')}</span>
                    </div>

                    {lesson.notes && (
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <span className="text-sm font-medium text-gray-600">Заметки:</span>
                        <p className="text-gray-700 mt-1 text-sm leading-relaxed">{lesson.notes}</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Подвал */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-600">
              <span>Нажмите на занятие для подробной информации</span>
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
