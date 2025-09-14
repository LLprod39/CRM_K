'use client';

import { useState, useEffect } from 'react';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { useToast } from '@/presentation/hooks';
import { apiRequest } from '@/lib/api';
import { X, Calendar, Clock, ChevronDown, ChevronUp, User, DollarSign, MessageSquare } from 'lucide-react';
import { formatTime, formatDate, calculateDuration } from '@/lib/timeUtils';

interface LessonSuggestionsProps {
  studentId: number;
}

interface LessonPlan {
  id?: number;
  title: string;
  duration: string;
  goals: string[];
  materials: Array<{
    name: string;
    category: string;
    description: string;
  }>;
  structure: {
    warmup: {
      duration: string;
      activities: string[];
    };
    main: {
      duration: string;
      activities: string[];
    };
    conclusion: {
      duration: string;
      activities: string[];
    };
  };
  recommendations: string[];
  expectedResults: string[];
  notes: string;
}

interface Lesson {
  id: number;
  date: Date | string;
  endTime?: Date | string;
  cost: number;
  notes?: string | null;
  lessonType?: string;
  location?: string;
  isCompleted: boolean;
  isPaid: boolean;
  isCancelled: boolean;
}

interface SuggestionsResponse {
  suggestions: LessonPlan;
  student: {
    fullName: string;
    age: number;
    diagnosis?: string;
    comment?: string;
  };
  availableToys: number;
}

export default function LessonSuggestions({ studentId }: LessonSuggestionsProps) {
  const [suggestions, setSuggestions] = useState<LessonPlan | null>(null);
  const [savedSuggestions, setSavedSuggestions] = useState<LessonPlan[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingSaved, setLoadingSaved] = useState(false);
  const [studentInfo, setStudentInfo] = useState<SuggestionsResponse['student'] | null>(null);
  const [availableToysCount, setAvailableToysCount] = useState(0);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [upcomingLessons, setUpcomingLessons] = useState<Lesson[]>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [loadingLessons, setLoadingLessons] = useState(false);
  const [existingPlanForLesson, setExistingPlanForLesson] = useState<LessonPlan | null>(null);
  const [showRegenerateConfirm, setShowRegenerateConfirm] = useState(false);
  const [isPlanExpanded, setIsPlanExpanded] = useState(true);
  const [expandedSavedIndex, setExpandedSavedIndex] = useState<number | null>(null);
  const [lessonSortBy, setLessonSortBy] = useState<'date' | 'cost' | 'duration'>('date');
  const [lessonFilter, setLessonFilter] = useState<'all' | 'withPlan' | 'withoutPlan'>('all');
  const { success, error: showError } = useToast();

  useEffect(() => {
    loadSavedSuggestions();
  }, [studentId]);

  const fetchUpcomingLessons = async () => {
    setLoadingLessons(true);
    try {
      const response = await apiRequest(`/api/lessons/upcoming?studentId=${studentId}`);
      if (response.ok) {
        const data = await response.json();
        setUpcomingLessons(data);
      } else {
        const errorData = await response.json();
        showError(errorData.error || 'Ошибка при загрузке занятий');
      }
    } catch (error) {
      console.error('Ошибка при загрузке предстоящих занятий:', error);
      showError('Ошибка при загрузке занятий');
    } finally {
      setLoadingLessons(false);
    }
  };

  const generateSuggestions = async () => {
    console.log('generateSuggestions вызвана, selectedLesson:', selectedLesson);
    if (!selectedLesson) {
      console.log('Нет выбранного занятия, выходим');
      return;
    }

    console.log('Начинаем генерацию плана для занятия:', selectedLesson.id);
    setLoading(true);
    try {
      const response = await fetch('/api/ai/lesson-suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          studentId, 
          lessonId: selectedLesson.id 
        })
      });

      if (response.ok) {
        const data: SuggestionsResponse = await response.json();
        setSuggestions(data.suggestions);
        setStudentInfo(data.student);
        setAvailableToysCount(data.availableToys);
        success('Предложения занятий сгенерированы');
        // Обновляем список сохраненных предложений
        loadSavedSuggestions();
      } else {
        const error = await response.json();
        showError(error.error || 'Ошибка при генерации предложений');
      }
    } catch (error) {
      showError('Ошибка при генерации предложений');
    } finally {
      setLoading(false);
    }
  };

  const openLessonSelection = async () => {
    await fetchUpcomingLessons();
    setIsDropdownOpen(true);
  };

  const handleSelectLesson = (lesson: Lesson) => {
    console.log('Выбрано занятие:', lesson);
    setSelectedLesson(lesson);
    setIsDropdownOpen(false);
    // Убираем автоматическую генерацию - теперь она будет происходить только при клике на кнопку "Выбор"
  };


  const handleRegeneratePlan = async () => {
    setShowRegenerateConfirm(false);
    setExistingPlanForLesson(null);
    await generateSuggestions();
  };

  const handleDeletePlan = async () => {
    if (!suggestions || !suggestions.id) return;
    
    try {
      const response = await fetch(`/api/ai/suggestions/delete/${suggestions.id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setSuggestions(null);
        setStudentInfo(null);
        success('План удален');
        // Обновляем список сохраненных предложений
        loadSavedSuggestions();
      } else {
        const error = await response.json();
        showError(error.error || 'Ошибка при удалении плана');
      }
    } catch (error) {
      showError('Ошибка при удалении плана');
    }
  };

  const handleDeleteSavedPlan = async (index: number) => {
    const planToDelete = savedSuggestions[index];
    if (!planToDelete || !planToDelete.id) return;

    try {
      const response = await fetch(`/api/ai/suggestions/delete/${planToDelete.id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        const updatedSuggestions = savedSuggestions.filter((_, i) => i !== index);
        setSavedSuggestions(updatedSuggestions);
        success('Сохраненный план удален');
      } else {
        const error = await response.json();
        showError(error.error || 'Ошибка при удалении сохраненного плана');
      }
    } catch (error) {
      showError('Ошибка при удалении сохраненного плана');
    }
  };

  const handleRemoveSelectedLesson = () => {
    setSelectedLesson(null);
    setSuggestions(null);
    setStudentInfo(null);
    setLoading(false);
  };

  const loadSavedSuggestions = async () => {
    setLoadingSaved(true);
    try {
      const response = await fetch(`/api/ai/suggestions/${studentId}`);
      if (response.ok) {
        const data = await response.json();
        setSavedSuggestions(data);
      }
    } catch (error) {
      console.error('Ошибка при загрузке сохраненных предложений:', error);
    } finally {
      setLoadingSaved(false);
    }
  };

  // Функции для фильтрации и сортировки занятий
  const getFilteredAndSortedLessons = () => {
    let filtered = upcomingLessons;

    // Фильтрация
    if (lessonFilter === 'withPlan') {
      filtered = upcomingLessons.filter(lesson => {
        return savedSuggestions.some(plan => {
          const lessonIdStr = lesson.id.toString();
          return plan.notes?.includes(`Занятие #${lessonIdStr}`) || 
                 plan.notes?.includes(`lessonId:${lessonIdStr}`) ||
                 plan.title.includes(`Занятие ${lessonIdStr}`) ||
                 plan.title.includes(`#${lessonIdStr}`);
        });
      });
    } else if (lessonFilter === 'withoutPlan') {
      filtered = upcomingLessons.filter(lesson => {
        return !savedSuggestions.some(plan => {
          const lessonIdStr = lesson.id.toString();
          return plan.notes?.includes(`Занятие #${lessonIdStr}`) || 
                 plan.notes?.includes(`lessonId:${lessonIdStr}`) ||
                 plan.title.includes(`Занятие ${lessonIdStr}`) ||
                 plan.title.includes(`#${lessonIdStr}`);
        });
      });
    }

    // Сортировка
    return filtered.sort((a, b) => {
      switch (lessonSortBy) {
        case 'date':
          return new Date(a.date).getTime() - new Date(b.date).getTime();
        case 'cost':
          return b.cost - a.cost;
        case 'duration':
          const aDuration = a.endTime ? 
            new Date(a.endTime).getTime() - new Date(a.date).getTime() : 0;
          const bDuration = b.endTime ? 
            new Date(b.endTime).getTime() - new Date(b.date).getTime() : 0;
          return bDuration - aDuration;
        default:
          return 0;
      }
    });
  };

  const printSuggestion = (suggestion: LessonPlan) => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>План занятия - ${suggestion.title}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
            .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px; }
            .section { margin-bottom: 25px; }
            .section h3 { color: #333; border-left: 4px solid #007bff; padding-left: 10px; }
            .goals, .materials, .recommendations, .results { margin-left: 20px; }
            .structure { display: flex; gap: 20px; margin-top: 15px; }
            .structure-item { flex: 1; border: 1px solid #ddd; padding: 15px; border-radius: 5px; }
            .warmup { background-color: #fff3cd; }
            .main { background-color: #d4edda; }
            .conclusion { background-color: #cce7ff; }
            .duration { font-weight: bold; color: #666; }
            @media print { body { margin: 0; } }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>${suggestion.title}</h1>
            <p><strong>Продолжительность:</strong> ${suggestion.duration}</p>
            <p><strong>Дата создания:</strong> ${new Date().toLocaleDateString('ru-RU')}</p>
          </div>
          
          <div class="section">
            <h3>Цели и задачи</h3>
            <ul class="goals">
              ${suggestion.goals.map(goal => `<li>${goal}</li>`).join('')}
            </ul>
          </div>
          
          ${suggestion.materials.length > 0 ? `
          <div class="section">
            <h3>Материалы и игрушки</h3>
            <ul class="materials">
              ${suggestion.materials.map(material => 
                `<li><strong>${material.name}</strong> (${material.category}): ${material.description}</li>`
              ).join('')}
            </ul>
          </div>
          ` : ''}
          
          <div class="section">
            <h3>Структура занятия</h3>
            <div class="structure">
              <div class="structure-item warmup">
                <h4>Разминка</h4>
                <p class="duration">${suggestion.structure.warmup.duration}</p>
                <ul>
                  ${suggestion.structure.warmup.activities.map(activity => `<li>${activity}</li>`).join('')}
                </ul>
              </div>
              <div class="structure-item main">
                <h4>Основная часть</h4>
                <p class="duration">${suggestion.structure.main.duration}</p>
                <ul>
                  ${suggestion.structure.main.activities.map(activity => `<li>${activity}</li>`).join('')}
                </ul>
              </div>
              <div class="structure-item conclusion">
                <h4>Заключение</h4>
                <p class="duration">${suggestion.structure.conclusion.duration}</p>
                <ul>
                  ${suggestion.structure.conclusion.activities.map(activity => `<li>${activity}</li>`).join('')}
                </ul>
              </div>
            </div>
          </div>
          
          ${suggestion.recommendations.length > 0 ? `
          <div class="section">
            <h3>Рекомендации</h3>
            <ul class="recommendations">
              ${suggestion.recommendations.map(rec => `<li>${rec}</li>`).join('')}
            </ul>
          </div>
          ` : ''}
          
          ${suggestion.expectedResults.length > 0 ? `
          <div class="section">
            <h3>Ожидаемые результаты</h3>
            <ul class="results">
              ${suggestion.expectedResults.map(result => `<li>${result}</li>`).join('')}
            </ul>
          </div>
          ` : ''}
          
          ${suggestion.notes ? `
          <div class="section">
            <h3>Дополнительные заметки</h3>
            <p>${suggestion.notes}</p>
          </div>
          ` : ''}
        </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  return (
    <Card className="p-6">
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center mb-6 gap-4">
        <div className="flex-1">
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Предложения занятий от ИИ</h3>
          <p className="text-sm text-gray-600">
            Генерация персонализированного плана занятия на основе данных ученика
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Button 
            onClick={loadSavedSuggestions}
            disabled={loadingSaved}
            variant="secondary"
            size="md"
            loading={loadingSaved}
          >
            {loadingSaved ? 'Обновление...' : 'Обновить'}
          </Button>
          <Button 
            onClick={openLessonSelection}
            disabled={loading}
            variant="primary"
            size="md"
            loading={loading}
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Генерация...</span>
              </div>
            ) : selectedLesson ? 'Выбрать другое занятие' : 'Выбрать занятие'}
          </Button>
        </div>
      </div>

      {studentInfo && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <h4 className="text-sm font-medium text-gray-900 mb-3">Информация об ученике</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-gray-600">ФИО:</span>
              <p className="font-medium text-gray-900">{studentInfo.fullName}</p>
            </div>
            <div>
              <span className="text-gray-600">Возраст:</span>
              <p className="font-medium text-gray-900">{studentInfo.age} лет</p>
            </div>
            {studentInfo.diagnosis && (
              <div>
                <span className="text-gray-600">Диагноз:</span>
                <p className="font-medium text-gray-900">{studentInfo.diagnosis}</p>
              </div>
            )}
            <div>
              <span className="text-gray-600">Игрушки:</span>
              <p className="font-medium text-gray-900">{availableToysCount}</p>
            </div>
          </div>
        </div>
      )}

      {selectedLesson && (
        <div className="mb-6 p-4 bg-green-50 rounded-lg border border-green-200">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="text-sm font-medium text-gray-900">Выбранное занятие</h4>
              {loading && (
                <div className="flex items-center gap-2 mt-2">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                  </div>
                  <span className="text-xs text-green-600 font-medium">Генерируется план занятия...</span>
                </div>
              )}
            </div>
            <Button
              onClick={handleRemoveSelectedLesson}
              variant="ghost"
              size="sm"
              icon={<X className="w-4 h-4" />}
            >
              Отменить
            </Button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Дата:</span>
              <p className="font-medium text-gray-900">
                {new Date(selectedLesson.date).toLocaleDateString('ru-RU', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric'
                })}
              </p>
            </div>
            <div>
              <span className="text-gray-600">Время:</span>
              <p className="font-medium text-gray-900">
                {new Date(selectedLesson.date).toLocaleTimeString('ru-RU', {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
                {selectedLesson.endTime && ` - ${new Date(selectedLesson.endTime).toLocaleTimeString('ru-RU', {
                  hour: '2-digit',
                  minute: '2-digit'
                })}`}
              </p>
            </div>
            <div>
              <span className="text-gray-600">Стоимость:</span>
              <p className="font-medium text-gray-900">{selectedLesson.cost.toLocaleString()} ₸</p>
            </div>
            {selectedLesson.endTime && (
              <div>
                <span className="text-gray-600">Продолжительность:</span>
                <p className="font-medium text-gray-900">
                  {Math.round((new Date(selectedLesson.endTime).getTime() - new Date(selectedLesson.date).getTime()) / (1000 * 60))} мин
                </p>
              </div>
            )}
          </div>
          {selectedLesson.notes && (
            <div className="mt-3 pt-3 border-t border-green-200">
              <span className="text-xs text-gray-600">Заметки:</span>
              <p className="text-sm text-gray-900 mt-1">{selectedLesson.notes}</p>
            </div>
          )}
        </div>
      )}

      {/* Выпадающий список занятий */}
      {isDropdownOpen && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-medium text-gray-900">Выберите занятие для генерации плана</h4>
            <button
              onClick={() => setIsDropdownOpen(false)}
              className="p-1 text-gray-400 hover:text-gray-600 rounded"
              title="Закрыть список занятий"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          
          {loadingLessons ? (
            <div className="flex items-center justify-center py-8">
              <div className="flex items-center gap-3">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-600"></div>
                <span className="text-sm text-gray-600">Загрузка занятий...</span>
              </div>
            </div>
          ) : upcomingLessons.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="mx-auto h-16 w-16 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Нет предстоящих занятий
              </h3>
              <p className="text-gray-500 mb-4">
                У этого ученика нет запланированных занятий в будущем.
              </p>
              <button
                onClick={() => setIsDropdownOpen(false)}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Закрыть
              </button>
            </div>
          ) : (
            <>
              {/* Панель фильтров и сортировки */}
              <div className="flex flex-col sm:flex-row gap-3 mb-4">
                <select
                  value={lessonFilter}
                  onChange={(e) => setLessonFilter(e.target.value as any)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-sm"
                >
                  <option value="all">Все занятия</option>
                  <option value="withoutPlan">Без плана</option>
                  <option value="withPlan">С планом</option>
                </select>
                <select
                  value={lessonSortBy}
                  onChange={(e) => setLessonSortBy(e.target.value as any)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-sm"
                >
                  <option value="date">По дате</option>
                  <option value="cost">По стоимости</option>
                  <option value="duration">По продолжительности</option>
                </select>
                <div className="text-sm text-gray-600 bg-gray-100 px-3 py-2 rounded-lg self-center">
                  Найдено: {getFilteredAndSortedLessons().length}
                </div>
              </div>

              <div className="space-y-4 max-h-96 overflow-y-auto">
              {getFilteredAndSortedLessons().length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Calendar className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {lessonFilter === 'withPlan' ? 'Нет занятий с планами' : 
                     lessonFilter === 'withoutPlan' ? 'Нет занятий без планов' : 
                     'Нет занятий'}
                  </h3>
                  <p className="text-gray-500 mb-4">
                    {lessonFilter === 'withPlan' ? 'Все занятия уже имеют созданные планы' : 
                     lessonFilter === 'withoutPlan' ? 'Все занятия уже имеют планы' : 
                     'Попробуйте изменить фильтры'}
                  </p>
                  <Button
                    onClick={() => setLessonFilter('all')}
                    variant="secondary"
                    size="md"
                  >
                    Сбросить фильтры
                  </Button>
                </div>
              ) : (
                getFilteredAndSortedLessons().map((lesson) => {
                // Проверяем, есть ли план для этого занятия
                const hasExistingPlan = savedSuggestions.some(plan => {
                  const lessonIdStr = lesson.id.toString();
                  return plan.notes?.includes(`Занятие #${lessonIdStr}`) || 
                         plan.notes?.includes(`lessonId:${lessonIdStr}`) ||
                         plan.title.includes(`Занятие ${lessonIdStr}`) ||
                         plan.title.includes(`#${lessonIdStr}`);
                });

                return (
                  <div
                    key={lesson.id}
                    className={`p-4 border rounded-lg transition-colors bg-white ${
                      hasExistingPlan 
                        ? 'border-green-200 bg-green-50' 
                        : 'border-gray-200'
                    }`}
                  >
                    
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-medium text-gray-900 text-sm">
                            {formatDate(lesson.date, {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric'
                            })}
                          </h4>
                          <span className="text-gray-500">
                            {formatTime(lesson.date)}
                          </span>
                          {hasExistingPlan && (
                            <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                              План создан
                            </span>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span>{lesson.cost.toLocaleString()} ₸</span>
                          {lesson.endTime && (
                            <span>
                              {calculateDuration(lesson.date, lesson.endTime)} мин
                            </span>
                          )}
                          {lesson.lessonType && <span>{lesson.lessonType}</span>}
                          {lesson.location && <span>{lesson.location}</span>}
                        </div>
                        {lesson.notes && (
                          <p className="text-xs text-gray-500 mt-2">{lesson.notes}</p>
                        )}
                      </div>
                      
                      <div className="flex-shrink-0">
                        <Button
                          variant={hasExistingPlan ? "success" : "primary"}
                          size="sm"
                          onClick={async (e) => {
                            e.stopPropagation(); // Предотвращаем всплытие события
                            
                            // Сначала устанавливаем выбранное занятие
                            console.log('Выбрано занятие:', lesson);
                            setSelectedLesson(lesson);
                            setIsDropdownOpen(false);
                            
                            // Проверяем, есть ли уже план для этого занятия
                            const existingPlan = savedSuggestions.find(plan => {
                              const lessonIdStr = lesson.id.toString();
                              return plan.notes?.includes(`Занятие #${lessonIdStr}`) || 
                                     plan.notes?.includes(`lessonId:${lessonIdStr}`) ||
                                     plan.title.includes(`Занятие ${lessonIdStr}`) ||
                                     plan.title.includes(`#${lessonIdStr}`);
                            });
                            
                            if (existingPlan) {
                              setExistingPlanForLesson(existingPlan);
                              setShowRegenerateConfirm(true);
                              return;
                            }
                            
                            // Запускаем генерацию плана
                            console.log('Запускаем генерацию плана для занятия:', lesson.id);
                            setLoading(true);
                            try {
                              const response = await fetch('/api/ai/lesson-suggestions', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ 
                                  studentId, 
                                  lessonId: lesson.id 
                                })
                              });

                              if (response.ok) {
                                const data: SuggestionsResponse = await response.json();
                                setSuggestions(data.suggestions);
                                setStudentInfo(data.student);
                                setAvailableToysCount(data.availableToys);
                                success('Предложения занятий сгенерированы');
                                // Обновляем список сохраненных предложений
                                loadSavedSuggestions();
                              } else {
                                const error = await response.json();
                                showError(error.error || 'Ошибка при генерации предложений');
                              }
                            } catch (error) {
                              showError('Ошибка при генерации предложений');
                            } finally {
                              setLoading(false);
                            }
                          }}
                        >
                          {hasExistingPlan ? 'Обновить' : 'Выбрать'}
                        </Button>
                      </div>
                    </div>
                  </div>
                );
                })
              )}
            </div>
            </>
          )}
        </div>
      )}

      {/* Сохраненные предложения */}
      {savedSuggestions.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h4 className="text-xl font-bold text-gray-900">Сохраненные предложения</h4>
              <p className="text-sm text-gray-600 mt-1">
                {savedSuggestions.length} {savedSuggestions.length === 1 ? 'план' : savedSuggestions.length < 5 ? 'плана' : 'планов'} занятий
              </p>
            </div>
          </div>
          <div className="grid gap-4">
            {savedSuggestions.map((savedSuggestion, index) => (
              <div key={index} className="group bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-2xl p-6 hover:shadow-lg transition-all duration-300 hover:scale-[1.01]">
                <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-4 mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0">
                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h5 className="font-bold text-gray-900 text-base sm:text-lg truncate">{savedSuggestion.title}</h5>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mt-1">
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-blue-600 flex-shrink-0" />
                            <span className="text-xs sm:text-sm font-medium text-blue-700">
                              {savedSuggestion.duration}
                            </span>
                          </div>
                          <span className="hidden sm:inline text-gray-400">•</span>
                          <span className="text-xs sm:text-sm text-gray-600">
                            {new Date().toLocaleDateString('ru-RU')}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="bg-white/70 rounded-xl p-3 border border-blue-100">
                      <p className="text-xs sm:text-sm text-gray-700 leading-relaxed">
                        <span className="font-semibold text-gray-900">Цели:</span> {savedSuggestion.goals.slice(0, 2).join(', ')}
                        {savedSuggestion.goals.length > 2 && '...'}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                    <Button
                      onClick={() => setExpandedSavedIndex(expandedSavedIndex === index ? null : index)}
                      variant="secondary"
                      size="md"
                      className="w-full sm:w-auto"
                      icon={
                        expandedSavedIndex === index ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )
                      }
                    >
                      <span className="hidden sm:inline">
                        {expandedSavedIndex === index ? 'Свернуть' : 'Развернуть'}
                      </span>
                      <span className="sm:hidden">
                        {expandedSavedIndex === index ? 'Свернуть' : 'Подробнее'}
                      </span>
                    </Button>
                    <Button
                      onClick={() => handleDeleteSavedPlan(index)}
                      variant="destructive"
                      size="md"
                      className="w-full sm:w-auto"
                      icon={<X className="w-4 h-4" />}
                    >
                      Удалить
                    </Button>
                    <Button
                      onClick={() => printSuggestion(savedSuggestion)}
                      variant="info"
                      size="md"
                      className="w-full sm:w-auto"
                      icon={
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M5 4v3H4a2 2 0 00-2 2v3a2 2 0 002 2h1v2a2 2 0 002 2h6a2 2 0 002-2v-2h1a2 2 0 002-2V9a2 2 0 00-2-2h-1V4a2 2 0 00-2-2H7a2 2 0 00-2 2zm8 0H7v3h6V4zm0 8H7v4h6v-4z" clipRule="evenodd" />
                        </svg>
                      }
                    >
                      Печать
                    </Button>
                  </div>
                </div>
                
                {/* Детали сохраненного предложения */}
                <div className={`transition-all duration-300 ease-in-out ${
                  expandedSavedIndex === index ? 'opacity-100 max-h-none' : 'opacity-0 max-h-0 overflow-hidden'
                }`}>
                  {expandedSavedIndex === index && (
                    <div className="mt-4 space-y-4 pt-4 border-t border-blue-200">
                      {/* Цели */}
                      <div>
                        <h6 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                          <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          Цели и задачи
                        </h6>
                        <ul className="space-y-2">
                          {savedSuggestion.goals.map((goal, goalIndex) => (
                            <li key={goalIndex} className="flex items-start gap-2 text-base">
                              <span className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></span>
                              {goal}
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Материалы */}
                      {savedSuggestion.materials.length > 0 && (
                        <div>
                          <h6 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                            <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
                            </svg>
                            Материалы и игрушки
                          </h6>
                          <div className="grid gap-3">
                            {savedSuggestion.materials.map((material, materialIndex) => (
                              <div key={materialIndex} className="bg-blue-100 rounded-lg p-3">
                                <div className="font-medium text-gray-900 text-base">{material.name}</div>
                                {material.category && (
                                  <div className="text-sm text-blue-600 mb-1">{material.category}</div>
                                )}
                                <div className="text-sm text-gray-600">{material.description}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Структура занятия */}
                      <div>
                        <h6 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                          <svg className="w-4 h-4 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" clipRule="evenodd" />
                          </svg>
                          Структура занятия
                        </h6>
                        <div className="space-y-4">
                          {/* Разминка */}
                          <div className="bg-yellow-100 rounded-lg p-4">
                            <div className="flex items-center justify-between mb-2">
                              <h6 className="font-medium text-gray-900 text-base">Разминка</h6>
                              <span className="text-sm text-yellow-700 bg-yellow-200 px-2 py-1 rounded">
                                {savedSuggestion.structure.warmup.duration}
                              </span>
                            </div>
                            <ul className="space-y-2">
                              {savedSuggestion.structure.warmup.activities.map((activity, activityIndex) => (
                                <li key={activityIndex} className="text-sm text-gray-700">• {activity}</li>
                              ))}
                            </ul>
                          </div>

                          {/* Основная часть */}
                          <div className="bg-green-100 rounded-lg p-4">
                            <div className="flex items-center justify-between mb-2">
                              <h6 className="font-medium text-gray-900 text-base">Основная часть</h6>
                              <span className="text-sm text-green-700 bg-green-200 px-2 py-1 rounded">
                                {savedSuggestion.structure.main.duration}
                              </span>
                            </div>
                            <ul className="space-y-2">
                              {savedSuggestion.structure.main.activities.map((activity, activityIndex) => (
                                <li key={activityIndex} className="text-sm text-gray-700">• {activity}</li>
                              ))}
                            </ul>
                          </div>

                          {/* Заключение */}
                          <div className="bg-blue-100 rounded-lg p-4">
                            <div className="flex items-center justify-between mb-2">
                              <h6 className="font-medium text-gray-900 text-base">Заключение</h6>
                              <span className="text-sm text-blue-700 bg-blue-200 px-2 py-1 rounded">
                                {savedSuggestion.structure.conclusion.duration}
                              </span>
                            </div>
                            <ul className="space-y-2">
                              {savedSuggestion.structure.conclusion.activities.map((activity, activityIndex) => (
                                <li key={activityIndex} className="text-sm text-gray-700">• {activity}</li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>

                      {/* Рекомендации */}
                      {savedSuggestion.recommendations.length > 0 && (
                        <div>
                          <h6 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                            <svg className="w-4 h-4 text-orange-600" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                            </svg>
                            Рекомендации
                          </h6>
                          <ul className="space-y-2">
                            {savedSuggestion.recommendations.map((recommendation, recIndex) => (
                              <li key={recIndex} className="flex items-start gap-2 text-base bg-orange-100 p-3 rounded-lg">
                                <span className="w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0"></span>
                                {recommendation}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Ожидаемые результаты */}
                      {savedSuggestion.expectedResults.length > 0 && (
                        <div>
                          <h6 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                            <svg className="w-4 h-4 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            Ожидаемые результаты
                          </h6>
                          <ul className="space-y-2">
                            {savedSuggestion.expectedResults.map((result, resultIndex) => (
                              <li key={resultIndex} className="flex items-start gap-2 text-base bg-emerald-100 p-3 rounded-lg">
                                <span className="w-2 h-2 bg-emerald-500 rounded-full mt-2 flex-shrink-0"></span>
                                {result}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Дополнительные заметки */}
                      <div>
                        <h6 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                          <svg className="w-4 h-4 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                          </svg>
                          Дополнительные заметки
                        </h6>
                        <div className="bg-gray-100 rounded-lg p-4">
                          {savedSuggestion.notes && savedSuggestion.notes.trim() ? (
                            <p className="text-base text-gray-700 leading-relaxed">{savedSuggestion.notes}</p>
                          ) : (
                            <p className="text-base text-gray-500 italic">Заметки не указаны</p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {suggestions && (
        <div className="mt-4 space-y-6">
          {/* Кнопки для текущего предложения */}
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 p-6 bg-gradient-to-r from-gray-50 to-blue-50 rounded-2xl border border-gray-200">
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                onClick={handleDeletePlan}
                variant="destructive"
                size="lg"
                icon={<X className="w-4 h-4" />}
                className="shadow-lg hover:shadow-xl"
              >
                Удалить план
              </Button>
            </div>
            <Button
              onClick={() => printSuggestion(suggestions)}
              variant="success"
              size="lg"
              icon={
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5 4v3H4a2 2 0 00-2 2v3a2 2 0 002 2h1v2a2 2 0 002 2h6a2 2 0 002-2v-2h1a2 2 0 002-2V9a2 2 0 00-2-2h-1V4a2 2 0 00-2-2H7a2 2 0 00-2 2zm8 0H7v3h6V4zm0 8H7v4h6v-4z" clipRule="evenodd" />
                </svg>
              }
              className="shadow-lg hover:shadow-xl"
            >
              Распечатать план
            </Button>
          </div>
          {/* Заголовок и основная информация */}
          <div className="bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 rounded-2xl p-6 border-2 border-purple-200 shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                    <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">{suggestions.title}</h3>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-2 bg-white/70 px-3 py-1.5 rounded-lg border border-purple-200">
                        <svg className="w-4 h-4 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                        </svg>
                        <span className="font-semibold text-gray-900">{suggestions.duration}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <Button
                onClick={() => setIsPlanExpanded(!isPlanExpanded)}
                variant="secondary"
                size="lg"
                icon={
                  isPlanExpanded ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )
                }
                className="shadow-lg hover:shadow-xl"
              >
                {isPlanExpanded ? 'Свернуть' : 'Развернуть'}
              </Button>
            </div>
          </div>

          {/* Детали плана - показываются только когда развернут */}
          <div className={`transition-all duration-300 ease-in-out ${
            isPlanExpanded ? 'opacity-100 max-h-none' : 'opacity-0 max-h-0 overflow-hidden'
          }`}>
            {isPlanExpanded && (
              <div className="space-y-6">
                <>
              {/* Цели */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Цели и задачи
                </h4>
                <ul className="space-y-2">
                  {suggestions.goals.map((goal, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm">
                      <span className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></span>
                      {goal}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Материалы */}
              {suggestions.materials.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
                    </svg>
                    Материалы и игрушки
                  </h4>
                  <div className="grid gap-3">
                    {suggestions.materials.map((material, index) => (
                      <div key={index} className="bg-blue-50 rounded-lg p-3">
                        <div className="font-medium text-gray-900">{material.name}</div>
                        {material.category && (
                          <div className="text-xs text-blue-600 mb-1">{material.category}</div>
                        )}
                        <div className="text-sm text-gray-600">{material.description}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Структура занятия */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <svg className="w-5 h-5 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" clipRule="evenodd" />
                  </svg>
                  Структура занятия
                </h4>
                <div className="space-y-4">
                  {/* Разминка */}
                  <div className="bg-yellow-50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h5 className="font-medium text-gray-900">Разминка</h5>
                      <span className="text-sm text-yellow-700 bg-yellow-200 px-2 py-1 rounded">
                        {suggestions.structure.warmup.duration}
                      </span>
                    </div>
                    <ul className="space-y-1">
                      {suggestions.structure.warmup.activities.map((activity, index) => (
                        <li key={index} className="text-sm text-gray-700">• {activity}</li>
                      ))}
                    </ul>
                  </div>

                  {/* Основная часть */}
                  <div className="bg-green-50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h5 className="font-medium text-gray-900">Основная часть</h5>
                      <span className="text-sm text-green-700 bg-green-200 px-2 py-1 rounded">
                        {suggestions.structure.main.duration}
                      </span>
                    </div>
                    <ul className="space-y-1">
                      {suggestions.structure.main.activities.map((activity, index) => (
                        <li key={index} className="text-sm text-gray-700">• {activity}</li>
                      ))}
                    </ul>
                  </div>

                  {/* Заключение */}
                  <div className="bg-blue-50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h5 className="font-medium text-gray-900">Заключение</h5>
                      <span className="text-sm text-blue-700 bg-blue-200 px-2 py-1 rounded">
                        {suggestions.structure.conclusion.duration}
                      </span>
                    </div>
                    <ul className="space-y-1">
                      {suggestions.structure.conclusion.activities.map((activity, index) => (
                        <li key={index} className="text-sm text-gray-700">• {activity}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              {/* Рекомендации */}
              {suggestions.recommendations.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <svg className="w-5 h-5 text-orange-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    Рекомендации
                  </h4>
                  <ul className="space-y-2">
                    {suggestions.recommendations.map((recommendation, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm bg-orange-50 p-3 rounded-lg">
                        <span className="w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0"></span>
                        {recommendation}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Ожидаемые результаты */}
              {suggestions.expectedResults.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <svg className="w-5 h-5 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Ожидаемые результаты
                  </h4>
                  <ul className="space-y-2">
                    {suggestions.expectedResults.map((result, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm bg-emerald-50 p-3 rounded-lg">
                        <span className="w-2 h-2 bg-emerald-500 rounded-full mt-2 flex-shrink-0"></span>
                        {result}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Дополнительные заметки */}
              {suggestions.notes && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <svg className="w-5 h-5 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                    </svg>
                    Дополнительные заметки
                  </h4>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-700">{suggestions.notes}</p>
                  </div>
                </div>
              )}
                </>
              </div>
            )}
          </div>
        </div>
      )}

      {loading && !isDropdownOpen && (
        <div className="flex items-center justify-center py-16">
          <div className="text-center">
            {/* Анимированная иконка */}
            <div className="relative mb-6">
              <div className="w-16 h-16 mx-auto bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
                <svg className="w-8 h-8 text-white animate-pulse" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" clipRule="evenodd" />
                </svg>
              </div>
              {/* Вращающееся кольцо */}
              <div className="absolute inset-0 w-16 h-16 mx-auto">
                <div className="w-full h-full border-4 border-blue-200 rounded-full animate-spin border-t-blue-500"></div>
              </div>
            </div>
            
            {/* Текст загрузки */}
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Генерация плана занятия</h3>
            <p className="text-sm text-gray-600 mb-4">ИИ анализирует данные ученика и создает персонализированный план...</p>
            
            {/* Прогресс-бар */}
            <div className="w-64 mx-auto bg-gray-200 rounded-full h-2 overflow-hidden">
              <div className="h-full bg-gradient-to-r from-blue-500 to-purple-600 rounded-full animate-pulse"></div>
            </div>
            
            {/* Анимированные точки */}
            <div className="flex justify-center mt-4 space-x-1">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
              <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
            </div>
          </div>
        </div>
      )}

      {!suggestions && !loading && !isDropdownOpen && savedSuggestions.length === 0 && (
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Готовы создать план занятия?
          </h3>
          <p className="text-gray-600 mb-4">
            Нажмите &quot;Выбрать занятие&quot; - план сгенерируется автоматически
          </p>
        </div>
      )}

      {/* Модальное окно подтверждения перегенерации */}
      {showRegenerateConfirm && existingPlanForLesson && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">План уже существует</h3>
            
            <p className="text-gray-600 mb-4">
              Для выбранного занятия уже создан план: <strong>"{existingPlanForLesson.title}"</strong>
            </p>
            
            <p className="text-sm text-gray-500 mb-6">
              Хотите создать новый план? Старый план будет заменен.
            </p>
            
            <div className="flex gap-3 justify-end">
              <Button
                onClick={() => {
                  setShowRegenerateConfirm(false);
                  setExistingPlanForLesson(null);
                }}
                variant="secondary"
                size="md"
              >
                Отмена
              </Button>
              <Button
                onClick={handleRegeneratePlan}
                variant="warning"
                size="md"
              >
                Перегенерировать
              </Button>
            </div>
          </div>
        </div>
      )}

    </Card>
  );
}
