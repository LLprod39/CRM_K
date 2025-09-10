'use client'

import { 
  Calendar, 
  CheckCircle, 
  DollarSign, 
  Clock, 
  AlertCircle,
  User,
  BookOpen
} from 'lucide-react'
import { Lesson } from '@/types'
import { cn } from '@/lib/utils'

interface RecentActivityProps {
  lessons: Lesson[]
  className?: string
}

export default function RecentActivity({ lessons, className }: RecentActivityProps) {
  const getStatusInfo = (lesson: Lesson) => {
    if (lesson.isCompleted && lesson.isPaid) {
      return {
        icon: CheckCircle,
        text: 'Проведено + Оплачено',
        color: 'bg-green-100 text-green-800',
        iconColor: 'text-green-600'
      }
    }
    if (lesson.isPaid) {
      return {
        icon: DollarSign,
        text: 'Оплачено',
        color: 'bg-blue-100 text-blue-800',
        iconColor: 'text-blue-600'
      }
    }
    if (lesson.isCancelled) {
      return {
        icon: AlertCircle,
        text: 'Отменено',
        color: 'bg-red-100 text-red-800',
        iconColor: 'text-red-600'
      }
    }
    return {
      icon: Clock,
      text: 'Запланировано',
      color: 'bg-yellow-100 text-yellow-800',
      iconColor: 'text-yellow-600'
    }
  }

  return (
    <div className={cn("bg-white rounded-2xl shadow-sm border border-gray-200", className)}>
      <div className="p-4 sm:p-6 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 flex items-center">
              <Calendar className="w-5 h-5 mr-2 text-blue-600" />
              Последние занятия
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Недавно добавленные занятия в системе
            </p>
          </div>
          <div className="text-sm text-gray-500">
            {lessons.length} занятий
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-6">
        {lessons.length > 0 ? (
          <div className="space-y-3 sm:space-y-4">
            {lessons.map((lesson) => {
              const statusInfo = getStatusInfo(lesson)
              const StatusIcon = statusInfo.icon

              return (
                <div
                  key={lesson.id}
                  className="flex items-start space-x-3 sm:space-x-4 p-3 sm:p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors group touch-manipulation"
                >
                  {/* Иконка статуса */}
                  <div className={cn(
                    "w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center flex-shrink-0",
                    statusInfo.color
                  )}>
                    <StatusIcon className={cn("w-4 h-4 sm:w-5 sm:h-5", statusInfo.iconColor)} />
                  </div>

                  {/* Информация о занятии */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-2">
                      <h3 className="text-sm font-medium text-gray-900 truncate">
                        {lesson.student?.fullName || `ID: ${lesson.studentId}`}
                      </h3>
                      <div className="text-sm font-semibold text-gray-900">
                        {lesson.cost} ₸
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-4 mt-1">
                      <div className="text-xs sm:text-sm text-gray-600">
                        {new Date(lesson.date).toLocaleDateString('ru-RU', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric'
                        })}
                      </div>
                      <div className="text-xs sm:text-sm text-gray-600">
                        {new Date(lesson.date).toLocaleTimeString('ru-RU', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Статус */}
                  <div className={cn(
                    "px-2 sm:px-3 py-1 text-xs font-medium rounded-full flex items-center space-x-1 flex-shrink-0",
                    statusInfo.color
                  )}>
                    <StatusIcon className="w-3 h-3" />
                    <span className="hidden sm:inline">{statusInfo.text}</span>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <BookOpen className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Нет занятий</h3>
            <p className="text-gray-500">Занятия появятся здесь после их добавления</p>
          </div>
        )}
      </div>
    </div>
  )
}
