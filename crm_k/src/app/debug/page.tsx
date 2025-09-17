'use client'

import { useAuth } from '@/presentation/contexts'
import { UserRole } from '@/domain/entities/User'

export default function DebugPage() {
  const { user, isLoading } = useAuth()

  return (
    <div className="p-8 bg-gray-100 min-h-screen">
      <h1 className="text-2xl font-bold mb-4">Отладка аутентификации</h1>
      
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-4">Состояние пользователя:</h2>
        
        <div className="space-y-2">
          <p><strong>Загрузка:</strong> {isLoading ? 'Да' : 'Нет'}</p>
          <p><strong>Пользователь:</strong> {user ? 'Есть' : 'Нет'}</p>
          
          {user && (
            <>
              <p><strong>ID:</strong> {user.id}</p>
              <p><strong>Email:</strong> {user.email}</p>
              <p><strong>Имя:</strong> {user.name}</p>
              <p><strong>Роль:</strong> {user.role}</p>
              <p><strong>Роль === ADMIN:</strong> {user.role === UserRole.ADMIN ? 'Да' : 'Нет'}</p>
              <p><strong>Роль === 'ADMIN':</strong> {user.role === 'ADMIN' ? 'Да' : 'Нет'}</p>
            </>
          )}
        </div>

        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-2">localStorage:</h3>
          <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
            {typeof window !== 'undefined' ? localStorage.getItem('user') || 'Пусто' : 'Недоступно'}
          </pre>
        </div>

        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-2">Действия:</h3>
          <div className="space-x-4">
            <button 
              onClick={() => window.location.href = '/admin'}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              Перейти на /admin
            </button>
            <button 
              onClick={() => window.location.href = '/'}
              className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
            >
              Перейти на главную
            </button>
            <button 
              onClick={() => {
                localStorage.removeItem('user')
                localStorage.removeItem('token')
                window.location.reload()
              }}
              className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
            >
              Очистить localStorage
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}



