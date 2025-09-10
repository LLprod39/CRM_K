'use client';

import { useState, useEffect } from 'react';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { useToast } from '@/hooks/useToast';

interface LessonSuggestionsProps {
  studentId: number;
}

interface LessonPlan {
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
  const { success, error: showError } = useToast();

  useEffect(() => {
    loadSavedSuggestions();
  }, [studentId]);

  const generateSuggestions = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/ai/lesson-suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId })
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
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-semibold">Предложения занятий от ИИ</h3>
        <div className="flex gap-2">
          <Button 
            onClick={loadSavedSuggestions}
            disabled={loadingSaved}
            className="bg-gray-600 hover:bg-gray-700 disabled:opacity-50"
          >
            {loadingSaved ? 'Загрузка...' : 'Обновить'}
          </Button>
          <Button 
            onClick={generateSuggestions}
            disabled={loading}
            className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50"
          >
            {loading ? 'Генерация...' : 'Сгенерировать план'}
          </Button>
        </div>
      </div>

      {studentInfo && (
        <div className="mb-4 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-medium mb-2">Информация об ученике:</h4>
          <p><strong>ФИО:</strong> {studentInfo.fullName}</p>
          <p><strong>Возраст:</strong> {studentInfo.age} лет</p>
          {studentInfo.diagnosis && (
            <p><strong>Диагноз:</strong> {studentInfo.diagnosis}</p>
          )}
          {studentInfo.comment && (
            <p><strong>Комментарий:</strong> {studentInfo.comment}</p>
          )}
          <p><strong>Доступно игрушек:</strong> {availableToysCount}</p>
        </div>
      )}

      {/* Сохраненные предложения */}
      {savedSuggestions.length > 0 && (
        <div className="mb-6">
          <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Сохраненные предложения ({savedSuggestions.length})
          </h4>
          <div className="space-y-3">
            {savedSuggestions.map((savedSuggestion, index) => (
              <div key={index} className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h5 className="font-medium text-gray-900">{savedSuggestion.title}</h5>
                    <p className="text-sm text-gray-600">
                      {savedSuggestion.duration} • {new Date().toLocaleDateString('ru-RU')}
                    </p>
                  </div>
                  <Button
                    onClick={() => printSuggestion(savedSuggestion)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 text-sm"
                  >
                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5 4v3H4a2 2 0 00-2 2v3a2 2 0 002 2h1v2a2 2 0 002 2h6a2 2 0 002-2v-2h1a2 2 0 002-2V9a2 2 0 00-2-2h-1V4a2 2 0 00-2-2H7a2 2 0 00-2 2zm8 0H7v3h6V4zm0 8H7v4h6v-4z" clipRule="evenodd" />
                    </svg>
                    Печать
                  </Button>
                </div>
                <div className="text-sm text-gray-700">
                  <p><strong>Цели:</strong> {savedSuggestion.goals.slice(0, 2).join(', ')}...</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {suggestions && (
        <div className="mt-4 space-y-6">
          {/* Кнопка печати для текущего предложения */}
          <div className="flex justify-end">
            <Button
              onClick={() => printSuggestion(suggestions)}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5 4v3H4a2 2 0 00-2 2v3a2 2 0 002 2h1v2a2 2 0 002 2h6a2 2 0 002-2v-2h1a2 2 0 002-2V9a2 2 0 00-2-2h-1V4a2 2 0 00-2-2H7a2 2 0 00-2 2zm8 0H7v3h6V4zm0 8H7v4h6v-4z" clipRule="evenodd" />
              </svg>
              Распечатать план
            </Button>
          </div>
          {/* Заголовок и основная информация */}
          <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-4">
            <h3 className="text-xl font-bold text-gray-900 mb-2">{suggestions.title}</h3>
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <span className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                </svg>
                {suggestions.duration}
              </span>
            </div>
          </div>

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
        </div>
      )}

      {!suggestions && !loading && (
        <div className="text-center py-8 text-gray-500">
          <p>Нажмите "Сгенерировать план" для получения предложений занятий</p>
          <p className="text-sm mt-2">
            ИИ проанализирует данные ученика, историю занятий и доступные игрушки
          </p>
        </div>
      )}
    </Card>
  );
}
