'use client'

import { useState, useEffect } from 'react'
import { DollarSign, Calendar, User, FileText, Eye } from 'lucide-react'
import { Payment } from '@/types'
import { apiRequest } from '@/lib/api'

interface PaymentsListProps {
  studentId?: number
}

export default function PaymentsList({ studentId }: PaymentsListProps) {
  const [payments, setPayments] = useState<Payment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showDetails, setShowDetails] = useState<number | null>(null)

  useEffect(() => {
    loadPayments()
  }, [studentId])

  const loadPayments = async () => {
    setIsLoading(true)
    try {
      const url = studentId 
        ? `/api/payments?studentId=${studentId}`
        : '/api/payments'
      
      const response = await apiRequest(url)
      if (response.ok) {
        const data = await response.json()
        setPayments(data)
      } else {
        console.error('Ошибка при загрузке платежей:', response.status)
      }
    } catch (error) {
      console.error('Ошибка при загрузке платежей:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatAmount = (amount: number) => {
    return amount.toLocaleString('ru-RU', {
      style: 'currency',
      currency: 'KZT'
    })
  }

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
          <span className="ml-3 text-gray-600">Загрузка платежей...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <DollarSign className="w-6 h-6 text-green-600 mr-3" />
          <h3 className="text-xl font-bold text-gray-900">История платежей</h3>
        </div>
        <span className="text-sm text-gray-500">
          Всего: {payments.length}
        </span>
      </div>

      {payments.length === 0 ? (
        <div className="text-center py-8">
          <DollarSign className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <p className="text-gray-500">Платежи не найдены</p>
        </div>
      ) : (
        <div className="space-y-4">
          {payments.map((payment) => (
            <div
              key={payment.id}
              className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center mb-2">
                    <User className="w-4 h-4 text-gray-500 mr-2" />
                    <span className="font-medium text-gray-900">
                      {payment.student?.fullName || 'Неизвестный ученик'}
                    </span>
                  </div>
                  
                  <div className="flex items-center text-sm text-gray-600 mb-2">
                    <Calendar className="w-4 h-4 mr-2" />
                    <span>{formatDate(payment.date)}</span>
                  </div>

                  {payment.description && (
                    <div className="flex items-start text-sm text-gray-600">
                      <FileText className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
                      <span className="line-clamp-2">{payment.description}</span>
                    </div>
                  )}

                  {payment.lessonIds && payment.lessonIds.length > 0 && (
                    <div className="mt-2">
                      <button
                        onClick={() => setShowDetails(showDetails === payment.id ? null : payment.id)}
                        className="flex items-center text-sm text-green-600 hover:text-green-700 font-medium"
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        {showDetails === payment.id ? 'Скрыть' : 'Показать'} уроки ({payment.lessonIds.length})
                      </button>
                      
                      {showDetails === payment.id && (
                        <div className="mt-2 pl-4 border-l-2 border-green-200">
                          {payment.lessonIds.map((lessonId, index) => (
                            <div key={index} className="text-sm text-gray-600 py-1">
                              • Урок ID: {lessonId}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="text-right">
                  <div className="text-xl font-bold text-green-600">
                    {formatAmount(payment.amount)}
                  </div>
                  <div className="text-xs text-gray-500">
                    ID: {payment.id}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
