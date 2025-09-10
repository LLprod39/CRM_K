'use client'

import { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StatsCardProps {
  title: string
  value: string | number
  icon: LucideIcon
  change?: {
    value: number
    type: 'increase' | 'decrease' | 'neutral'
  }
  description?: string
  color?: 'blue' | 'green' | 'purple' | 'yellow' | 'red' | 'indigo'
  className?: string
}

const colorVariants = {
  blue: {
    bg: 'from-blue-50 to-blue-100',
    icon: 'bg-blue-200 text-blue-600',
    text: 'text-blue-900',
    accent: 'text-blue-600'
  },
  green: {
    bg: 'from-green-50 to-green-100',
    icon: 'bg-green-200 text-green-600',
    text: 'text-green-900',
    accent: 'text-green-600'
  },
  purple: {
    bg: 'from-purple-50 to-purple-100',
    icon: 'bg-purple-200 text-purple-600',
    text: 'text-purple-900',
    accent: 'text-purple-600'
  },
  yellow: {
    bg: 'from-yellow-50 to-yellow-100',
    icon: 'bg-yellow-200 text-yellow-600',
    text: 'text-yellow-900',
    accent: 'text-yellow-600'
  },
  red: {
    bg: 'from-red-50 to-red-100',
    icon: 'bg-red-200 text-red-600',
    text: 'text-red-900',
    accent: 'text-red-600'
  },
  indigo: {
    bg: 'from-indigo-50 to-indigo-100',
    icon: 'bg-indigo-200 text-indigo-600',
    text: 'text-indigo-900',
    accent: 'text-indigo-600'
  }
}

export default function StatsCard({
  title,
  value,
  icon: Icon,
  change,
  description,
  color = 'blue',
  className
}: StatsCardProps) {
  const colors = colorVariants[color]

  return (
    <div className={cn(
      "bg-white rounded-2xl shadow-sm border border-gray-200 p-4 sm:p-6 hover:shadow-lg transition-all duration-300 group",
      "touch-manipulation", // Улучшает тач-события
      className
    )}>
      <div className="flex items-center justify-between mb-3 sm:mb-4">
        <div className={cn(
          "p-2 sm:p-3 rounded-xl transition-transform duration-200 group-hover:scale-110",
          colors.icon
        )}>
          <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
        </div>
        
        {change && (
          <div className={cn(
            "flex items-center space-x-1 text-sm font-medium px-2 py-1 rounded-full",
            change.type === 'increase' && "bg-green-100 text-green-700",
            change.type === 'decrease' && "bg-red-100 text-red-700",
            change.type === 'neutral' && "bg-gray-100 text-gray-700"
          )}>
            <span className={cn(
              "text-xs",
              change.type === 'increase' && "↗",
              change.type === 'decrease' && "↘",
              change.type === 'neutral' && "→"
            )}>
              {change.type === 'increase' && '+'}
              {change.value}%
            </span>
          </div>
        )}
      </div>

      <div className="space-y-1 sm:space-y-2">
        <h3 className="text-xs sm:text-sm font-medium text-gray-600">{title}</h3>
        <div className={cn(
          "text-2xl sm:text-3xl font-bold transition-colors duration-200",
          colors.text
        )}>
          {typeof value === 'number' ? value.toLocaleString() : value}
        </div>
        
        {description && (
          <p className="text-xs sm:text-sm text-gray-500 leading-tight">{description}</p>
        )}
      </div>

      {/* Декоративный элемент */}
      <div className={cn(
        "absolute top-0 right-0 w-20 h-20 rounded-full opacity-10 transition-all duration-300 group-hover:opacity-20 group-hover:scale-110",
        `bg-gradient-to-br ${colors.bg}`
      )} />
    </div>
  )
}
