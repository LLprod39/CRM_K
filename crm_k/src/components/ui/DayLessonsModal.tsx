'use client';

import { useState } from 'react';
import { X, CheckCircle, AlertCircle, Clock, History, ArrowUpDown, Calendar, Users, DollarSign, CreditCard, AlertTriangle } from 'lucide-react';
import { LessonWithOptionalStudent, getLessonStatus, getLessonStatusText } from '@/types';
import LunchTimeSelector from './LunchTimeSelector';
import Modal, { ModalSection, InfoCard } from './Modal';

interface DayLessonsModalProps {
  isOpen: boolean;
  onClose: () => void;
  lessons: LessonWithOptionalStudent[];
  date: Date;
  onLessonClick: (lesson: LessonWithOptionalStudent) => void;
  userRole?: 'ADMIN' | 'USER';
}

export default function DayLessonsModal({ 
  isOpen, 
  onClose, 
  lessons, 
  date, 
  onLessonClick,
  userRole
}: DayLessonsModalProps) {
  console.log('DayLessonsModal: isOpen =', isOpen, 'lessons =', lessons.length, 'date =', date);
  const [sortField, setSortField] = useState<'time' | 'student' | 'status' | 'cost'>('time');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  
  if (!isOpen) return null;

  const getStatusColor = (lesson: LessonWithOptionalStudent) => {
    const status = getLessonStatus(lesson);
    const isBackdate = new Date(lesson.date) < new Date();
    
    // Для занятий задним числом добавляем специальную индикацию
    if (isBackdate) {
      switch (status) {
        case 'scheduled': return 'bg-orange-100 text-orange-800 border-orange-300 border-l-4';
        case 'prepaid': return 'bg-yellow-100 text-yellow-800 border-yellow-300 border-l-4';
        case 'cancelled': return 'bg-red-100 text-red-800 border-red-300 border-l-4';
        case 'completed': return 'bg-green-100 text-green-800 border-green-300 border-l-4';
        case 'debt': return 'bg-orange-100 text-orange-800 border-orange-300 border-l-4';
        case 'unpaid': return 'bg-gray-100 text-gray-800 border-gray-300 border-l-4';
        default: return 'bg-gray-100 text-gray-800 border-gray-300 border-l-4';
      }
    }
    
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'prepaid': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'debt': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'unpaid': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (lesson: LessonWithOptionalStudent) => {
    const status = getLessonStatus(lesson);
    switch (status) {
      case 'scheduled': return <Calendar className="w-4 h-4" />;
      case 'prepaid': return <CreditCard className="w-4 h-4" />;
      case 'cancelled': return <AlertCircle className="w-4 h-4" />;
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      case 'debt': return <AlertTriangle className="w-4 h-4" />;
      case 'unpaid': return <Clock className="w-4 h-4" />;
      default: return <Calendar className="w-4 h-4" />;
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
    
    // Группировка групповых занятий
    const groupedLessons = new Map<string, LessonWithOptionalStudent[]>();
    const individualLessons: LessonWithOptionalStudent[] = [];
    
    filtered.forEach(lesson => {
      if (lesson.lessonType === 'group') {
        // Создаем ключ для группировки по времени и типу занятия
        const timeKey = `${new Date(lesson.date).getTime()}-${lesson.lessonType}`;
        if (!groupedLessons.has(timeKey)) {
          groupedLessons.set(timeKey, []);
        }
        groupedLessons.get(timeKey)!.push(lesson);
      } else {
        individualLessons.push(lesson);
      }
    });
    
    // Объединяем групповые занятия в один элемент
    const processedLessons: LessonWithOptionalStudent[] = [];
    
    // Добавляем групповые занятия как объединенные
    groupedLessons.forEach(groupLessons => {
      if (groupLessons.length > 0) {
        const firstLesson = groupLessons[0];
        // Создаем "виртуальное" занятие для отображения группы
        const groupLesson: LessonWithOptionalStudent = {
          ...firstLesson,
          id: firstLesson.id, // Используем ID первого занятия
          student: {
            ...firstLesson.student!,
            fullName: `Группа (${groupLessons.length} чел.)`
          }
        };
        processedLessons.push(groupLesson);
      }
    });
    
    // Добавляем индивидуальные занятия
    processedLessons.push(...individualLessons);
    
    // Сортировка
    return processedLessons.sort((a, b) => {
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

  const modalTitle = (
    <div className="flex-1">
      <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
        <Calendar className="w-5 h-5 text-blue-600" />
        {date.toLocaleDateString('ru-RU', { 
          day: 'numeric', 
          month: 'long', 
          weekday: 'long',
          year: 'numeric'
        })}
      </h2>
      {lessons.length > 0 && (
        <p className="text-sm text-gray-600 mt-1">
          {lessons.length} занят{lessons.length === 1 ? 'ие' : lessons.length < 5 ? 'ия' : 'ий'} • 
          {Math.round(lessons.reduce((total, lesson) => {
            if (lesson.endTime) {
              const duration = new Date(lesson.endTime).getTime() - new Date(lesson.date).getTime();
              return total + duration;
            }
            return total;
          }, 0) / (1000 * 60 * 60) * 10) / 10}ч
          {date < new Date() && (
            <span className="inline-flex items-center gap-1 ml-2 px-2 py-0.5 text-xs bg-orange-100 text-orange-800 rounded-full">
              <History className="w-3 h-3" />
              Задним числом
            </span>
          )}
        </p>
      )}
    </div>
  );

  const modalFooter = (
    <div className="flex justify-between items-center">
      <div className="flex items-center gap-4">
        {userRole === 'ADMIN' && (
          <button
            onClick={() => {
              // Здесь можно добавить логику для добавления нового занятия
              onClose();
            }}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium text-sm"
          >
            <span className="text-lg">+</span>
            Добавить занятие
          </button>
        )}
        <div className="text-sm text-gray-600">
          {lessons.length > 0 && (
            <span>
              Всего занятий: {lessons.length}
              {sortedLessons.length !== lessons.length && ` • Показано: ${sortedLessons.length}`}
            </span>
          )}
        </div>
      </div>
      <button
        onClick={onClose}
        className="px-4 py-2.5 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
      >
        Закрыть
      </button>
    </div>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={modalTitle}
      size="full"
      footer={modalFooter}
      className="modal-mobile"
    >


      {/* Компонент выбора времени обеда */}
      <ModalSection className="border-b border-gray-100">
        <LunchTimeSelector 
          date={date}
          existingLessons={lessons}
          userRole={userRole}
        />
      </ModalSection>

      {lessons.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-20 h-20 bg-gradient-to-br from-gray-50 to-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Clock className="w-10 h-10 text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Свободный день</h3>
          <p className="text-gray-600 mb-8">
            На эту дату не запланировано занятий
          </p>
          <div className="bg-gradient-to-br from-gray-50 to-gray-50/50 rounded-xl p-6 max-w-md mx-auto border border-gray-100">
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
        <div className="p-6">
          <div className="overflow-x-auto -mx-6">
            <table className="w-full">
              <thead className="bg-gray-50 border-y border-gray-100">
                <tr>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => handleSort('time')}
                  >
                    <div className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5" />
                      Время
                      <ArrowUpDown className="w-3 h-3 text-gray-400" />
                    </div>
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => handleSort('student')}
                  >
                    <div className="flex items-center gap-2">
                      <Users className="w-3.5 h-3.5" />
                      Ученик
                      <ArrowUpDown className="w-3 h-3 text-gray-400" />
                    </div>
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => handleSort('cost')}
                  >
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-3.5 h-3.5" />
                      Стоимость
                      <ArrowUpDown className="w-3 h-3 text-gray-400" />
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Статус
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {sortedLessons.map((lesson) => {
                  const status = getLessonStatus(lesson);
                  const isBackdate = new Date(lesson.date) < new Date();
                  
                  return (
                    <tr 
                      key={lesson.id}
                      className={`hover:bg-gray-50 cursor-pointer transition-all duration-150 ${getStatusColor(lesson).includes('red') ? 'hover:bg-red-50' : ''}`}
                      onClick={() => {
                        // Для групповых занятий передаем все занятия группы
                        if (lesson.lessonType === 'group') {
                          const groupLessons = lessons.filter(l => 
                            l.lessonType === 'group' && 
                            new Date(l.date).getTime() === new Date(lesson.date).getTime()
                          );
                          // Передаем первое занятие группы, но с информацией о том, что это группа
                          onLessonClick({...lesson, groupLessons});
                        } else {
                          onLessonClick(lesson);
                        }
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
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className={`h-10 w-10 rounded-full flex items-center justify-center ring-2 ring-offset-2 ${
                              lesson.lessonType === 'group' 
                                ? 'bg-purple-100 text-purple-800 ring-purple-200' 
                                : 'bg-blue-100 text-blue-800 ring-blue-200'
                            }`}>
                              <span className="text-sm font-semibold">
                                {lesson.lessonType === 'group' 
                                  ? <Users className="w-5 h-5" />
                                  : (lesson.student?.fullName || `#${lesson.studentId}`).charAt(0).toUpperCase()
                                }
                              </span>
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {lesson.student?.fullName || `Ученик #${lesson.studentId}`}
                            </div>
                            <div className="text-xs text-gray-500">
                              {getLessonTypeText(lesson.lessonType || 'individual')}
                              {lesson.lessonType === 'group' && (
                                <span className="ml-1 text-purple-600 font-medium">
                                  • {lessons.filter(l => 
                                      l.lessonType === 'group' && 
                                      new Date(l.date).getTime() === new Date(lesson.date).getTime()
                                    ).length} участников
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-semibold text-gray-900">
                          {lesson.cost.toLocaleString()} ₸
                        </div>
                        {lesson.endTime && (
                          <div className="text-xs text-gray-500">
                            {formatDuration(lesson.date, lesson.endTime)}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${getStatusBadgeColor(status)}`}>
                            {getStatusIcon(lesson)}
                            {getLessonStatusText(status)}
                          </span>
                          {lesson.notes && (
                            <span className="text-gray-400 hover:text-gray-600" title={lesson.notes}>
                              📝
                            </span>
                          )}
                          {(lesson as any).comment && (
                            <span className="text-gray-400 hover:text-gray-600" title={(lesson as any).comment}>
                              💬
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </Modal>
  );
}
