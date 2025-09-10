'use client'

import { useState, useEffect } from 'react'
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown,
  Users,
  BookOpen,
  DollarSign,
  Calendar,
  PieChart,
  LineChart,
  Activity,
  Download,
  RefreshCw,
  Eye,
  Target,
  Clock,
  CheckCircle,
  XCircle
} from 'lucide-react'
import { apiRequest } from '@/lib/api'
import { cn } from '@/lib/utils'

interface AnalyticsDashboardProps {
  className?: string
}

interface AnalyticsData {
  totalUsers: number
  totalStudents: number
  totalLessons: number
  totalRevenue: number
  monthlyStats: Array<{
    month: string
    users: number
    students: number
    lessons: number
    revenue: number
  }>
  userStats: Array<{
    name: string
    students: number
    lessons: number
    revenue: number
  }>
  lessonStats: {
    completed: number
    paid: number
    scheduled: number
    cancelled: number
  }
  recentActivity: Array<{
    type: string
    description: string
    date: string
    value?: number
  }>
}

export default function AnalyticsDashboard({ className }: AnalyticsDashboardProps) {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'quarter' | 'year'>('month')
  const [isRefreshing, setIsRefreshing] = useState(false)

  useEffect(() => {
    fetchAnalytics()
  }, [timeRange])

  const fetchAnalytics = async (showRefresh = false) => {
    try {
      if (showRefresh) {
        setIsRefreshing(true)
      } else {
        setLoading(true)
      }
      
      const response = await apiRequest('/api/admin/stats')
      if (response.ok) {
        const stats = await response.json()
        
        // Генерируем аналитические данные на основе статистики
        const analyticsData: AnalyticsData = {
          totalUsers: stats.totalUsers,
          totalStudents: stats.totalStudents,
          totalLessons: stats.totalLessons,
          totalRevenue: stats.totalRevenue,
          monthlyStats: generateMonthlyStats(stats),
          userStats: generateUserStats(stats.usersWithStats),
          lessonStats: generateLessonStats(stats.recentLessons),
          recentActivity: generateRecentActivity(stats)
        }
        
        setData(analyticsData)
      }
    } catch (error) {
      console.error('Ошибка загрузки аналитики:', error)
    } finally {
      setLoading(false)
      setIsRefreshing(false)
    }
  }

  const generateMonthlyStats = (stats: any) => {
    const months = []
    const now = new Date()
    
    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthName = date.toLocaleDateString('ru-RU', { month: 'short', year: 'numeric' })
      
      // Генерируем случайные данные для демонстрации
      const baseValue = Math.floor(Math.random() * 20) + 10
      
      months.push({
        month: monthName,
        users: Math.floor(baseValue * 0.3),
        students: Math.floor(baseValue * 0.8),
        lessons: Math.floor(baseValue * 1.2),
        revenue: Math.floor(baseValue * 5000)
      })
    }
    
    return months
  }

  const generateUserStats = (users: any[]) => {
    return users.slice(0, 5).map(user => ({
      name: user.name,
      students: user.stats.totalStudents,
      lessons: user.stats.totalLessons,
      revenue: user.stats.totalRevenue
    }))
  }

  const generateLessonStats = (lessons: any[]) => {
    return {
      completed: lessons.filter(l => l.isCompleted && l.isPaid).length,
      paid: lessons.filter(l => l.isPaid).length,
      scheduled: lessons.filter(l => !l.isCompleted && !l.isCancelled).length,
      cancelled: lessons.filter(l => l.isCancelled).length
    }
  }

  const generateRecentActivity = (stats: any) => {
    const activities = []
    
    // Добавляем активности на основе данных
    if (stats.recentUsers.length > 0) {
      activities.push({
        type: 'user',
        description: `Новый пользователь: ${stats.recentUsers[0].name}`,
        date: new Date(stats.recentUsers[0].createdAt).toLocaleDateString('ru-RU')
      })
    }
    
    if (stats.recentStudents.length > 0) {
      activities.push({
        type: 'student',
        description: `Новый ученик: ${stats.recentStudents[0].fullName}`,
        date: new Date(stats.recentStudents[0].createdAt).toLocaleDateString('ru-RU')
      })
    }
    
    if (stats.recentLessons.length > 0) {
      const lesson = stats.recentLessons[0]
      activities.push({
        type: 'lesson',
        description: `Новое занятие: ${lesson.student?.fullName || 'Неизвестно'}`,
        date: new Date(lesson.date).toLocaleDateString('ru-RU'),
        value: lesson.cost
      })
    }
    
    return activities
  }

  const exportAnalytics = () => {
    if (!data) return
    
    const csvContent = [
      ['Показатель', 'Значение'],
      ['Всего пользователей', data.totalUsers],
      ['Всего учеников', data.totalStudents],
      ['Всего занятий', data.totalLessons],
      ['Общий доход', data.totalRevenue],
      [''],
      ['Месяц', 'Пользователи', 'Ученики', 'Занятия', 'Доход'],
      ...data.monthlyStats.map(stat => [
        stat.month,
        stat.users,
        stat.students,
        stat.lessons,
        stat.revenue
      ])
    ].map(row => row.map(field => `"${field}"`).join(',')).join('\n')
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', 'analytics.csv')
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <BarChart3 className="w-6 h-6 text-blue-600" />
          </div>
          <div className="text-lg font-medium text-gray-900">Загрузка аналитики...</div>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="text-center py-12">
        <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Ошибка загрузки</h3>
        <p className="text-gray-500">Не удалось загрузить данные аналитики</p>
      </div>
    )
  }

  return (
    <div className={cn("space-y-6 max-w-7xl mx-auto", className)}>
      {/* Заголовок и управление */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Аналитика</h2>
          <p className="text-gray-600 mt-1">Детальная статистика и отчеты системы</p>
        </div>
        
        <div className="flex items-center space-x-3">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as any)}
            className="px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="week">Неделя</option>
            <option value="month">Месяц</option>
            <option value="quarter">Квартал</option>
            <option value="year">Год</option>
          </select>
          
          <button
            onClick={() => fetchAnalytics(true)}
            disabled={isRefreshing}
            className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center"
          >
            <RefreshCw className={cn("w-4 h-4 mr-2", isRefreshing && "animate-spin")} />
            Обновить
          </button>
          
          <button
            onClick={exportAnalytics}
            className="px-4 py-2 bg-gray-600 text-white rounded-xl hover:bg-gray-700 transition-colors flex items-center"
          >
            <Download className="w-4 h-4 mr-2" />
            Экспорт
          </button>
        </div>
      </div>

      {/* Основные метрики */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-medium">Пользователи</p>
              <p className="text-3xl font-bold">{data.totalUsers}</p>
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
              <p className="text-3xl font-bold">{data.totalStudents}</p>
              <p className="text-green-100 text-xs mt-1">зарегистрировано</p>
            </div>
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <Target className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm font-medium">Занятия</p>
              <p className="text-3xl font-bold">{data.totalLessons}</p>
              <p className="text-purple-100 text-xs mt-1">проведено</p>
            </div>
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <BookOpen className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-yellow-500 to-orange-500 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-yellow-100 text-sm font-medium">Доход</p>
              <p className="text-3xl font-bold">{data.totalRevenue.toLocaleString()} ₸</p>
              <p className="text-yellow-100 text-xs mt-1">общий доход</p>
            </div>
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <DollarSign className="w-6 h-6" />
            </div>
          </div>
        </div>
      </div>

      {/* Графики и диаграммы */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
        {/* Статистика занятий */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 sm:p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
            <PieChart className="w-5 h-5 mr-2 text-blue-600" />
            Статистика занятий
          </h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-green-50 rounded-xl">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                </div>
                <span className="font-medium text-gray-900">Проведено</span>
              </div>
              <span className="text-xl font-bold text-green-600">{data.lessonStats.completed}</span>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-xl">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <DollarSign className="w-4 h-4 text-blue-600" />
                </div>
                <span className="font-medium text-gray-900">Оплачено</span>
              </div>
              <span className="text-xl font-bold text-blue-600">{data.lessonStats.paid}</span>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-xl">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                  <Clock className="w-4 h-4 text-yellow-600" />
                </div>
                <span className="font-medium text-gray-900">Запланировано</span>
              </div>
              <span className="text-xl font-bold text-yellow-600">{data.lessonStats.scheduled}</span>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-red-50 rounded-xl">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                  <XCircle className="w-4 h-4 text-red-600" />
                </div>
                <span className="font-medium text-gray-900">Отменено</span>
              </div>
              <span className="text-xl font-bold text-red-600">{data.lessonStats.cancelled}</span>
            </div>
          </div>
        </div>

        {/* Топ преподавателей */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 sm:p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
            <TrendingUp className="w-5 h-5 mr-2 text-green-600" />
            Топ преподавателей
          </h3>
          
          <div className="space-y-4">
            {data.userStats.map((user, index) => (
              <div key={user.name} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-bold text-blue-600">#{index + 1}</span>
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">{user.name}</div>
                    <div className="text-sm text-gray-600">{user.students} учеников</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-gray-900">{user.lessons} занятий</div>
                  <div className="text-sm text-green-600">{user.revenue.toLocaleString()} ₸</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Месячная статистика */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 sm:p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
          <LineChart className="w-5 h-5 mr-2 text-purple-600" />
          Динамика за последние 12 месяцев
        </h3>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-medium text-gray-600">Месяц</th>
                <th className="text-right py-3 px-4 font-medium text-gray-600">Пользователи</th>
                <th className="text-right py-3 px-4 font-medium text-gray-600">Ученики</th>
                <th className="text-right py-3 px-4 font-medium text-gray-600">Занятия</th>
                <th className="text-right py-3 px-4 font-medium text-gray-600">Доход</th>
              </tr>
            </thead>
            <tbody>
              {data.monthlyStats.map((stat, index) => (
                <tr key={stat.month} className={cn(
                  "border-b border-gray-100",
                  index % 2 === 0 ? "bg-gray-50" : "bg-white"
                )}>
                  <td className="py-3 px-4 font-medium text-gray-900">{stat.month}</td>
                  <td className="py-3 px-4 text-right text-gray-600">{stat.users}</td>
                  <td className="py-3 px-4 text-right text-gray-600">{stat.students}</td>
                  <td className="py-3 px-4 text-right text-gray-600">{stat.lessons}</td>
                  <td className="py-3 px-4 text-right font-medium text-green-600">{stat.revenue.toLocaleString()} ₸</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Последняя активность */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 sm:p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
          <Activity className="w-5 h-5 mr-2 text-orange-600" />
          Последняя активность
        </h3>
        
        <div className="space-y-4">
          {data.recentActivity.map((activity, index) => (
            <div key={index} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-xl">
              <div className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center",
                activity.type === 'user' && "bg-blue-100",
                activity.type === 'student' && "bg-green-100",
                activity.type === 'lesson' && "bg-purple-100"
              )}>
                {activity.type === 'user' && <Users className="w-5 h-5 text-blue-600" />}
                {activity.type === 'student' && <Target className="w-5 h-5 text-green-600" />}
                {activity.type === 'lesson' && <BookOpen className="w-5 h-5 text-purple-600" />}
              </div>
              
              <div className="flex-1">
                <div className="font-medium text-gray-900">{activity.description}</div>
                <div className="text-sm text-gray-600">{activity.date}</div>
              </div>
              
              {activity.value && (
                <div className="text-lg font-bold text-green-600">
                  {activity.value.toLocaleString()} ₸
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
