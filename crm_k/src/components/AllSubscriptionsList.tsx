'use client'

import React, { useState, useEffect } from 'react'
import { FileText, Calendar, DollarSign, Trash2, Loader2, AlertCircle } from 'lucide-react'
import { apiRequest } from '@/lib/api'
import UnifiedSubscriptionModal from '@/components/forms/UnifiedSubscriptionModal'

interface Subscription {
  id: string | number
  type: 'regular' | 'flexible'
  name: string
  student: {
    id: number
    fullName: string
    user?: {
      name: string
    }
  }
  teacher?: {
    id: number
    name: string
  } | null
  startDate: string
  endDate: string
  totalCost: number
  isPaid: boolean
  description?: string
  createdAt: string
  weekSchedules?: any[]
  payments?: any[]
}

interface AllSubscriptionsListProps {
  studentId?: number
}

export default function AllSubscriptionsList({ studentId }: AllSubscriptionsListProps) {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editingSubscription, setEditingSubscription] = useState<Subscription | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)

  useEffect(() => {
    loadSubscriptions()
  }, [studentId])

  const loadSubscriptions = async () => {
    try {
      setLoading(true)
      const url = studentId 
        ? `/api/subscriptions?studentId=${studentId}`
        : '/api/subscriptions'
      
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

  const handleEdit = (subscription: Subscription) => {
    if (subscription.type === 'flexible') {
      setEditingSubscription(subscription)
      setShowEditModal(true)
    } else {
      alert('Редактирование обычных абонементов пока не поддерживается')
    }
  }

  const handleDelete = async (subscriptionId: string | number) => {
    if (!confirm('Вы уверены, что хотите удалить этот абонемент?')) {
      return
    }

    try {
      if (typeof subscriptionId === 'string' && subscriptionId.startsWith('regular_')) {
        // Удаление обычного абонемента (предоплаты)
        const paymentId = subscriptionId.replace('regular_', '')
        const response = await apiRequest(`/api/payments/${paymentId}`, {
          method: 'DELETE'
        })

        if (response.ok) {
          alert('Абонемент успешно удален')
          loadSubscriptions()
        } else {
          const errorData = await response.json()
          alert(`Ошибка: ${errorData.error}`)
        }
      } else {
        // Удаление гибкого абонемента
        const response = await apiRequest(`/api/flexible-subscriptions/${subscriptionId}`, {
          method: 'DELETE'
        })

        if (response.ok) {
          alert('Абонемент успешно удален')
          loadSubscriptions()
        } else {
          const errorData = await response.json()
          alert(`Ошибка: ${errorData.error}`)
        }
      }
    } catch (error) {
      alert('Ошибка при удалении абонемента')
    }
  }


  const handleEditSuccess = () => {
    setShowEditModal(false)
    setEditingSubscription(null)
    loadSubscriptions()
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

  const getSubscriptionTypeLabel = (type: string) => {
    return type === 'flexible' ? 'Гибкий' : 'Обычный'
  }

  const getSubscriptionTypeColor = (type: string) => {
    return type === 'flexible' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center p-12">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl mx-auto mb-4 flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-white animate-spin" />
          </div>
          <p className="text-gray-600 font-medium">Загрузка абонементов...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 text-red-700 px-6 py-4 rounded-2xl shadow-lg">
        <div className="flex items-center">
          <div className="w-8 h-8 bg-red-100 rounded-xl mr-3 flex items-center justify-center">
            <AlertCircle className="w-4 h-4 text-red-600" />
          </div>
          <div>
            <p className="font-semibold">Ошибка загрузки</p>
            <p className="text-sm">{error}</p>
          </div>
        </div>
      </div>
    )
  }

  if (subscriptions.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-3xl mx-auto mb-6 flex items-center justify-center">
          <FileText className="w-12 h-12 text-gray-400" />
        </div>
        <h3 className="text-xl font-bold text-gray-700 mb-3">Абонементы не найдены</h3>
        <p className="text-gray-500 mb-6">Создайте первый абонемент для начала работы</p>
        <div className="w-32 h-1 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full mx-auto"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Десктопная версия */}
      <div className="hidden lg:block">
        {subscriptions.map((subscription, index) => (
          <div 
            key={subscription.id} 
            className="group bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/50 hover:shadow-xl transition-all duration-300 hover:scale-[1.02] hover:-translate-y-1 animate-fade-in cursor-pointer"
            style={{ animationDelay: `${index * 100}ms` }}
            onClick={() => handleEdit(subscription)}
          >
            <div className="p-8 relative">
              {/* Кнопка удаления в правом верхнем углу */}
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleDelete(subscription.id)
                }}
                className="absolute top-4 right-4 w-8 h-8 bg-red-100 hover:bg-red-200 text-red-600 hover:text-red-700 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110 shadow-sm hover:shadow-md"
                title="Удалить абонемент"
              >
                <Trash2 className="w-4 h-4" />
              </button>

              {/* Заголовок карточки */}
              <div className="flex justify-between items-start mb-6 pr-12">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg ${
                      subscription.type === 'flexible' 
                        ? 'bg-gradient-to-br from-green-400 via-green-500 to-emerald-600' 
                        : 'bg-gradient-to-br from-blue-400 via-blue-500 to-blue-600'
                    }`}>
                      {subscription.type === 'flexible' ? (
                        <Calendar className="w-6 h-6 text-white" />
                      ) : (
                        <FileText className="w-6 h-6 text-white" />
                      )}
                    </div>
            <div>
                      <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getSubscriptionTypeColor(subscription.type)}`}>
                  {getSubscriptionTypeLabel(subscription.type)}
                </span>
              </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center text-gray-600">
                        <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
                        <span className="font-medium">Ученик:</span>
                        <span className="ml-2 font-semibold text-gray-900">{subscription.student.fullName}</span>
                      </div>
              {subscription.teacher && (
                        <div className="flex items-center text-gray-600">
                          <span className="w-2 h-2 bg-purple-500 rounded-full mr-3"></span>
                          <span className="font-medium">Преподаватель:</span>
                          <span className="ml-2 font-semibold text-gray-900">{subscription.teacher.name}</span>
                        </div>
                      )}
                      <div className="flex items-center text-gray-600">
                        <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
                        <span className="font-medium">Период:</span>
                        <span className="ml-2 font-semibold text-gray-900">
                          {formatDate(subscription.startDate)} - {formatDate(subscription.endDate)}
                        </span>
                      </div>
                    </div>
                  </div>
            </div>
                
                <div className="text-right ml-6">
                  <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-4 shadow-inner">
                    <div className="text-3xl font-bold text-gray-900 mb-2">
                {subscription.totalCost.toLocaleString('ru-RU')} ₸
              </div>
                    <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${
                      subscription.isPaid 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      <span className="w-2 h-2 rounded-full mr-2 bg-current"></span>
                {subscription.isPaid ? 'Оплачено' : 'Не оплачено'}
                    </div>
              </div>
            </div>
          </div>

              {/* Описание */}
          {subscription.description && (
                <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-100">
                  <p className="text-gray-700 font-medium">{subscription.description}</p>
                </div>
          )}

          {/* Расписание недель (только для гибких абонементов) */}
          {subscription.type === 'flexible' && subscription.weekSchedules && subscription.weekSchedules.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                    <span className="w-8 h-8 bg-gradient-to-br from-green-400 to-emerald-600 rounded-xl mr-3 flex items-center justify-center">
                      <Calendar className="w-4 h-4 text-white" />
                    </span>
                    Расписание занятий
                  </h4>
                  <div className="space-y-4">
                {subscription.weekSchedules.map((week: any) => (
                      <div key={week.id} className="bg-gradient-to-r from-gray-50 to-gray-100 p-4 rounded-xl border border-gray-200">
                        <div className="font-semibold text-gray-800 mb-3 text-center">
                      Неделя {week.weekNumber}: {formatDate(week.startDate)} - {formatDate(week.endDate)}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                          {week.weekDays?.map((day: any) => (
                            <div key={day.id} className="bg-white p-3 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                              <div className="font-semibold text-gray-900 mb-2">{getDayName(day.dayOfWeek)}</div>
                              <div className="text-sm text-gray-600 mb-1">{formatTime(day.startTime)} - {formatTime(day.endTime)}</div>
                              <div className="text-green-600 font-semibold mb-1">{day.cost} ₸</div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Платежи */}
          {subscription.payments && subscription.payments.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                    <span className="w-8 h-8 bg-gradient-to-br from-green-400 to-emerald-600 rounded-xl mr-3 flex items-center justify-center">
                      <DollarSign className="w-4 h-4 text-white" />
                    </span>
                    История платежей
                  </h4>
                  <div className="space-y-2">
                {subscription.payments.map((payment: any) => (
                      <div key={payment.id} className="flex justify-between items-center p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200">
                        <div>
                          <span className="font-medium text-gray-800">{formatDate(payment.date)}</span>
                          <span className="text-gray-600 ml-2">- {payment.description}</span>
                        </div>
                        <span className="text-green-600 font-bold text-lg">{payment.amount.toLocaleString('ru-RU')} ₸</span>
                  </div>
                ))}
              </div>
            </div>
          )}

            </div>
          </div>
        ))}
      </div>

      {/* Мобильная версия */}
      <div className="lg:hidden space-y-4">
        {subscriptions.map((subscription, index) => (
          <div 
            key={subscription.id} 
            className="mobile-card-modern animate-mobile-pop-in mobile-interactive-modern relative cursor-pointer"
            style={{ animationDelay: `${index * 150}ms` }}
            onClick={() => handleEdit(subscription)}
          >
            {/* Кнопка удаления в правом верхнем углу */}
            <button
              onClick={(e) => {
                e.stopPropagation()
                handleDelete(subscription.id)
              }}
              className="absolute top-3 right-3 w-7 h-7 bg-red-100 hover:bg-red-200 text-red-600 hover:text-red-700 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110 shadow-sm hover:shadow-md z-10"
              title="Удалить абонемент"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>

            {/* Заголовок */}
            <div className="flex items-center mb-4 pr-12">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mr-4 shadow-lg ${
                subscription.type === 'flexible' 
                  ? 'bg-gradient-to-br from-green-400 via-green-500 to-emerald-600' 
                  : 'bg-gradient-to-br from-blue-400 via-blue-500 to-blue-600'
              }`}>
                {subscription.type === 'flexible' ? (
                  <Calendar className="w-6 h-6 text-white" />
                ) : (
                  <FileText className="w-6 h-6 text-white" />
                )}
              </div>
              <div className="flex-1">
                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getSubscriptionTypeColor(subscription.type)}`}>
                  {getSubscriptionTypeLabel(subscription.type)}
                </span>
              </div>
            </div>

            {/* Информация */}
            <div className="space-y-3 mb-4">
              <div className="flex items-center text-gray-700">
                <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
                <span className="font-medium">Ученик:</span>
                <span className="ml-2 font-semibold">{subscription.student.fullName}</span>
              </div>
              {subscription.teacher && (
                <div className="flex items-center text-gray-700">
                  <span className="w-2 h-2 bg-purple-500 rounded-full mr-3"></span>
                  <span className="font-medium">Преподаватель:</span>
                  <span className="ml-2 font-semibold">{subscription.teacher.name}</span>
                </div>
              )}
              <div className="flex items-center text-gray-700">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
                <span className="font-medium">Период:</span>
                <span className="ml-2 font-semibold text-sm">
                  {formatDate(subscription.startDate)} - {formatDate(subscription.endDate)}
                </span>
              </div>
            </div>

            {/* Стоимость и статус */}
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-4 mb-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900 mb-2">
                  {subscription.totalCost.toLocaleString('ru-RU')} ₸
                </div>
                <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${
                  subscription.isPaid 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  <span className="w-2 h-2 rounded-full mr-2 bg-current"></span>
                  {subscription.isPaid ? 'Оплачено' : 'Не оплачено'}
                </div>
              </div>
            </div>

            {/* Описание */}
            {subscription.description && (
              <div className="mb-4 p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl">
                <p className="text-gray-700 text-sm font-medium">{subscription.description}</p>
              </div>
            )}

            
          </div>
        ))}
        </div>

      {/* Модальное окно для редактирования */}
      {editingSubscription && (
        <UnifiedSubscriptionModal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false)
            setEditingSubscription(null)
          }}
          onSuccess={handleEditSuccess}
          selectedStudent={editingSubscription.student as any}
          editingSubscription={editingSubscription}
        />
      )}
    </div>
  )
}
