'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import ProtectedRoute from '@/components/ProtectedRoute'
import { apiRequest } from '@/lib/api'
import { User, Student, Lesson, UserRole, AdminStats, UserWithStats } from '@/types'
import StatsCard from '@/components/admin/StatsCard'
import UserCard from '@/components/admin/UserCard'
import AddUserModal from '@/components/admin/AddUserModal'
import RecentActivity from '@/components/admin/RecentActivity'
import ToysManagement from '@/components/admin/ToysManagement'
import LessonsManagement from '@/components/admin/LessonsManagement'
import AnalyticsDashboard from '@/components/admin/AnalyticsDashboard'
import SystemSettings from '@/components/admin/SystemSettings'
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
  X,
  Menu,
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
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'lessons' | 'analytics' | 'settings' | 'toys'>('overview')
  const [showNotifications, setShowNotifications] = useState(false)
  const [showMobileMenu, setShowMobileMenu] = useState(false)
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

  // Функции для экспорта данных
  const generateUsersCSV = (users: any[]) => {
    const headers = ['ID', 'Имя', 'Email', 'Роль', 'Учеников', 'Занятий', 'Доход', 'Долг', 'Дата создания']
    const rows = users.map(user => [
      user.id,
      user.name,
      user.email,
      user.role === 'ADMIN' ? 'Администратор' : 'Пользователь',
      user.stats.totalStudents,
      user.stats.totalLessons,
      user.stats.totalRevenue,
      user.stats.totalDebt,
      new Date(user.createdAt).toLocaleDateString('ru-RU')
    ])
    
    return [headers, ...rows].map(row => 
      row.map(field => `"${field}"`).join(',')
    ).join('\n')
  }

  const downloadCSV = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', filename)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
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


  const renderOverview = () => (
    <div className="space-y-3 max-w-7xl mx-auto">
      {/* Ключевые метрики */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-4 text-white shadow-lg hover:shadow-xl transition-shadow">
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

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-4 text-white shadow-lg hover:shadow-xl transition-shadow">
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

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-4 text-white shadow-lg hover:shadow-xl transition-shadow">
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

        <div className="bg-gradient-to-br from-yellow-500 to-orange-500 rounded-2xl p-4 text-white shadow-lg hover:shadow-xl transition-shadow">
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
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-3">
        <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
          <Zap className="w-5 h-5 mr-2 text-yellow-500" />
          Быстрые действия
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <button
            onClick={handleAddUser}
            className="p-4 bg-blue-50 hover:bg-blue-100 rounded-xl border border-blue-200 transition-all duration-200 text-left hover:shadow-md"
          >
            <Plus className="w-6 h-6 text-blue-600 mb-3" />
            <div className="font-medium text-gray-900">Добавить пользователя</div>
            <div className="text-sm text-gray-600">Создать нового пользователя системы</div>
          </button>
          
          <button
            onClick={() => setActiveTab('analytics')}
            className="p-4 bg-green-50 hover:bg-green-100 rounded-xl border border-green-200 transition-all duration-200 text-left hover:shadow-md"
          >
            <BarChart3 className="w-6 h-6 text-green-600 mb-3" />
            <div className="font-medium text-gray-900">Просмотр аналитики</div>
            <div className="text-sm text-gray-600">Детальная статистика и отчеты</div>
          </button>
          
          <button
            onClick={() => fetchAdminStats(true)}
            className="p-4 bg-purple-50 hover:bg-purple-100 rounded-xl border border-purple-200 transition-all duration-200 text-left hover:shadow-md"
          >
            <RefreshCw className={`w-6 h-6 text-purple-600 mb-3 ${isRefreshing ? 'animate-spin' : ''}`} />
            <div className="font-medium text-gray-900">Обновить данные</div>
            <div className="text-sm text-gray-600">Синхронизировать с базой данных</div>
          </button>
        </div>
      </div>

      {/* Последние активности */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <RecentActivity lessons={stats?.recentLessons || []} />
        
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-3">
          <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
            <Bell className="w-5 h-5 mr-2 text-orange-500" />
            Уведомления
          </h3>
          <div className="space-y-4">
            {stats?.recentUsers && stats.recentUsers.length > 0 && (
              <div className="flex items-center p-4 bg-yellow-50 rounded-xl border border-yellow-200 hover:bg-yellow-100 transition-colors">
                <AlertTriangle className="w-5 h-5 text-yellow-600 mr-3 flex-shrink-0" />
                <div>
                  <div className="font-medium text-gray-900">
                    Новые пользователи: {stats.recentUsers.length}
                  </div>
                  <div className="text-sm text-gray-600">
                    Последний: {stats.recentUsers[0].name}
                  </div>
                </div>
              </div>
            )}
            
            {stats?.recentStudents && stats.recentStudents.length > 0 && (
              <div className="flex items-center p-4 bg-blue-50 rounded-xl border border-blue-200 hover:bg-blue-100 transition-colors">
                <Users className="w-5 h-5 text-blue-600 mr-3 flex-shrink-0" />
                <div>
                  <div className="font-medium text-gray-900">
                    Новые ученики: {stats.recentStudents.length}
                  </div>
                  <div className="text-sm text-gray-600">
                    Последний: {stats.recentStudents[0].fullName}
                  </div>
                </div>
              </div>
            )}
            
            {stats?.recentLessons && stats.recentLessons.length > 0 && (
              <div className="flex items-center p-4 bg-purple-50 rounded-xl border border-purple-200 hover:bg-purple-100 transition-colors">
                <Calendar className="w-5 h-5 text-purple-600 mr-3 flex-shrink-0" />
                <div>
                  <div className="font-medium text-gray-900">
                    Новые занятия: {stats.recentLessons.length}
                  </div>
                  <div className="text-sm text-gray-600">
                    Последнее: {new Date(stats.recentLessons[0].date).toLocaleDateString('ru-RU')}
                  </div>
                </div>
              </div>
            )}
            
            <div className="flex items-center p-4 bg-green-50 rounded-xl border border-green-200 hover:bg-green-100 transition-colors">
              <CheckCircle className="w-5 h-5 text-green-600 mr-3 flex-shrink-0" />
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

  // Фильтрация пользователей
  const filteredUsers = stats?.usersWithStats?.filter(user => {
    const matchesSearch = searchQuery === '' || 
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesRole = filterRole === 'all' || user.role === filterRole
    
    return matchesSearch && matchesRole
  }) || []

  const renderUsers = () => (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Фильтры и поиск */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 sm:p-6">
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
            <button 
              onClick={() => {
                setSearchQuery('')
                setFilterRole('all')
              }}
              className="px-4 py-2 bg-gray-600 text-white rounded-xl hover:bg-gray-700 transition-colors"
              title="Сбросить фильтры"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
        
        {/* Результаты поиска */}
        {(searchQuery || filterRole !== 'all') && (
          <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center justify-between">
              <span className="text-sm text-blue-700">
                Найдено: {filteredUsers.length} из {stats?.usersWithStats?.length || 0} пользователей
              </span>
              <button
                onClick={() => {
                  setSearchQuery('')
                  setFilterRole('all')
                }}
                className="text-xs text-blue-600 hover:text-blue-800 underline"
              >
                Показать всех
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Список пользователей */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200">
        <div className="p-4 sm:p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Пользователи системы</h3>
              <p className="text-sm text-gray-600 mt-1">
                Всего пользователей: {stats?.usersWithStats?.length || 0}
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => {
                  // Экспорт пользователей
                  const csvContent = generateUsersCSV(filteredUsers)
                  downloadCSV(csvContent, 'users.csv')
                }}
                className="px-4 py-2 bg-gray-600 text-white rounded-xl hover:bg-gray-700 transition-colors flex items-center"
                title="Экспорт в CSV"
              >
                <Download className="w-4 h-4 mr-2" />
                Экспорт
              </button>
              <button
                onClick={handleAddUser}
                className="px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors flex items-center"
              >
                <Plus className="w-4 h-4 mr-2" />
                Добавить
              </button>
            </div>
          </div>
        </div>
        
        <div className="p-4 sm:p-6">
          {filteredUsers.length > 0 ? (
            <div className="space-y-4">
              {filteredUsers.map((userWithStats) => (
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
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchQuery || filterRole !== 'all' ? 'Пользователи не найдены' : 'Нет пользователей'}
              </h3>
              <p className="text-gray-500 mb-4">
                {searchQuery || filterRole !== 'all' 
                  ? 'Попробуйте изменить параметры поиска' 
                  : 'Добавьте первого пользователя, чтобы начать работу'
                }
              </p>
              {searchQuery || filterRole !== 'all' ? (
                <button
                  onClick={() => {
                    setSearchQuery('')
                    setFilterRole('all')
                  }}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors"
                >
                  Сбросить фильтры
                </button>
              ) : (
                <button
                  onClick={handleAddUser}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors"
                >
                  Добавить пользователя
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )

  return (
    <ProtectedRoute requiredRole="ADMIN">
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
        {/* Заголовок с навигацией */}
        <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
          <div className="px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Админ панель</h1>
                  <p className="text-sm text-gray-600 mt-1 hidden sm:block">
                    Управление системой и мониторинг активности
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Уведомления"
                >
                  <Bell className="w-5 h-5" />
                  {(stats?.recentUsers?.length || 0) + (stats?.recentStudents?.length || 0) + (stats?.recentLessons?.length || 0) > 0 && (
                    <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
                  )}
                </button>
                
                <button
                  onClick={() => fetchAdminStats(true)}
                  disabled={isRefreshing}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors disabled:opacity-50 text-sm font-medium"
                >
                  <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                  <span>Обновить</span>
                </button>
              </div>
            </div>

            {/* Горизонтальная навигация */}
            <div className="flex items-center justify-between">
              <nav className="hidden md:flex space-x-1 bg-gray-100 rounded-xl p-1">
                {[
                  { tab: 'overview', name: 'Обзор', icon: Home },
                  { tab: 'users', name: 'Пользователи', icon: Users },
                  { tab: 'lessons', name: 'Занятия', icon: Calendar },
                  { tab: 'toys', name: 'Игрушки', icon: Target },
                  { tab: 'analytics', name: 'Аналитика', icon: BarChart3 },
                  { tab: 'settings', name: 'Настройки', icon: Settings }
                ].map((item) => {
                  const isActive = activeTab === item.tab
                  return (
                    <button
                      key={item.tab}
                      onClick={() => setActiveTab(item.tab as any)}
                      className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                        isActive
                          ? 'bg-white text-red-600 shadow-sm'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
                      }`}
                    >
                      <item.icon className="w-4 h-4" />
                      <span>{item.name}</span>
                    </button>
                  )
                })}
              </nav>

              {/* Мобильное меню */}
              <div className="md:hidden">
                <button
                  onClick={() => setShowMobileMenu(!showMobileMenu)}
                  className="flex items-center space-x-2 px-4 py-2 bg-gray-100 rounded-lg text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-200 transition-colors"
                >
                  <Menu className="w-4 h-4" />
                  <span>Меню</span>
                </button>
              </div>
            </div>

            {/* Мобильное выпадающее меню */}
            {showMobileMenu && (
              <div className="md:hidden mt-4 bg-white rounded-xl border border-gray-200 shadow-lg">
                <div className="p-2 space-y-1">
                  {[
                    { tab: 'overview', name: 'Обзор', icon: Home },
                    { tab: 'users', name: 'Пользователи', icon: Users },
                    { tab: 'lessons', name: 'Занятия', icon: Calendar },
                    { tab: 'toys', name: 'Игрушки', icon: Target },
                    { tab: 'analytics', name: 'Аналитика', icon: BarChart3 },
                    { tab: 'settings', name: 'Настройки', icon: Settings }
                  ].map((item) => {
                    const isActive = activeTab === item.tab
                    return (
                      <button
                        key={item.tab}
                        onClick={() => {
                          setActiveTab(item.tab as any)
                          setShowMobileMenu(false)
                        }}
                        className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                          isActive
                            ? 'bg-red-50 text-red-600 border border-red-200'
                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                        }`}
                      >
                        <item.icon className="w-5 h-5" />
                        <span>{item.name}</span>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

          {/* Выпадающее меню уведомлений */}
          {showNotifications && (
            <div className="fixed top-20 right-4 sm:right-6 w-72 sm:w-80 bg-white rounded-2xl shadow-lg border border-gray-200 z-[10000] animate-in slide-in-from-top-2 duration-200">
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">Уведомления</h3>
                  <button
                    onClick={() => setShowNotifications(false)}
                    className="p-1 text-gray-400 hover:text-gray-600 rounded"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              <div className="max-h-96 overflow-y-auto">
                <div className="p-4 space-y-3">
                  {stats?.recentUsers && stats.recentUsers.length > 0 && (
                    <div className="flex items-center p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                      <AlertTriangle className="w-5 h-5 text-yellow-600 mr-3 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-900">
                          Новые пользователи: {stats.recentUsers.length}
                        </div>
                        <div className="text-sm text-gray-600 truncate">
                          Последний: {stats.recentUsers[0].name}
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {stats?.recentStudents && stats.recentStudents.length > 0 && (
                    <div className="flex items-center p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <Users className="w-5 h-5 text-blue-600 mr-3 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-900">
                          Новые ученики: {stats.recentStudents.length}
                        </div>
                        <div className="text-sm text-gray-600 truncate">
                          Последний: {stats.recentStudents[0].fullName}
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {stats?.recentLessons && stats.recentLessons.length > 0 && (
                    <div className="flex items-center p-3 bg-purple-50 rounded-lg border border-purple-200">
                      <Calendar className="w-5 h-5 text-purple-600 mr-3 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-900">
                          Новые занятия: {stats.recentLessons.length}
                        </div>
                        <div className="text-sm text-gray-600 truncate">
                          Последнее: {new Date(stats.recentLessons[0].date).toLocaleDateString('ru-RU')}
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex items-center p-3 bg-green-50 rounded-lg border border-green-200">
                    <CheckCircle className="w-5 h-5 text-green-600 mr-3 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900">Система работает стабильно</div>
                      <div className="text-sm text-gray-600">Все сервисы доступны</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

        {/* Хлебные крошки */}
        <div className="px-4 sm:px-6 lg:px-8 py-2 bg-gray-50 border-b border-gray-200">
          <nav className="flex items-center space-x-2 text-sm">
            <span className="text-gray-500">Админ панель</span>
            <span className="text-gray-400">/</span>
            <span className="text-gray-900 font-medium">
              {activeTab === 'overview' && 'Обзор'}
              {activeTab === 'users' && 'Пользователи'}
              {activeTab === 'lessons' && 'Занятия'}
              {activeTab === 'toys' && 'Игрушки'}
              {activeTab === 'analytics' && 'Аналитика'}
              {activeTab === 'settings' && 'Настройки'}
            </span>
          </nav>
        </div>

        {/* Контент */}
        <div className="px-4 sm:px-6 lg:px-8 py-4 min-h-screen bg-gray-50">
            {isRefreshing && (
              <div className="fixed top-20 right-4 sm:right-6 z-[10000] bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg flex items-center space-x-2 animate-in slide-in-from-top-2 duration-200">
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span className="text-sm">Обновление данных...</span>
              </div>
            )}
            
            <div className="transition-all duration-300 ease-in-out">
              {activeTab === 'overview' && (
                <div className="animate-in fade-in-0 slide-in-from-bottom-2 duration-300">
                  {renderOverview()}
                </div>
              )}
              {activeTab === 'users' && (
                <div className="animate-in fade-in-0 slide-in-from-bottom-2 duration-300">
                  {renderUsers()}
                </div>
              )}
              {activeTab === 'lessons' && (
                <div className="animate-in fade-in-0 slide-in-from-bottom-2 duration-300">
                  <LessonsManagement />
                </div>
              )}
              {activeTab === 'toys' && (
                <div className="animate-in fade-in-0 slide-in-from-bottom-2 duration-300">
                  <ToysManagement />
                </div>
              )}
              {activeTab === 'analytics' && (
                <div className="animate-in fade-in-0 slide-in-from-bottom-2 duration-300">
                  <AnalyticsDashboard />
                </div>
              )}
              {activeTab === 'settings' && (
                <div className="animate-in fade-in-0 slide-in-from-bottom-2 duration-300">
                  <SystemSettings />
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
