'use client'

import { useState } from 'react'
import { DollarSign, Printer } from 'lucide-react'
import FinancialStats from '@/components/finances/FinancialStats'
import RevenueChart from '@/components/finances/RevenueChart'
import DebtsList from '@/components/finances/DebtsList'
import TopStudents from '@/components/finances/TopStudents'
import PeriodFilters from '@/components/finances/PeriodFilters'
import { printElement } from '@/lib/print'

export default function FinancesPage() {
  const [period, setPeriod] = useState('month')
  const [dateRange, setDateRange] = useState({ startDate: '', endDate: '' })

  const handlePeriodChange = (newPeriod: string) => {
    setPeriod(newPeriod)
  }

  const handleDateRangeChange = (startDate: string, endDate: string) => {
    setDateRange({ startDate, endDate })
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
          <button className="inline-flex items-center px-4 py-2 border border-transparent rounded-xl shadow-lg text-sm font-medium text-white bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 transition-all duration-200 hover:scale-105">
            <DollarSign className="w-4 h-4 mr-2" />
            Добавить платеж
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

        {/* Нижняя часть с двумя колонками */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Список задолженностей */}
          <DebtsList />

          {/* Топ учеников по оплатам */}
          <TopStudents />
        </div>
      </div>
    </div>
  )
}
