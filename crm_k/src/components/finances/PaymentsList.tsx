'use client'

import { useState, useEffect } from 'react'
import { DollarSign, Calendar, User, FileText, Eye, ChevronRight } from 'lucide-react'
import { Payment } from '@/types'
import { apiRequest } from '@/lib/api'

interface PaymentsListProps {
  studentId?: number
}

export default function PaymentsList({ studentId }: PaymentsListProps) {
  const [payments, setPayments] = useState<Payment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showDetails, setShowDetails] = useState<number | null>(null)
  const [showModal, setShowModal] = useState(false)

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

  // Показываем максимум 3 элемента, чтобы они поместились в фиксированную высоту
  const maxVisibleItems = 3
  const displayedPayments = payments.slice(0, maxVisibleItems)
  const hasMorePayments = payments.length > maxVisibleItems

  return (
    <>
      <div className="bg-white rounded-2xl shadow-lg h-[600px] flex flex-col">
        <div className="p-6 flex-shrink-0">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <DollarSign className="w-6 h-6 text-green-600 mr-3" />
              <h3 className="text-xl font-bold text-gray-900">История платежей</h3>
            </div>
            <span className="text-sm text-gray-500">
              Всего: {payments.length}
            </span>
          </div>
        </div>

        <div className="flex-1 overflow-hidden">
          {payments.length === 0 ? (
            <div className="text-center py-8 px-6">
              <DollarSign className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-500">Платежи не найдены</p>
            </div>
          ) : (
            <div className="px-6 pb-6">
              <div className="space-y-4">
                {displayedPayments.map((payment) => (
                  <div
                    key={payment.id}
                    className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow flex-shrink-0"
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
            </div>
          )}
        </div>
        {hasMorePayments && (
          <div className="px-6 py-4 border-t border-gray-200 flex-shrink-0">
            <button
              onClick={() => setShowModal(true)}
              className="w-full flex items-center justify-center px-4 py-2 text-sm font-medium text-gray-700 bg-gray-50 border border-gray-300 rounded-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
            >
              <ChevronRight className="w-4 h-4 mr-2" />
              Показать все платежи ({payments.length})
            </button>
          </div>
        )}
      </div>

      {/* Модальное окно для полной истории платежей */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col">
            {/* Заголовок модального окна */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-green-50 to-green-100 rounded-t-2xl">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <DollarSign className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">История платежей</h3>
                  <p className="text-sm text-gray-600">
                    {payments.length} {payments.length === 1 ? 'платеж' : 'платежей'} получено
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Контент модального окна */}
            <div className="flex-1 overflow-y-auto p-6">
              {payments.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <DollarSign className="w-8 h-8 text-gray-400" />
                  </div>
                  <h4 className="text-lg font-medium text-gray-900 mb-2">Платежи не найдены</h4>
                  <p className="text-gray-500">История платежей будет отображаться здесь</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {payments.map((payment, index) => (
                    <div key={payment.id} className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-all duration-200 hover:border-green-200">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-4 flex-1">
                          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                            <span className="text-sm font-bold text-green-600">#{index + 1}</span>
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-3">
                              <h4 className="text-lg font-semibold text-gray-900">
                                {payment.student?.fullName || 'Неизвестный ученик'}
                              </h4>
                              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                                Получен
                              </span>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                              <div className="flex items-center text-sm text-gray-600">
                                <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                                <span className="font-medium">{formatDate(payment.date)}</span>
                              </div>
                              <div className="flex items-center text-sm text-gray-600">
                                <FileText className="w-4 h-4 mr-2 text-gray-400" />
                                <span>ID: {payment.id}</span>
                              </div>
                            </div>

                            {payment.description && (
                              <div className="mb-4">
                                <div className="flex items-start text-sm text-gray-600">
                                  <FileText className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
                                  <span className="line-clamp-2">{payment.description}</span>
                                </div>
                              </div>
                            )}

                            {payment.lessonIds && payment.lessonIds.length > 0 && (
                              <div className="mt-4">
                                <button
                                  onClick={() => setShowDetails(showDetails === payment.id ? null : payment.id)}
                                  className="flex items-center text-sm text-green-600 hover:text-green-700 font-medium mb-2"
                                >
                                  <Eye className="w-4 h-4 mr-1" />
                                  {showDetails === payment.id ? 'Скрыть' : 'Показать'} уроки ({payment.lessonIds.length})
                                </button>
                                
                                {showDetails === payment.id && (
                                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                                    <div className="text-sm font-medium text-green-800 mb-2">Оплаченные уроки:</div>
                                    <div className="space-y-1">
                                      {payment.lessonIds.map((lessonId, index) => (
                                        <div key={index} className="text-sm text-green-700 flex items-center">
                                          <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                                          Урок ID: {lessonId}
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="text-right ml-6">
                          <div className="text-3xl font-bold text-green-600 mb-1">
                            {formatAmount(payment.amount)}
                          </div>
                          <div className="text-sm text-gray-500 font-medium">получено</div>
                          <div className="mt-2">
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-200">
                              Успешно
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Подвал модального окна */}
            <div className="border-t border-gray-200 p-6 bg-gray-50 rounded-b-2xl">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  <span className="font-medium">Общая сумма платежей:</span>
                  <span className="ml-2 text-lg font-bold text-green-600">
                    {formatAmount(payments.reduce((sum, payment) => sum + payment.amount, 0))}
                  </span>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                >
                  Закрыть
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
