'use client'

import { useState, useEffect } from 'react'
import { AlertCircle, Phone, Calendar, ChevronRight, CheckCircle } from 'lucide-react'
import { DebtInfo } from '@/types'
import { apiRequest } from '@/lib/api'

export default function DebtsList() {
  const [debts, setDebts] = useState<DebtInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)

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

  // Показываем максимум 3 элемента, чтобы они поместились в фиксированную высоту
  const maxVisibleItems = 3
  const displayedDebts = debts.slice(0, maxVisibleItems)
  const hasMoreDebts = debts.length > maxVisibleItems

  return (
    <>
      <div className="bg-white rounded-lg shadow-sm border h-[600px] flex flex-col">
        <div className="px-6 py-4 border-b border-gray-200 flex-shrink-0">
          <h3 className="text-lg font-medium text-gray-900">Задолженности</h3>
          <p className="text-sm text-gray-500">
            {debts.length} {debts.length === 1 ? 'ученик' : 'учеников'} с задолженностями
          </p>
        </div>
        <div className="flex-1 overflow-hidden">
          <div className="divide-y divide-gray-200 h-full">
            {displayedDebts.map((debt) => (
              <div key={debt.student.id} className="p-6 flex-shrink-0">
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
        {hasMoreDebts && (
          <div className="px-6 py-4 border-t border-gray-200 flex-shrink-0">
            <button
              onClick={() => setShowModal(true)}
              className="w-full flex items-center justify-center px-4 py-2 text-sm font-medium text-gray-700 bg-gray-50 border border-gray-300 rounded-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              <ChevronRight className="w-4 h-4 mr-2" />
              Показать все задолженности ({debts.length})
            </button>
          </div>
        )}
      </div>

      {/* Модальное окно для полного списка задолженностей */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
            {/* Заголовок модального окна */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-red-50 to-red-100 rounded-t-2xl">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-red-100 rounded-lg">
                  <AlertCircle className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Все задолженности</h3>
                  <p className="text-sm text-gray-600">
                    {debts.length} {debts.length === 1 ? 'ученик' : 'учеников'} с задолженностями
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
              {debts.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-8 h-8 text-green-600" />
                  </div>
                  <h4 className="text-lg font-medium text-gray-900 mb-2">Нет задолженностей</h4>
                  <p className="text-gray-500">Все платежи получены вовремя</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {debts.map((debt, index) => (
                    <div key={debt.student.id} className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-all duration-200 hover:border-red-200">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-3">
                            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                              <span className="text-sm font-bold text-red-600">#{index + 1}</span>
                            </div>
                            <div>
                              <h4 className="text-lg font-semibold text-gray-900">
                                {debt.student.fullName}
                              </h4>
                              <div className="flex items-center space-x-4 mt-1">
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                                  {debt.unpaidLessons} {debt.unpaidLessons === 1 ? 'занятие' : 'занятий'}
                                </span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                            <div className="flex items-center text-sm text-gray-600">
                              <Phone className="w-4 h-4 mr-2 text-gray-400" />
                              <span className="font-medium">{debt.student.phone}</span>
                            </div>
                            <div className="flex items-center text-sm text-gray-600">
                              <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                              <span>Последний платеж: {formatDate(debt.lastPaymentDate)}</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="text-right ml-6">
                          <div className="text-3xl font-bold text-red-600 mb-1">
                            {formatCurrency(debt.totalDebt)}
                          </div>
                          <div className="text-sm text-gray-500 font-medium">задолженность</div>
                          <div className="mt-2">
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-200">
                              Требует внимания
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
                  <span className="font-medium">Общая сумма задолженностей:</span>
                  <span className="ml-2 text-lg font-bold text-red-600">
                    {formatCurrency(debts.reduce((sum, debt) => sum + debt.totalDebt, 0))}
                  </span>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
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
