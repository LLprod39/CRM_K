'use client'

import React, { useState, useEffect } from 'react'
import { apiRequest } from '@/lib/api'
import { FlexibleSubscriptionWithDetails } from '@/types'
import UnifiedSubscriptionModal from '@/components/forms/UnifiedSubscriptionModal'

interface FlexibleSubscriptionsListProps {
  studentId?: number
}

export default function FlexibleSubscriptionsList({ studentId }: FlexibleSubscriptionsListProps) {
  const [subscriptions, setSubscriptions] = useState<FlexibleSubscriptionWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editingSubscription, setEditingSubscription] = useState<FlexibleSubscriptionWithDetails | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)

  useEffect(() => {
    loadSubscriptions()
  }, [studentId])

  const loadSubscriptions = async () => {
    try {
      setLoading(true)
      const url = studentId 
        ? `/api/flexible-subscriptions?studentId=${studentId}`
        : '/api/flexible-subscriptions'
      
      const response = await apiRequest(url)
      if (response.ok) {
        const data = await response.json()
        setSubscriptions(data)
      } else {
        setError('Ошибка при загрузке абонементов')
      }
    } catch (error) {
      setError('Ошибка при загрузке абонементов')
    } finally {
      setLoading(false)
    }
  }

  const generateLessons = async (subscriptionId: number) => {
    try {
      const response = await apiRequest(`/api/flexible-subscriptions/${subscriptionId}/generate-lessons`, {
        method: 'POST'
      })

      if (response.ok) {
        const result = await response.json()
        alert(`Создано ${result.createdLessons} уроков`)
        loadSubscriptions() // Перезагружаем список
      } else {
        const errorData = await response.json()
        alert(`Ошибка: ${errorData.error}`)
      }
    } catch (error) {
      alert('Ошибка при генерации уроков')
    }
  }

  const handleEdit = (subscription: FlexibleSubscriptionWithDetails) => {
    setEditingSubscription(subscription)
    setShowEditModal(true)
  }

  const handleDelete = async (subscriptionId: number) => {
    if (!confirm('Вы уверены, что хотите удалить этот абонемент?')) {
      return
    }

    try {
      const response = await apiRequest(`/api/flexible-subscriptions/${subscriptionId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        alert('Абонемент успешно удален')
        loadSubscriptions() // Перезагружаем список
      } else {
        const errorData = await response.json()
        alert(`Ошибка: ${errorData.error}`)
      }
    } catch (error) {
      alert('Ошибка при удалении абонемента')
    }
  }

  const handleEditSuccess = () => {
    setShowEditModal(false)
    setEditingSubscription(null)
    loadSubscriptions() // Перезагружаем список
  }

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString('ru-RU')
  }

  const formatTime = (time: string | Date) => {
    return new Date(time).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
  }

  const getDayName = (dayOfWeek: number) => {
    const days = ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота']
    return days[dayOfWeek]
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="text-gray-500">Загрузка абонементов...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
        {error}
      </div>
    )
  }

  if (subscriptions.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        Гибкие абонементы не найдены
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {subscriptions.map(subscription => (
        <div key={subscription.id} className="border border-gray-200 rounded-lg p-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{subscription.name}</h3>
              <p className="text-sm text-gray-600">
                Ученик: {subscription.student.fullName}
              </p>
              <p className="text-sm text-gray-600">
                Преподаватель: {subscription.user.name}
              </p>
              <p className="text-sm text-gray-600">
                Период: {formatDate(subscription.startDate)} - {formatDate(subscription.endDate)}
              </p>
            </div>
            <div className="text-right">
              <div className="text-lg font-semibold text-gray-900">
                {subscription.totalCost.toLocaleString('ru-RU')} ₽
              </div>
              <div className={`text-sm ${subscription.isPaid ? 'text-green-600' : 'text-red-600'}`}>
                {subscription.isPaid ? 'Оплачено' : 'Не оплачено'}
              </div>
            </div>
          </div>

          {subscription.description && (
            <p className="text-sm text-gray-600 mb-4">{subscription.description}</p>
          )}

          {/* Расписание недель */}
          <div className="mb-4">
            <h4 className="font-medium text-gray-900 mb-2">Расписание:</h4>
            <div className="space-y-3">
              {subscription.weekSchedules.map(week => (
                <div key={week.id} className="bg-gray-50 p-3 rounded">
                  <div className="font-medium text-sm text-gray-700 mb-2">
                    Неделя {week.weekNumber}: {formatDate(week.startDate)} - {formatDate(week.endDate)}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                    {week.weekDays?.map(day => (
                      <div key={day.id} className="bg-white p-2 rounded border text-xs">
                        <div className="font-medium">{getDayName(day.dayOfWeek)}</div>
                        <div>{formatTime(day.startTime)} - {formatTime(day.endTime)}</div>
                        <div className="text-green-600">{day.cost} ₽</div>
                        <div className="text-gray-500">{day.location}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Платежи */}
          {subscription.payments && subscription.payments.length > 0 && (
            <div className="mb-4">
              <h4 className="font-medium text-gray-900 mb-2">Платежи:</h4>
              <div className="space-y-1">
                {subscription.payments.map(payment => (
                  <div key={payment.id} className="flex justify-between text-sm">
                    <span>{formatDate(payment.date)} - {payment.description}</span>
                    <span className="text-green-600">{payment.amount.toLocaleString('ru-RU')} ₽</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Действия */}
          <div className="flex justify-end space-x-2">
            <button
              onClick={() => handleEdit(subscription)}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 text-sm"
            >
              Редактировать
            </button>
            <button
              onClick={() => handleDelete(subscription.id)}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 text-sm"
            >
              Удалить
            </button>
            <button
              onClick={() => generateLessons(subscription.id)}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
            >
              Создать уроки
            </button>
          </div>
        </div>
      ))}

      {/* Модальное окно для редактирования */}
      {editingSubscription && (
        <UnifiedSubscriptionModal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false)
            setEditingSubscription(null)
          }}
          onSuccess={handleEditSuccess}
          selectedStudent={editingSubscription.student}
          editingSubscription={editingSubscription}
        />
      )}
    </div>
  )
}
