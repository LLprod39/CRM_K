'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import ProtectedRoute from '@/components/ProtectedRoute'
import { apiRequest } from '@/lib/api'
import { User, Student, Lesson, UserRole, AdminStats, UserWithStats } from '@/types'
import AdminSidebar from '@/components/admin/AdminSidebar'
import StatsCard from '@/components/admin/StatsCard'
import UserCard from '@/components/admin/UserCard'
import AddUserModal from '@/components/admin/AddUserModal'
import RecentActivity from '@/components/admin/RecentActivity'
import { 
  Users, 
  UserCheck, 
  Calendar, 
  DollarSign, 
  TrendingUp,
  Activity,
  Plus,
  RefreshCw,
  BarChart3,
  Settings,
  Menu,
  X
} from 'lucide-react'

export default function AdminPage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [showAddUserModal, setShowAddUserModal] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  useEffect(() => {
    if (!isLoading && (!user || user.role !== 'ADMIN')) {
      router.push('/login')
      return
    }

    if (user?.role === 'ADMIN') {
      fetchAdminStats()
    }
  }, [user, isLoading, router])

  const fetchAdminStats = async (showRefresh = false) => {
    if (!user) return;
    
    try {
      if (showRefresh) {
        setIsRefreshing(true)
      } else {
        setLoading(true)
      }
      const response = await apiRequest('/api/admin/stats')
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error('Ошибка загрузки статистики:', error)
    } finally {
      setLoading(false)
      setIsRefreshing(false)
    }
  }

  const handleUserSubmit = async (userData: {
    name: string
    email: string
    password: string
    role: UserRole
  }) => {
    try {
      const response = await apiRequest('/api/admin/users', {
        method: editingUser ? 'PUT' : 'POST',
        body: JSON.stringify({
          ...userData,
          id: editingUser?.id
        })
      })

      if (response.ok) {
        await fetchAdminStats()
        setShowAddUserModal(false)
        setEditingUser(null)
      }
    } catch (error) {
      console.error('Ошибка сохранения пользователя:', error)
    }
  }

  const handleEditUser = (user: User) => {
    setEditingUser(user)
    setShowAddUserModal(true)
  }

  const handleDeleteUser = async (userId: number) => {
    if (!confirm('Вы уверены, что хотите удалить этого пользователя?')) return

    try {
      const response = await apiRequest(`/api/admin/users/${userId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        await fetchAdminStats()
      }
    } catch (error) {
      console.error('Ошибка удаления пользователя:', error)
    }
  }

  const handleAddUser = () => {
    setEditingUser(null)
    setShowAddUserModal(true)
  }

  const handleCloseModal = () => {
    setShowAddUserModal(false)
    setEditingUser(null)
  }

  if (isLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Activity className="w-8 h-8 text-white" />
          </div>
          <div className="text-lg font-medium text-gray-900">Загрузка админ панели...</div>
          <div className="text-sm text-gray-500 mt-1">Пожалуйста, подождите</div>
        </div>
      </div>
    )
  }

  if (!user || user.role !== 'ADMIN') {
    return null
  }

  return (
    <ProtectedRoute requiredRole="ADMIN">
      <div className="min-h-screen bg-gray-50 flex">
        {/* Боковая панель */}
        <AdminSidebar 
          isMobileOpen={isMobileMenuOpen}
          onMobileClose={() => setIsMobileMenuOpen(false)}
        />

        {/* Основной контент */}
        <div className="flex-1 flex flex-col">
          {/* Заголовок */}
          <div className="bg-white border-b border-gray-200 px-4 sm:px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                {/* Мобильное меню */}
                <button
                  onClick={() => setIsMobileMenuOpen(true)}
                  className="lg:hidden p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors touch-manipulation"
                >
                  <Menu className="w-5 h-5" />
                </button>
                
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Обзор системы</h1>
                  <p className="text-gray-600 mt-1 text-sm sm:text-base">
                    Мониторинг и управление CRM системой
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2 sm:space-x-3">
                <button
                  onClick={() => fetchAdminStats(true)}
                  disabled={isRefreshing}
                  className="flex items-center space-x-1 sm:space-x-2 px-3 sm:px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors disabled:opacity-50 text-sm touch-manipulation"
                >
                  <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                  <span className="hidden sm:inline">Обновить</span>
                </button>
                <button
                  onClick={handleAddUser}
                  className="flex items-center space-x-1 sm:space-x-2 px-3 sm:px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl transition-colors text-sm touch-manipulation"
                >
                  <Plus className="w-4 h-4" />
                  <span className="hidden sm:inline">Добавить пользователя</span>
                </button>
              </div>
            </div>
          </div>

          {/* Контент */}
          <div className="flex-1 p-4 sm:p-6 space-y-4 sm:space-y-6">
            {/* Статистические карточки */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              <StatsCard
                title="Пользователи"
                value={stats?.totalUsers || 0}
                icon={Users}
                color="blue"
                description="Всего пользователей в системе"
              />
              <StatsCard
                title="Ученики"
                value={stats?.totalStudents || 0}
                icon={UserCheck}
                color="green"
                description="Зарегистрированных учеников"
              />
              <StatsCard
                title="Занятия"
                value={stats?.totalLessons || 0}
                icon={Calendar}
                color="purple"
                description="Всего занятий проведено"
              />
              <StatsCard
                title="Доход"
                value={`${stats?.totalRevenue?.toLocaleString() || 0} ₸`}
                icon={DollarSign}
                color="yellow"
                description="Общий доход системы"
              />
            </div>

            {/* Основной контент в две колонки */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
              {/* Пользователи - занимает 2 колонки */}
              <div className="lg:col-span-2">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200">
                  <div className="p-4 sm:p-6 border-b border-gray-200">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <h2 className="text-lg sm:text-xl font-semibold text-gray-900 flex items-center">
                          <Users className="w-5 h-5 mr-2 text-blue-600" />
                          Пользователи системы
                        </h2>
                        <p className="text-sm text-gray-600 mt-1">
                          Управление пользователями и их статистика
                        </p>
                      </div>
                      <div className="text-sm text-gray-500">
                        {stats?.usersWithStats?.length || 0} пользователей
                      </div>
                    </div>
                  </div>

                  <div className="p-4 sm:p-6">
                    {stats?.usersWithStats && stats.usersWithStats.length > 0 ? (
                      <div className="space-y-4">
                        {stats.usersWithStats.map((userWithStats) => (
                          <UserCard
                            key={userWithStats.id}
                            user={userWithStats}
                            onEdit={handleEditUser}
                            onDelete={handleDeleteUser}
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <Users className="w-8 h-8 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">Нет пользователей</h3>
                        <p className="text-gray-500 mb-4">Добавьте первого пользователя, чтобы начать работу</p>
                        <button
                          onClick={handleAddUser}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors touch-manipulation"
                        >
                          Добавить пользователя
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Последние занятия - занимает 1 колонку */}
              <div className="lg:col-span-1">
                <RecentActivity lessons={stats?.recentLessons || []} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Модальное окно добавления/редактирования пользователя */}
      <AddUserModal
        isOpen={showAddUserModal}
        onClose={handleCloseModal}
        onSubmit={handleUserSubmit}
        editingUser={editingUser}
      />
    </ProtectedRoute>
  )
}
