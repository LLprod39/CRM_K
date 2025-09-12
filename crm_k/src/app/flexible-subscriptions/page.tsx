'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/presentation/contexts'
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
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Абонементы</h1>
          <p className="text-gray-600 mt-2">
            Управляйте всеми типами абонементов: обычными и гибкими
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-medium"
        >
          Создать абонемент
        </button>
      </div>

      <AllSubscriptionsList key={refreshKey} />

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
