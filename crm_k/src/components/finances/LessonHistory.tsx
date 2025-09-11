'use client'

import { useState, useEffect } from 'react'
import { Calendar, Clock, User, CheckCircle, ChevronRight } from 'lucide-react'
import type { LessonWithStudent, Lesson } from '@/types'
import { getLessonStatus, getLessonStatusText } from '@/types'

export default function LessonHistory() {
  const [lessons, setLessons] = useState<LessonWithStudent[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    fetchLessonHistory()
  }, [])

  const fetchLessonHistory = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      const response = await fetch('/api/lessons', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })
      if (response.ok) {
        const data = await response.json()
        // Фильтруем только завершенные занятия (isCompleted)
        const completedLessons = data.filter((lesson: LessonWithStudent) => 
          lesson.isCompleted
        )
        // Сортируем по дате (новые сначала)
        completedLessons.sort((a: LessonWithStudent, b: LessonWithStudent) => 
          new Date(b.date).getTime() - new Date(a.date).getTime()
        )
        setLessons(completedLessons) // Загружаем все занятия
      } else {
        console.error('Ошибка при загрузке истории занятий:', response.status, response.statusText)
      }
    } catch (error) {
      console.error('Ошибка при загрузке истории занятий:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  const formatTime = (date: string | Date) => {
    return new Date(date).toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'KZT',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const getStatusColor = (lesson: Lesson) => {
    const status = getLessonStatus(lesson);
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'paid':
        return 'bg-blue-100 text-blue-800'
      case 'cancelled':
        return 'bg-red-100 text-red-800'
      case 'scheduled':
        return 'bg-yellow-100 text-yellow-800'
      case 'prepaid':
        return 'bg-purple-100 text-purple-800'
      case 'unpaid':
        return 'bg-orange-100 text-orange-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (lesson: Lesson) => {
    return getLessonStatusText(getLessonStatus(lesson));
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">История занятий</h3>
          <p className="text-sm text-gray-500">
            Последние завершенные занятия
          </p>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                    <div>
                      <div className="h-4 bg-gray-200 rounded w-32 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-24"></div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="h-4 bg-gray-200 rounded w-16 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-12"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (lessons.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">История занятий</h3>
          <p className="text-sm text-gray-500">
            Последние завершенные занятия
          </p>
        </div>
        <div className="p-6 text-center">
          <CheckCircle className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Нет завершенных занятий</h3>
          <p className="mt-1 text-sm text-gray-500">
            Завершенные занятия появятся здесь
          </p>
        </div>
      </div>
    )
  }

  // Показываем максимум 4 элемента, чтобы они поместились в фиксированную высоту
  const maxVisibleItems = 4
  const displayedLessons = lessons.slice(0, maxVisibleItems)
  const hasMoreLessons = lessons.length > maxVisibleItems

  return (
    <>
      <div className="bg-white rounded-lg shadow-sm border h-[600px] flex flex-col">
        <div className="px-6 py-4 border-b border-gray-200 flex-shrink-0">
          <h3 className="text-lg font-medium text-gray-900">История занятий</h3>
          <p className="text-sm text-gray-500">
            Последние завершенные занятия
          </p>
        </div>
        <div className="flex-1 overflow-hidden">
          <div className="divide-y divide-gray-200 h-full">
            {displayedLessons.map((lesson) => (
              <div key={lesson.id} className="p-4 flex-shrink-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-blue-600" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-medium text-gray-900 truncate">
                          {lesson.student.fullName}
                        </h4>
                        <span className={`ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(lesson)}`}>
                          {getStatusText(lesson)}
                        </span>
                      </div>
                      <div className="mt-1 flex items-center text-xs text-gray-500">
                        <Calendar className="w-3 h-3 mr-1" />
                        {formatDate(lesson.date)}
                        <Clock className="w-3 h-3 ml-2 mr-1" />
                        {formatTime(lesson.date)}
                      </div>
                    </div>
                  </div>
                  <div className="flex-shrink-0 text-right">
                    <div className="text-sm font-semibold text-gray-900">
                      {formatCurrency(lesson.cost)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        {hasMoreLessons && (
          <div className="px-6 py-4 border-t border-gray-200 flex-shrink-0">
            <button
              onClick={() => setShowModal(true)}
              className="w-full flex items-center justify-center px-4 py-2 text-sm font-medium text-gray-700 bg-gray-50 border border-gray-300 rounded-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              <ChevronRight className="w-4 h-4 mr-2" />
              Показать все занятия ({lessons.length})
            </button>
          </div>
        )}
      </div>

      {/* Модальное окно для полной истории занятий */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col">
            {/* Заголовок модального окна */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-blue-100 rounded-t-2xl">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Calendar className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">История занятий</h3>
                  <p className="text-sm text-gray-600">
                    {lessons.length} {lessons.length === 1 ? 'занятие' : 'занятий'} завершено
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Контент модального окна */}
            <div className="flex-1 overflow-y-auto p-6">
              {lessons.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Calendar className="w-8 h-8 text-gray-400" />
                  </div>
                  <h4 className="text-lg font-medium text-gray-900 mb-2">Нет завершенных занятий</h4>
                  <p className="text-gray-500">Завершенные занятия появятся здесь</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {lessons.map((lesson, index) => (
                    <div key={lesson.id} className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-all duration-200 hover:border-blue-200">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-sm font-bold text-blue-600">#{index + 1}</span>
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <h4 className="text-lg font-semibold text-gray-900">
                                {lesson.student.fullName}
                              </h4>
                              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(lesson)}`}>
                                {getStatusText(lesson)}
                              </span>
                            </div>
                            <div className="flex items-center space-x-6 text-sm text-gray-600">
                              <div className="flex items-center">
                                <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                                <span className="font-medium">{formatDate(lesson.date)}</span>
                              </div>
                              <div className="flex items-center">
                                <Clock className="w-4 h-4 mr-2 text-gray-400" />
                                <span>{formatTime(lesson.date)}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <div className="text-2xl font-bold text-gray-900 mb-1">
                            {formatCurrency(lesson.cost)}
                          </div>
                          <div className="text-sm text-gray-500 font-medium">стоимость</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Подвал модального окна */}
            <div className="border-t border-gray-200 p-6 bg-gray-50 rounded-b-2xl">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  <span className="font-medium">Общая сумма за занятия:</span>
                  <span className="ml-2 text-lg font-bold text-blue-600">
                    {formatCurrency(lessons.reduce((sum, lesson) => sum + lesson.cost, 0))}
                  </span>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Закрыть
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

