'use client'

import { useState, useEffect } from 'react'
import { DollarSign, TrendingUp, AlertCircle, BarChart3, User } from 'lucide-react'
import type { FinancialStats } from '@/types'
import { useAuth } from '@/contexts/AuthContext'

interface FinancialStatsProps {
  period: string
  onPeriodChange?: (period: string) => void
}

export default function FinancialStats({ period }: FinancialStatsProps) {
  const [stats, setStats] = useState<FinancialStats | null>(null)
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()

  useEffect(() => {
    fetchStats()
  }, [period]) // eslint-disable-line react-hooks/exhaustive-deps

  const fetchStats = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/finances/stats?period=${period}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      } else {
        console.error('Ошибка при загрузке статистики:', response.status, response.statusText)
      }
    } catch (error) {
      console.error('Ошибка при загрузке статистики:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      minimumFractionDigits: 0
    }).format(amount)
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white p-6 rounded-lg shadow-sm border animate-pulse">
            <div className="flex items-center">
              <div className="p-2 bg-gray-100 rounded-lg">
                <div className="w-6 h-6 bg-gray-200 rounded"></div>
              </div>
              <div className="ml-4">
                <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-16"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="text-center py-8">
        <AlertCircle className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">Ошибка загрузки</h3>
        <p className="mt-1 text-sm text-gray-500">
          Не удалось загрузить финансовую статистику
        </p>
      </div>
    )
  }

  const getRevenueForPeriod = () => {
    switch (period) {
      case 'day': return stats.dailyRevenue
      case 'week': return stats.weeklyRevenue
      case 'month': return stats.monthlyRevenue
      default: return stats.totalRevenue
    }
  }

  const averageCheck = stats.topStudents.length > 0 
    ? stats.topStudents.reduce((sum, student) => sum + student.totalPaid, 0) / stats.topStudents.length
    : 0

  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 ${user?.role === 'ADMIN' ? 'lg:grid-cols-6' : 'lg:grid-cols-5'} gap-6`}>
      {/* Общий доход */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <div className="flex items-center">
          <div className="p-2 bg-green-100 rounded-lg">
            <DollarSign className="w-6 h-6 text-green-600" />
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-600">Общий доход</p>
            <p className="text-2xl font-bold text-gray-900">
              {formatCurrency(stats.totalRevenue)}
            </p>
          </div>
        </div>
      </div>

      {/* Доход за период */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <div className="flex items-center">
          <div className="p-2 bg-blue-100 rounded-lg">
            <TrendingUp className="w-6 h-6 text-blue-600" />
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-600">
              Доход за {period === 'day' ? 'день' : period === 'week' ? 'неделю' : period === 'month' ? 'месяц' : 'все время'}
            </p>
            <p className="text-2xl font-bold text-gray-900">
              {formatCurrency(getRevenueForPeriod())}
            </p>
          </div>
        </div>
      </div>

      {/* Задолженности */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <div className="flex items-center">
          <div className="p-2 bg-red-100 rounded-lg">
            <AlertCircle className="w-6 h-6 text-red-600" />
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-600">Задолженности</p>
            <p className="text-2xl font-bold text-gray-900">
              {formatCurrency(stats.totalDebt)}
            </p>
          </div>
        </div>
      </div>

      {/* Предоплаченные занятия */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <div className="flex items-center">
          <div className="p-2 bg-yellow-100 rounded-lg">
            <AlertCircle className="w-6 h-6 text-yellow-600" />
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-600">Предоплачено</p>
            <p className="text-2xl font-bold text-gray-900">
              {formatCurrency(stats.totalPrepaid || 0)}
            </p>
            <p className="text-xs text-gray-500">
              {stats.prepaidLessons || 0} занятий
            </p>
          </div>
        </div>
      </div>

      {/* Доход от пользователя (только для админа) */}
      {user?.role === 'ADMIN' && (
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-indigo-100 rounded-lg">
              <User className="w-6 h-6 text-indigo-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Доход от пользователя</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(stats.userRevenue || 0)}
              </p>
              <p className="text-xs text-gray-500">
                30% от оплаченных уроков
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Средний чек */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <div className="flex items-center">
          <div className="p-2 bg-purple-100 rounded-lg">
            <BarChart3 className="w-6 h-6 text-purple-600" />
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-600">Средний чек</p>
            <p className="text-2xl font-bold text-gray-900">
              {formatCurrency(averageCheck)}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
