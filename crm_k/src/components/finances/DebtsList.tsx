'use client'

import { useState, useEffect } from 'react'
import { AlertCircle, Phone, Calendar } from 'lucide-react'
import { DebtInfo } from '@/types'
import { apiRequest } from '@/lib/api'

export default function DebtsList() {
  const [debts, setDebts] = useState<DebtInfo[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDebts()
  }, [])

  const fetchDebts = async () => {
    try {
      setLoading(true)
      const response = await apiRequest('/api/finances/debts')
      if (response.ok) {
        const data = await response.json()
        setDebts(data)
      } else {
        console.error('Ошибка при загрузке задолженностей:', response.status, response.statusText)
      }
    } catch (error) {
      console.error('Ошибка при загрузке задолженностей:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'KZT',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const formatDate = (date: Date | undefined) => {
    if (!date) return 'Никогда'
    return new Intl.DateTimeFormat('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(new Date(date))
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Задолженности</h3>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (debts.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Задолженности</h3>
        </div>
        <div className="p-6">
          <div className="text-center py-8">
            <AlertCircle className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Нет задолженностей</h3>
            <p className="mt-1 text-sm text-gray-500">
              Все платежи получены вовремя.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">Задолженности</h3>
        <p className="text-sm text-gray-500">
          {debts.length} {debts.length === 1 ? 'ученик' : 'учеников'} с задолженностями
        </p>
      </div>
      <div className="divide-y divide-gray-200">
        {debts.map((debt) => (
          <div key={debt.student.id} className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center">
                  <h4 className="text-lg font-medium text-gray-900">
                    {debt.student.fullName}
                  </h4>
                  <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                    {debt.unpaidLessons} {debt.unpaidLessons === 1 ? 'занятие' : 'занятий'}
                  </span>
                </div>
                <div className="mt-1 flex items-center text-sm text-gray-500">
                  <Phone className="w-4 h-4 mr-1" />
                  {debt.student.phone}
                </div>
                <div className="mt-1 flex items-center text-sm text-gray-500">
                  <Calendar className="w-4 h-4 mr-1" />
                  Последний платеж: {formatDate(debt.lastPaymentDate)}
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-red-600">
                  {formatCurrency(debt.totalDebt)}
                </div>
                <div className="text-sm text-gray-500">задолженность</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
