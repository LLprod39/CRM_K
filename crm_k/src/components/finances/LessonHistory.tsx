'use client'

import { useState, useEffect } from 'react'
import { Calendar, Clock, User, CheckCircle } from 'lucide-react'
import type { LessonWithStudent } from '@/types'

export default function LessonHistory() {
  const [lessons, setLessons] = useState<LessonWithStudent[]>([])
  const [loading, setLoading] = useState(true)

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
        // Фильтруем только завершенные занятия (COMPLETED)
        const completedLessons = data.filter((lesson: LessonWithStudent) => 
          lesson.status === 'COMPLETED'
        )
        // Сортируем по дате (новые сначала)
        completedLessons.sort((a: LessonWithStudent, b: LessonWithStudent) => 
          new Date(b.date).getTime() - new Date(a.date).getTime()
        )
        setLessons(completedLessons.slice(0, 10)) // Показываем последние 10 занятий
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-green-100 text-green-800'
      case 'PAID':
        return 'bg-blue-100 text-blue-800'
      case 'UNPAID':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'Завершено'
      case 'PAID':
        return 'Оплачено'
      case 'UNPAID':
        return 'Не оплачено'
      default:
        return status
    }
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

  return (
    <div className="bg-white rounded-lg shadow-sm border">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">История занятий</h3>
        <p className="text-sm text-gray-500">
          Последние завершенные занятия
        </p>
      </div>
      <div className="divide-y divide-gray-200">
        {lessons.map((lesson) => (
          <div key={lesson.id} className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-blue-600" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center">
                    <h4 className="text-lg font-medium text-gray-900 truncate">
                      {lesson.student.fullName}
                    </h4>
                    <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(lesson.status)}`}>
                      {getStatusText(lesson.status)}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center text-sm text-gray-500">
                    <Calendar className="w-4 h-4 mr-1" />
                    {formatDate(lesson.date)}
                    <Clock className="w-4 h-4 ml-3 mr-1" />
                    {formatTime(lesson.date)}
                  </div>
                  {lesson.notes && (
                    <div className="mt-1 text-sm text-gray-600">
                      {lesson.notes}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex-shrink-0 text-right">
                <div className="text-lg font-semibold text-gray-900">
                  {formatCurrency(lesson.cost)}
                </div>
                <div className="text-sm text-gray-500">
                  Стоимость
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

