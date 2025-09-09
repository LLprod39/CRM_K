'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import ProtectedRoute from '@/components/ProtectedRoute'
import { apiRequest } from '@/lib/api'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { User, Student, Lesson, UserRole } from '@/types'
import { 
  Users, 
  UserCheck, 
  Calendar, 
  DollarSign, 
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock
} from 'lucide-react'

interface AdminStats {
  totalUsers: number;
  totalStudents: number;
  totalLessons: number;
  totalRevenue: number;
  recentUsers: User[];
  recentStudents: Student[];
  recentLessons: Lesson[];
}

export default function AdminPage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isLoading && (!user || user.role !== 'ADMIN')) {
      router.push('/login')
      return
    }

    if (user?.role === 'ADMIN') {
      fetchAdminStats()
    }
  }, [user, isLoading, router])

  const fetchAdminStats = async () => {
    if (!user) return;
    
    try {
      setLoading(true)
      const response = await apiRequest('/api/admin/stats')
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error('Ошибка загрузки статистики:', error)
    } finally {
      setLoading(false)
    }
  }

  if (isLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!user || user.role !== 'ADMIN') {
    return null
  }

  return (
    <ProtectedRoute requiredRole="ADMIN">
      <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Админ панель</h1>
          <p className="text-gray-600 mt-2">
            Управление всеми пользователями, учениками и данными системы
          </p>
        </div>
        <Button
          onClick={fetchAdminStats}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          Обновить данные
        </Button>
      </div>

      {/* Статистика */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Пользователи</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats?.totalUsers || 0}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-lg">
              <UserCheck className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Ученики</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats?.totalStudents || 0}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-3 bg-purple-100 rounded-lg">
              <Calendar className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Занятия</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats?.totalLessons || 0}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-3 bg-yellow-100 rounded-lg">
              <DollarSign className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Доход</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats?.totalRevenue?.toLocaleString() || 0} ₽
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Таблицы данных */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Последние пользователи */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Последние пользователи</h3>
            <Users className="w-5 h-5 text-gray-400" />
          </div>
          <div className="space-y-3">
            {stats?.recentUsers?.map((user) => (
              <div key={user.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">{user.name}</p>
                  <p className="text-sm text-gray-600">{user.email}</p>
                </div>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                  user.role === 'ADMIN' 
                    ? 'bg-red-100 text-red-800' 
                    : 'bg-blue-100 text-blue-800'
                }`}>
                  {user.role === 'ADMIN' ? 'Админ' : 'Пользователь'}
                </span>
              </div>
            )) || (
              <p className="text-gray-500 text-center py-4">Нет данных</p>
            )}
          </div>
        </Card>

        {/* Последние ученики */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Последние ученики</h3>
            <UserCheck className="w-5 h-5 text-gray-400" />
          </div>
          <div className="space-y-3">
            {stats?.recentStudents?.map((student) => (
              <div key={student.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">{student.fullName}</p>
                  <p className="text-sm text-gray-600">{student.phone}</p>
                </div>
                <span className="text-sm text-gray-500">
                  {student.age} лет
                </span>
              </div>
            )) || (
              <p className="text-gray-500 text-center py-4">Нет данных</p>
            )}
          </div>
        </Card>
      </div>

      {/* Последние занятия */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Последние занятия</h3>
          <Calendar className="w-5 h-5 text-gray-400" />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-medium text-gray-600">Дата</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Ученик</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Стоимость</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Статус</th>
              </tr>
            </thead>
            <tbody>
              {stats?.recentLessons?.map((lesson) => (
                <tr key={lesson.id} className="border-b border-gray-100">
                  <td className="py-3 px-4 text-sm text-gray-900">
                    {new Date(lesson.date).toLocaleDateString('ru-RU')}
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-900">
                    {lesson.studentId}
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-900">
                    {lesson.cost} ₽
                  </td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${
                      lesson.status === 'COMPLETED' 
                        ? 'bg-green-100 text-green-800'
                        : lesson.status === 'PAID'
                        ? 'bg-blue-100 text-blue-800'
                        : lesson.status === 'CANCELLED'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {lesson.status === 'COMPLETED' && <CheckCircle className="w-3 h-3 mr-1" />}
                      {lesson.status === 'PAID' && <DollarSign className="w-3 h-3 mr-1" />}
                      {lesson.status === 'CANCELLED' && <AlertCircle className="w-3 h-3 mr-1" />}
                      {lesson.status === 'SCHEDULED' && <Clock className="w-3 h-3 mr-1" />}
                      {lesson.status === 'COMPLETED' && 'Проведено'}
                      {lesson.status === 'PAID' && 'Оплачено'}
                      {lesson.status === 'CANCELLED' && 'Отменено'}
                      {lesson.status === 'SCHEDULED' && 'Запланировано'}
                    </span>
                  </td>
                </tr>
              )) || (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-gray-500">
                    Нет данных
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
      </div>
    </ProtectedRoute>
  )
}
