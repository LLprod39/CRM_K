'use client'

import { useState, useEffect } from 'react'
import { DollarSign, Printer } from 'lucide-react'
import FinancialStats from '@/components/finances/FinancialStats'
import RevenueChart from '@/components/finances/RevenueChart'
import DebtsList from '@/components/finances/DebtsList'
import LessonHistory from '@/components/finances/LessonHistory'
import PeriodFilters from '@/components/finances/PeriodFilters'
import AddPaymentForm from '@/components/forms/AddPaymentForm'
import PaymentsList from '@/components/finances/PaymentsList'
import { printElement } from '@/lib/print'
import { Student } from '@/types'
import { apiRequest } from '@/lib/api'
import { autoUpdateLessonStatuses } from '@/lib/lessonUtils'

export default function FinancesPage() {
  const [period, setPeriod] = useState('month')
  const [dateRange, setDateRange] = useState({ startDate: '', endDate: '' })
  const [isPaymentFormOpen, setIsPaymentFormOpen] = useState(false)
  const [students, setStudents] = useState<Student[]>([])
  const [isLoadingStudents, setIsLoadingStudents] = useState(false)

  const handlePeriodChange = (newPeriod: string) => {
    setPeriod(newPeriod)
  }

  const handleDateRangeChange = (startDate: string, endDate: string) => {
    setDateRange({ startDate, endDate })
  }

  // Загрузка списка учеников и обновление статусов занятий
  useEffect(() => {
    const loadStudents = async () => {
      setIsLoadingStudents(true)
      try {
        // Сначала автоматически обновляем статусы прошедших занятий
        const token = localStorage.getItem('token');
        if (token) {
          try {
            await autoUpdateLessonStatuses(token);
          } catch (error) {
            console.error('Ошибка при автоматическом обновлении статусов:', error);
          }
        }

        const response = await apiRequest('/api/students')
        if (response.ok) {
          const data = await response.json()
          setStudents(data)
        } else {
          console.error('Ошибка при загрузке учеников:', response.status)
        }
      } catch (error) {
        console.error('Ошибка при загрузке учеников:', error)
      } finally {
        setIsLoadingStudents(false)
      }
    }

    loadStudents()
  }, [])

  const handlePaymentAdded = () => {
    // Обновляем данные на странице после добавления платежа
    window.location.reload()
  }

  const handleExport = async (format: 'xlsx' | 'csv') => {
    try {
      const params = new URLSearchParams()
      params.append('format', format)
      
      if (dateRange.startDate && dateRange.endDate) {
        params.append('startDate', dateRange.startDate)
        params.append('endDate', dateRange.endDate)
      }

      const response = await fetch(`/api/finances/export?${params}`)
      
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `finances_export_${new Date().toISOString().split('T')[0]}.${format}`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      } else {
        console.error('Ошибка при экспорте данных')
      }
    } catch (error) {
      console.error('Ошибка при экспорте данных:', error)
    }
  }

  return (
    <div className="space-y-6">
      {/* Заголовок и действия */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div className="animate-fade-in">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 flex items-center">
            <DollarSign className="w-8 h-8 text-green-600 mr-3" />
            Финансы
          </h1>
          <p className="mt-2 text-gray-600 text-lg">
            Управление финансами и отчетность
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex flex-col sm:flex-row gap-3 animate-scale-in">
          <button 
            onClick={() => printElement('finances-content', 'Финансовый отчет')}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-xl shadow-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-all duration-200 hover:scale-105"
          >
            <Printer className="w-4 h-4 mr-2" />
            Печать
          </button>
          <button 
            onClick={() => setIsPaymentFormOpen(true)}
            disabled={isLoadingStudents}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-xl shadow-lg text-sm font-medium text-white bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <DollarSign className="w-4 h-4 mr-2" />
            {isLoadingStudents ? 'Загрузка...' : 'Добавить платеж'}
          </button>
        </div>
      </div>

      {/* Контент для печати */}
      <div id="finances-content" className="space-y-6">
        {/* Фильтры периода */}
        <PeriodFilters
          period={period}
          onPeriodChange={handlePeriodChange}
          onDateRangeChange={handleDateRangeChange}
          onExport={handleExport}
        />

        {/* Основная статистика */}
        <FinancialStats
          period={period}
          onPeriodChange={handlePeriodChange}
        />

        {/* График доходов */}
        <RevenueChart period={period} />

        {/* Нижняя часть с тремя колонками */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Список задолженностей */}
          <DebtsList />

          {/* История занятий */}
          <LessonHistory />

          {/* История платежей */}
          <PaymentsList />
        </div>
      </div>

      {/* Форма добавления платежа */}
      <AddPaymentForm
        isOpen={isPaymentFormOpen}
        onClose={() => setIsPaymentFormOpen(false)}
        onPaymentAdded={handlePaymentAdded}
        students={students}
      />
    </div>
  )
}
