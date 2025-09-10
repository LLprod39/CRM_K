'use client';

import { useState } from 'react';
import { X, Clock, User, MapPin, DollarSign, FileText, CheckCircle, AlertCircle } from 'lucide-react';
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
  if (!isOpen) return null;

  const getStatusColor = (lesson: LessonWithOptionalStudent) => {
    const status = getLessonStatus(lesson);
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Заголовок */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Занятия на {date.toLocaleDateString('ru-RU', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {lessons.length} занят{lessons.length === 1 ? 'ие' : lessons.length < 5 ? 'ия' : 'ий'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-lg"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Контент */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {lessons.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Занятий нет</h3>
              <p className="text-gray-500">На выбранную дату не запланировано занятий</p>
            </div>
          ) : (
            <div className="space-y-4">
              {lessons
                .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                .map((lesson) => (
                <div
                  key={lesson.id}
                  className={`p-4 rounded-xl border-2 cursor-pointer hover:shadow-md transition-all ${getStatusColor(lesson)}`}
                  onClick={() => {
                    onLessonClick(lesson);
                    onClose();
                  }}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(lesson)}
                      <span className="font-medium">
                        {getLessonStatusText(getLessonStatus(lesson))}
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-lg">
                        {formatTime(lesson.date)}
                        {lesson.endTime && ` - ${formatTime(lesson.endTime)}`}
                      </div>
                      {lesson.endTime && (
                        <div className="text-sm opacity-75">
                          {formatDuration(lesson.date, lesson.endTime)}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <User className="w-4 h-4" />
                      <span className="font-medium">
                        {lesson.student?.fullName || `Ученик #${lesson.studentId}`}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                      <div className="flex items-center space-x-2">
                        <DollarSign className="w-4 h-4" />
                        <span>{lesson.cost} ₸</span>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <MapPin className="w-4 h-4" />
                        <span>{getLocationText(lesson.location || 'office')}</span>
                      </div>
                    </div>

                    <div className="text-sm">
                      <span className="font-medium">Тип: </span>
                      {getLessonTypeText(lesson.lessonType || 'individual')}
                    </div>

                    {lesson.notes && (
                      <div className="flex items-start space-x-2 text-sm">
                        <FileText className="w-4 h-4 mt-0.5" />
                        <span className="opacity-75">{lesson.notes}</span>
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
              Нажмите на занятие для подробной информации
            </div>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Закрыть
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
