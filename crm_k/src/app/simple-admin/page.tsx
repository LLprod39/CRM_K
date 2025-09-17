'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/presentation/contexts'
import { UserRole } from '@/domain/entities/User'
import ProtectedRoute from '@/components/ProtectedRoute'

export default function SimpleAdminPage() {
  const { user, isLoading } = useAuth()
  const [apiStatus, setApiStatus] = useState<string>('Проверка...')

  useEffect(() => {
    const checkApi = async () => {
      try {
        const response = await fetch('/api/admin/stats')
        if (response.ok) {
          setApiStatus('✅ API работает')
        } else {
          setApiStatus(`❌ API ошибка: ${response.status}`)
        }
      } catch (error) {
        setApiStatus(`❌ API недоступен: ${error}`)
      }
    }

    if (user?.role === UserRole.ADMIN) {
      checkApi()
    }
  }, [user])

  return (
    <ProtectedRoute requiredRole={UserRole.ADMIN}>
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">
            🛠️ Простая админ панель
          </h1>

          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Информация о пользователе</h2>
            <div className="space-y-2">
              <p><strong>ID:</strong> {user?.id}</p>
              <p><strong>Email:</strong> {user?.email}</p>
              <p><strong>Имя:</strong> {user?.name}</p>
              <p><strong>Роль:</strong> {user?.role}</p>
              <p><strong>Загрузка:</strong> {isLoading ? 'Да' : 'Нет'}</p>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Статус API</h2>
            <p>{apiStatus}</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Действия</h2>
            <div className="space-x-4">
              <button 
                onClick={() => window.location.href = '/admin'}
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
              >
                Полная админ панель
              </button>
              <button 
                onClick={() => window.location.href = '/debug'}
                className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
              >
                Страница отладки
              </button>
              <button 
                onClick={() => window.location.href = '/'}
                className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
              >
                Главная страница
              </button>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}



