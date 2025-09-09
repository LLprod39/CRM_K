'use client'

import { useState } from 'react'
import { Calendar, Download } from 'lucide-react'

interface PeriodFiltersProps {
  period: string
  onPeriodChange: (period: string) => void
  onDateRangeChange: (startDate: string, endDate: string) => void
  onExport: (format: 'xlsx' | 'csv') => void
}

export default function PeriodFilters({ 
  period, 
  onPeriodChange, 
  onDateRangeChange, 
  onExport 
}: PeriodFiltersProps) {
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [showCustomRange, setShowCustomRange] = useState(false)

  const periods = [
    { key: 'day', label: 'Сегодня' },
    { key: 'week', label: 'Неделя' },
    { key: 'month', label: 'Месяц' },
    { key: 'year', label: 'Год' }
  ]

  const handlePeriodChange = (newPeriod: string) => {
    onPeriodChange(newPeriod)
    if (newPeriod !== 'custom') {
      setShowCustomRange(false)
    }
  }

  const handleCustomRange = () => {
    setShowCustomRange(true)
    onPeriodChange('custom')
  }

  const handleDateRangeSubmit = () => {
    if (startDate && endDate) {
      onDateRangeChange(startDate, endDate)
    }
  }

  const handleExport = (format: 'xlsx' | 'csv') => {
    onExport(format)
  }

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        {/* Периоды */}
        <div className="flex flex-wrap gap-2">
          {periods.map((p) => (
            <button
              key={p.key}
              onClick={() => handlePeriodChange(p.key)}
              className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                period === p.key
                  ? 'text-white bg-blue-600'
                  : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
              }`}
            >
              {p.label}
            </button>
          ))}
          <button
            onClick={handleCustomRange}
            className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
              period === 'custom'
                ? 'text-white bg-blue-600'
                : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
            }`}
          >
            <Calendar className="w-4 h-4 inline mr-1" />
            Диапазон
          </button>
        </div>

        {/* Кастомный диапазон дат */}
        {showCustomRange && (
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
            />
            <span className="text-gray-500">—</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
            />
            <button
              onClick={handleDateRangeSubmit}
              disabled={!startDate || !endDate}
              className="px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Применить
            </button>
          </div>
        )}

        {/* Экспорт */}
        <div className="flex gap-2">
          <div className="relative group">
            <button className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
              <Download className="w-4 h-4 mr-2" />
              Экспорт
            </button>
            <div className="absolute right-0 mt-2 w-32 bg-white rounded-md shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
              <div className="py-1">
                <button
                  onClick={() => handleExport('xlsx')}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  Excel (.xlsx)
                </button>
                <button
                  onClick={() => handleExport('csv')}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  CSV (.csv)
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
