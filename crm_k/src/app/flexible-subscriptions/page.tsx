'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/presentation/contexts'
import { Plus } from 'lucide-react'
import UnifiedSubscriptionModal from '@/components/forms/UnifiedSubscriptionModal'
import AllSubscriptionsList from '@/components/AllSubscriptionsList'

export default function FlexibleSubscriptionsPage() {
  const [showForm, setShowForm] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)
  const { user, isLoading } = useAuth()
  const router = useRouter()

  // Проверяем права доступа
  useEffect(() => {
    if (!isLoading && user?.role !== 'ADMIN') {
      router.push('/')
    }
  }, [user, isLoading, router])

  // Показываем загрузку пока проверяем права
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-gray-500">Загрузка...</div>
      </div>
    )
  }

  // Если пользователь не админ, не показываем содержимое
  if (user?.role !== 'ADMIN') {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30">
      {/* Десктопная версия */}
      <div className="hidden lg:block">
        <div className="space-y-6">
          {/* Заголовок и действия */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div className="animate-fade-in">
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">
                Абонементы
              </h1>
              <p className="mt-2 text-gray-600 text-lg">
                Управление абонементами
              </p>
            </div>
            
            <div className="mt-4 sm:mt-0">
              <button
                onClick={() => setShowForm(true)}
                className="group px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 flex items-center space-x-2"
              >
                <Plus className="w-5 h-5" />
                <span>Создать абонемент</span>
              </button>
            </div>
          </div>

          {/* Список абонементов */}
          <div className="animate-fade-in">
            <AllSubscriptionsList key={refreshKey} />
          </div>
        </div>
      </div>

      {/* Мобильная версия */}
      <div className="lg:hidden">
        <div className="p-4 space-y-6">
          {/* Заголовок */}
          <div className="animate-mobile-slide-up">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Абонементы
            </h1>
            <p className="text-gray-600 mb-4">
              Управление абонементами
            </p>
            
            {/* Кнопка создания */}
            <button
              onClick={() => setShowForm(true)}
              className="mobile-btn-gradient mobile-btn-primary w-full py-4 font-bold text-lg flex items-center justify-center space-x-3"
            >
              <Plus className="w-5 h-5" />
              <span>Создать абонемент</span>
            </button>
          </div>

          {/* Список абонементов */}
          <div className="animate-mobile-slide-up" style={{ animationDelay: '300ms' }}>
            <AllSubscriptionsList key={refreshKey} />
          </div>
        </div>
      </div>

      {/* Модальное окно */}
      <UnifiedSubscriptionModal
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        onSuccess={() => {
          setShowForm(false)
          setRefreshKey(prev => prev + 1) // Обновляем список
        }}
      />
    </div>
  )
}
