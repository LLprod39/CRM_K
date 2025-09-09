'use client'

import { useState, useEffect } from 'react'
import { DollarSign, Users, Trophy, Star } from 'lucide-react'
import { FinancialStats } from '@/types'

export default function TopStudents() {
  const [topStudents, setTopStudents] = useState<FinancialStats['topStudents']>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchTopStudents()
  }, [])

  const fetchTopStudents = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      const response = await fetch('/api/finances/stats', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })
      if (response.ok) {
        const data: FinancialStats = await response.json()
        setTopStudents(data.topStudents)
      } else {
        console.error('Ошибка при загрузке топ учеников:', response.status, response.statusText)
      }
    } catch (error) {
      console.error('Ошибка при загрузке топ учеников:', error)
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

  const getRankIcon = (index: number) => {
    switch (index) {
      case 0:
        return <Trophy className="w-5 h-5 text-yellow-500" />
      case 1:
        return <Star className="w-5 h-5 text-gray-400" />
      case 2:
        return <Star className="w-5 h-5 text-orange-400" />
      default:
        return <span className="w-5 h-5 flex items-center justify-center text-sm font-medium text-gray-500 bg-gray-100 rounded-full">
          {index + 1}
        </span>
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Топ учеников по оплатам</h3>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="animate-pulse flex items-center">
                <div className="w-8 h-8 bg-gray-200 rounded-full mr-4"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
                <div className="h-6 bg-gray-200 rounded w-16"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (topStudents.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Топ учеников по оплатам</h3>
        </div>
        <div className="p-6">
          <div className="text-center py-8">
            <DollarSign className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Нет данных</h3>
            <p className="mt-1 text-sm text-gray-500">
              Начните с добавления учеников и занятий.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">Топ учеников по оплатам</h3>
        <p className="text-sm text-gray-500">
          Рейтинг по общей сумме оплат
        </p>
      </div>
      <div className="divide-y divide-gray-200">
        {topStudents.map((studentData, index) => (
          <div key={studentData.student.id} className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 mr-4">
                {getRankIcon(index)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center">
                  <h4 className="text-lg font-medium text-gray-900 truncate">
                    {studentData.student.fullName}
                  </h4>
                  <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    {studentData.lessonsCount} {studentData.lessonsCount === 1 ? 'занятие' : 'занятий'}
                  </span>
                </div>
                <div className="mt-1 flex items-center text-sm text-gray-500">
                  <Users className="w-4 h-4 mr-1" />
                  Возраст: {studentData.student.age} лет
                </div>
                {studentData.student.diagnosis && (
                  <div className="mt-1 text-sm text-gray-500">
                    {studentData.student.diagnosis}
                  </div>
                )}
              </div>
              <div className="flex-shrink-0 text-right">
                <div className="text-2xl font-bold text-green-600">
                  {formatCurrency(studentData.totalPaid)}
                </div>
                <div className="text-sm text-gray-500">оплачено</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
