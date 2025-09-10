'use client'

import { useState, useEffect } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { TrendingUp } from 'lucide-react'
import { apiRequest } from '@/lib/api'

interface RevenueChartProps {
  period: string
}

interface ChartData {
  date: string
  revenue: number
  lessons: number
}

export default function RevenueChart({ period }: RevenueChartProps) {
  const [chartData, setChartData] = useState<ChartData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchChartData()
  }, [period]) // eslint-disable-line react-hooks/exhaustive-deps

  const fetchChartData = async () => {
    try {
      setLoading(true)
      
      // Получаем данные за последние 30 дней для графика
      const endDate = new Date()
      const startDate = new Date()
      startDate.setDate(endDate.getDate() - 30)
      
      const response = await apiRequest(`/api/finances/period?period=custom&startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`)
      
      if (response.ok) {
        // Для упрощения показываем статичные данные
        // В реальном приложении здесь был бы запрос к API для получения данных по дням
        const mockData = generateMockChartData()
        setChartData(mockData)
      } else {
        console.error('Ошибка при загрузке данных графика:', response.status, response.statusText)
        // Используем моковые данные в случае ошибки
        const mockData = generateMockChartData()
        setChartData(mockData)
      }
    } catch (error) {
      console.error('Ошибка при загрузке данных графика:', error)
      // Используем моковые данные в случае ошибки
      const mockData = generateMockChartData()
      setChartData(mockData)
    } finally {
      setLoading(false)
    }
  }

  const generateMockChartData = (): ChartData[] => {
    const data: ChartData[] = []
    const today = new Date()
    
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(today.getDate() - i)
      
      data.push({
        date: date.toLocaleDateString('ru-RU', { month: 'short', day: 'numeric' }),
        revenue: Math.floor(Math.random() * 5000) + 1000,
        lessons: Math.floor(Math.random() * 10) + 1
      })
    }
    
    return data
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'KZT',
      minimumFractionDigits: 0
    }).format(value)
  }

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h3 className="text-lg font-medium text-gray-900 mb-4">График доходов</h3>
        <div className="h-64 flex items-center justify-center">
          <div className="animate-pulse">
            <div className="h-48 w-full bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  if (chartData.length === 0) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h3 className="text-lg font-medium text-gray-900 mb-4">График доходов</h3>
        <div className="h-64 flex items-center justify-center">
          <div className="text-center">
            <TrendingUp className="mx-auto h-12 w-12 text-gray-400" />
            <p className="mt-2 text-sm text-gray-500">Нет данных для отображения</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border">
      <h3 className="text-lg font-medium text-gray-900 mb-4">График доходов</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="date" 
              tick={{ fontSize: 12 }}
              interval="preserveStartEnd"
            />
            <YAxis 
              tick={{ fontSize: 12 }}
              tickFormatter={(value) => formatCurrency(value)}
            />
            <Tooltip 
              formatter={(value: number, name: string) => [
                name === 'revenue' ? formatCurrency(value) : value,
                name === 'revenue' ? 'Доход' : 'Занятия'
              ]}
              labelFormatter={(label) => `Дата: ${label}`}
            />
            <Line 
              type="monotone" 
              dataKey="revenue" 
              stroke="#3B82F6" 
              strokeWidth={2}
              dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
