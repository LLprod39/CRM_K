'use client'

import React, { useState, useEffect } from 'react'
import { FileText, Calendar, DollarSign, Trash2, Loader2, AlertCircle, User, Clock, Search, ChevronDown, ChevronRight, Users } from 'lucide-react'
import { apiRequest } from '@/lib/api'
import SubscriptionCalendarForm from '@/components/forms/SubscriptionCalendarForm'

interface Subscription {
  id: string | number
  type: 'flexible'
  name: string
  student: {
    id: number
    fullName: string
    photoUrl?: string
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
  const [expandedStudents, setExpandedStudents] = useState<Set<number>>(new Set())
  const [searchTerm, setSearchTerm] = useState('')

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
    setEditingSubscription(subscription)
    setShowEditModal(true)
  }

  const handleDelete = async (subscriptionId: string | number) => {
    if (!confirm('Вы уверены, что хотите удалить этот абонемент?')) {
      return
    }

    try {
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
    } catch (error) {
      alert('Ошибка при удалении абонемента')
    }
  }

  const handleEditSuccess = () => {
    setShowEditModal(false)
    setEditingSubscription(null)
    loadSubscriptions()
  }

  // Группировка абонементов по ученикам
  const groupedSubscriptions = subscriptions.reduce((acc, subscription) => {
    const studentId = subscription.student.id
    if (!acc[studentId]) {
      acc[studentId] = {
        student: subscription.student,
        subscriptions: []
      }
    }
    acc[studentId].subscriptions.push(subscription)
    return acc
  }, {} as Record<number, { student: Subscription['student'], subscriptions: Subscription[] }>)

  // Фильтрация по поисковому запросу
  const filteredGroupedSubscriptions = Object.entries(groupedSubscriptions).filter(([_, group]) => {
    if (!searchTerm) return true
    return group.student.fullName.toLowerCase().includes(searchTerm.toLowerCase())
  })

  // Управление разворачиванием/сворачиванием групп
  const toggleStudentExpansion = (studentId: number) => {
    const numericStudentId = Number(studentId)
    const newExpanded = new Set(expandedStudents)
    if (newExpanded.has(numericStudentId)) {
      newExpanded.delete(numericStudentId)
    } else {
      newExpanded.add(numericStudentId)
    }
    setExpandedStudents(newExpanded)
  }

  // Разворачиваем все группы по умолчанию
  useEffect(() => {
    if (subscriptions.length > 0) {
      const allStudentIds = new Set(subscriptions.map(s => s.student.id))
      setExpandedStudents(allStudentIds)
    }
  }, [subscriptions])

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString('ru-RU')
  }

  const formatTime = (time: string) => {
    return new Date(`2000-01-01T${time}`).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
  }

  const getDayName = (dayOfWeek: number) => {
    const days = ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота']
    return days[dayOfWeek] || 'Неизвестно'
  }

  const getSubscriptionTypeLabel = (type: string) => {
    switch (type) {
      case 'flexible':
        return 'Гибкий'
      default:
        return type
    }
  }

  const getSubscriptionTypeColor = (type: string) => {
    return 'bg-green-100 text-green-800'
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
      {/* Поиск и фильтры */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <div className="flex items-center space-x-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Поиск по имени ученика..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Users className="w-4 h-4" />
            <span>Всего учеников: {filteredGroupedSubscriptions.length}</span>
          </div>
        </div>
      </div>

      {/* Группированные абонементы */}
      <div className="space-y-4">
        {filteredGroupedSubscriptions.map(([studentIdStr, group]) => {
          const studentId = Number(studentIdStr)
          const isExpanded = expandedStudents.has(studentId)
          const totalSubscriptions = group.subscriptions.length
          
          return (
            <div key={studentId} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              {/* Заголовок группы ученика */}
              <div 
                className="p-6 cursor-pointer hover:bg-gray-50 transition-colors duration-200"
                onClick={() => toggleStudentExpansion(studentId)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    {/* Аватар ученика */}
                    <div className="flex-shrink-0">
                      {group.student.photoUrl ? (
                        <img
                          src={group.student.photoUrl}
                          alt={group.student.fullName}
                          className="h-12 w-12 rounded-full object-cover ring-2 ring-white shadow-lg"
                        />
                      ) : (
                        <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center shadow-lg">
                          <User className="h-6 w-6 text-blue-600" />
                        </div>
                      )}
                    </div>
                    
                    {/* Информация об ученике */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {group.student.fullName}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {totalSubscriptions} абонемент{totalSubscriptions === 1 ? '' : totalSubscriptions < 5 ? 'а' : 'ов'}
                      </p>
                    </div>
                  </div>
                  
                  {/* Кнопка разворачивания */}
                  <div className="flex items-center space-x-3">
                    <span className="text-sm text-gray-500">
                      {isExpanded ? 'Свернуть' : 'Развернуть'}
                    </span>
                    {isExpanded ? (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
            </div>
              </div>
              
              {/* Содержимое группы */}
              {isExpanded && (
                <div className="border-t border-gray-100">
                  {group.subscriptions.map((subscription, index) => (
                    <div 
                      key={subscription.id} 
                      className="p-6 border-b border-gray-100 last:border-b-0 hover:bg-gray-50 transition-colors duration-200"
                      onClick={() => handleEdit(subscription)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          {/* Информация об абонементе */}
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <h4 className="text-lg font-semibold text-gray-900">
                                {subscription.name || 'Гибкий абонемент'}
                              </h4>
                              <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getSubscriptionTypeColor(subscription.type)}`}>
                                {getSubscriptionTypeLabel(subscription.type)}
                              </span>
                            </div>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                              <div className="flex items-center space-x-2">
                                <Calendar className="w-4 h-4 text-blue-600" />
                                <span className="text-gray-600">
                                  {formatDate(subscription.startDate)} - {formatDate(subscription.endDate)}
                                </span>
                              </div>
                              
                              <div className="flex items-center space-x-2">
                                <DollarSign className="w-4 h-4 text-green-600" />
                                <span className="font-semibold text-green-800">
                                  {subscription.totalCost.toLocaleString()} ₸
                                </span>
                              </div>
                              
                              <div className="flex items-center space-x-2">
                                <div className={`w-2 h-2 rounded-full ${subscription.isPaid ? 'bg-green-500' : 'bg-red-500'}`}></div>
                                <span className={subscription.isPaid ? 'text-green-700' : 'text-red-700'}>
                {subscription.isPaid ? 'Оплачено' : 'Не оплачено'}
                                </span>
                    </div>
              </div>
            </div>
          </div>

                        {/* Кнопка удаления */}
            <button
              onClick={(e) => {
                e.stopPropagation()
                handleDelete(subscription.id)
              }}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
              title="Удалить абонемент"
            >
                          <Trash2 className="w-4 h-4" />
            </button>
              </div>
            </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
        </div>

      {/* Модальное окно для редактирования */}
      {editingSubscription && (
        <SubscriptionCalendarForm
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false)
            setEditingSubscription(null)
          }}
          onSuccess={handleEditSuccess}
        />
      )}
    </div>
  )
}