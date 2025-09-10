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
  X,
  Shield,
  Clock,
  CheckCircle,
  AlertTriangle,
  Eye,
  Edit,
  Trash2,
  Search,
  Filter,
  Download,
  Upload,
  Bell,
  Home,
  BookOpen,
  CreditCard,
  PieChart,
  LineChart,
  Target,
  Zap
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
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'lessons' | 'analytics' | 'settings'>('overview')
  const [searchQuery, setSearchQuery] = useState('')
  const [filterRole, setFilterRole] = useState<UserRole | 'all'>('all')

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
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        <div className="text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-3xl flex items-center justify-center mx-auto mb-6 animate-pulse shadow-lg">
            <Shield className="w-10 h-10 text-white" />
          </div>
          <div className="text-2xl font-bold text-gray-900 mb-2">Загрузка админ панели</div>
          <div className="text-gray-600">Инициализация системы управления...</div>
        </div>
      </div>
    )
  }

  if (!user || user.role !== 'ADMIN') {
    return null
  }

  const tabs = [
    { id: 'overview', label: 'Обзор', icon: Home },
    { id: 'users', label: 'Пользователи', icon: Users },
    { id: 'lessons', label: 'Занятия', icon: BookOpen },
    { id: 'analytics', label: 'Аналитика', icon: BarChart3 },
    { id: 'settings', label: 'Настройки', icon: Settings }
  ]

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Ключевые метрики */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-medium">Пользователи</p>
              <p className="text-3xl font-bold">{stats?.totalUsers || 0}</p>
              <p className="text-blue-100 text-xs mt-1">в системе</p>
            </div>
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <Users className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm font-medium">Ученики</p>
              <p className="text-3xl font-bold">{stats?.totalStudents || 0}</p>
              <p className="text-green-100 text-xs mt-1">зарегистрировано</p>
            </div>
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <UserCheck className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm font-medium">Занятия</p>
              <p className="text-3xl font-bold">{stats?.totalLessons || 0}</p>
              <p className="text-purple-100 text-xs mt-1">проведено</p>
            </div>
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <Calendar className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-yellow-500 to-orange-500 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-yellow-100 text-sm font-medium">Доход</p>
              <p className="text-3xl font-bold">{stats?.totalRevenue?.toLocaleString() || 0} ₸</p>
              <p className="text-yellow-100 text-xs mt-1">общий доход</p>
            </div>
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <DollarSign className="w-6 h-6" />
            </div>
          </div>
        </div>
      </div>

      {/* Быстрые действия */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Zap className="w-5 h-5 mr-2 text-yellow-500" />
          Быстрые действия
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={handleAddUser}
            className="p-4 bg-blue-50 hover:bg-blue-100 rounded-xl border border-blue-200 transition-colors text-left"
          >
            <Plus className="w-6 h-6 text-blue-600 mb-2" />
            <div className="font-medium text-gray-900">Добавить пользователя</div>
            <div className="text-sm text-gray-600">Создать нового пользователя системы</div>
          </button>
          
          <button
            onClick={() => setActiveTab('analytics')}
            className="p-4 bg-green-50 hover:bg-green-100 rounded-xl border border-green-200 transition-colors text-left"
          >
            <BarChart3 className="w-6 h-6 text-green-600 mb-2" />
            <div className="font-medium text-gray-900">Просмотр аналитики</div>
            <div className="text-sm text-gray-600">Детальная статистика и отчеты</div>
          </button>
          
          <button
            onClick={() => fetchAdminStats(true)}
            className="p-4 bg-purple-50 hover:bg-purple-100 rounded-xl border border-purple-200 transition-colors text-left"
          >
            <RefreshCw className={`w-6 h-6 text-purple-600 mb-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            <div className="font-medium text-gray-900">Обновить данные</div>
            <div className="text-sm text-gray-600">Синхронизировать с базой данных</div>
          </button>
        </div>
      </div>

      {/* Последние активности */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecentActivity lessons={stats?.recentLessons || []} />
        
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Bell className="w-5 h-5 mr-2 text-orange-500" />
            Уведомления
          </h3>
          <div className="space-y-3">
            <div className="flex items-center p-3 bg-yellow-50 rounded-lg border border-yellow-200">
              <AlertTriangle className="w-5 h-5 text-yellow-600 mr-3" />
              <div>
                <div className="font-medium text-gray-900">Новые пользователи</div>
                <div className="text-sm text-gray-600">За последние 24 часа</div>
              </div>
            </div>
            <div className="flex items-center p-3 bg-green-50 rounded-lg border border-green-200">
              <CheckCircle className="w-5 h-5 text-green-600 mr-3" />
              <div>
                <div className="font-medium text-gray-900">Система работает стабильно</div>
                <div className="text-sm text-gray-600">Все сервисы доступны</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  const renderUsers = () => (
    <div className="space-y-6">
      {/* Фильтры и поиск */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Поиск пользователей..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value as UserRole | 'all')}
              className="px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Все роли</option>
              <option value="ADMIN">Администраторы</option>
              <option value="USER">Пользователи</option>
            </select>
            <button className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors">
              <Filter className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Список пользователей */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Пользователи системы</h3>
            <button
              onClick={handleAddUser}
              className="px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors flex items-center"
            >
              <Plus className="w-4 h-4 mr-2" />
              Добавить
            </button>
          </div>
        </div>
        
        <div className="p-6">
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
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors"
              >
                Добавить пользователя
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )

  return (
    <ProtectedRoute requiredRole="ADMIN">
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
        {/* Боковая панель */}
        <AdminSidebar 
          isMobileOpen={isMobileMenuOpen}
          onMobileClose={() => setIsMobileMenuOpen(false)}
        />

        {/* Основной контент */}
        <div className="lg:pl-64">
          {/* Заголовок */}
          <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200 px-4 sm:px-6 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setIsMobileMenuOpen(true)}
                  className="lg:hidden p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <Menu className="w-5 h-5" />
                </button>
                
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Админ панель</h1>
                  <p className="text-gray-600 mt-1">
                    Управление системой и мониторинг активности
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => fetchAdminStats(true)}
                  disabled={isRefreshing}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                  <span>Обновить</span>
                </button>
              </div>
            </div>

            {/* Вкладки */}
            <div className="mt-6 flex space-x-1 bg-gray-100 p-1 rounded-xl">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                    activeTab === tab.id
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  <span className="font-medium">{tab.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Контент */}
          <div className="p-6">
            {activeTab === 'overview' && renderOverview()}
            {activeTab === 'users' && renderUsers()}
            {activeTab === 'lessons' && (
              <div className="text-center py-12">
                <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Управление занятиями</h3>
                <p className="text-gray-600">Функция в разработке</p>
              </div>
            )}
            {activeTab === 'analytics' && (
              <div className="text-center py-12">
                <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Аналитика</h3>
                <p className="text-gray-600">Функция в разработке</p>
              </div>
            )}
            {activeTab === 'settings' && (
              <div className="text-center py-12">
                <Settings className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Настройки</h3>
                <p className="text-gray-600">Функция в разработке</p>
              </div>
            )}
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
