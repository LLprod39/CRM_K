'use client'

import { useState } from 'react'
import { 
  User, 
  Mail, 
  Phone, 
  Edit, 
  Trash2, 
  ChevronDown, 
  ChevronUp,
  Users,
  BookOpen,
  CheckCircle,
  CreditCard,
  DollarSign,
  TrendingUp,
  AlertCircle,
  Clock
} from 'lucide-react'
import { UserWithStats } from '@/types'
import { cn } from '@/lib/utils'

interface UserCardProps {
  user: UserWithStats
  onEdit: (user: UserWithStats) => void
  onDelete: (userId: number) => void
  className?: string
}

export default function UserCard({ user, onEdit, onDelete, className }: UserCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <div className={cn(
      "bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden transition-all duration-300 hover:shadow-lg group",
      "touch-manipulation", // Улучшает тач-события
      className
    )}>
      {/* Основная информация */}
      <div className="p-4 sm:p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3 sm:space-x-4 flex-1 min-w-0">
            <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-105 flex-shrink-0">
              <User className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
            </div>
            
            <div className="flex-1 min-w-0">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 truncate">{user.name}</h3>
              <div className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-4 mt-1">
                <div className="flex items-center space-x-1 text-xs sm:text-sm text-gray-600">
                  <Mail className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                  <span className="truncate">{user.email}</span>
                </div>
                <span className={cn(
                  "px-2 sm:px-3 py-1 text-xs font-medium rounded-full w-fit",
                  user.role === 'ADMIN' 
                    ? 'bg-red-100 text-red-800' 
                    : 'bg-blue-100 text-blue-800'
                )}>
                  {user.role === 'ADMIN' ? 'Администратор' : 'Пользователь'}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0">
            <button
              onClick={() => onEdit(user)}
              className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200 hover:scale-110 touch-manipulation"
              title="Редактировать пользователя"
            >
              <Edit className="w-4 h-4" />
            </button>
            <button
              onClick={() => onDelete(user.id)}
              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200 hover:scale-110 touch-manipulation"
              title="Удалить пользователя"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-all duration-200 touch-manipulation"
              title={isExpanded ? "Свернуть" : "Развернуть"}
            >
              {isExpanded ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        {/* Краткая статистика */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mt-4 sm:mt-6">
          <div className="text-center p-2 sm:p-3 bg-blue-50 rounded-xl">
            <Users className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 mx-auto mb-1" />
            <div className="text-sm sm:text-lg font-bold text-blue-900">{user.stats.totalStudents}</div>
            <div className="text-xs text-blue-600">Учеников</div>
          </div>
          <div className="text-center p-2 sm:p-3 bg-green-50 rounded-xl">
            <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 mx-auto mb-1" />
            <div className="text-sm sm:text-lg font-bold text-green-900">{user.stats.totalLessons}</div>
            <div className="text-xs text-green-600">Занятий</div>
          </div>
          <div className="text-center p-2 sm:p-3 bg-emerald-50 rounded-xl">
            <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600 mx-auto mb-1" />
            <div className="text-sm sm:text-lg font-bold text-emerald-900">{user.stats.completedLessons}</div>
            <div className="text-xs text-emerald-600">Проведено</div>
          </div>
          <div className="text-center p-2 sm:p-3 bg-yellow-50 rounded-xl">
            <CreditCard className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-600 mx-auto mb-1" />
            <div className="text-sm sm:text-lg font-bold text-yellow-900">{user.stats.paidLessons}</div>
            <div className="text-xs text-yellow-600">Оплачено</div>
          </div>
        </div>
      </div>

      {/* Развернутая информация */}
      {isExpanded && (
        <div className="border-t border-gray-200 bg-gray-50 p-4 sm:p-6 space-y-4 sm:space-y-6">
          {/* Финансовая информация */}
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-4 flex items-center">
              <DollarSign className="w-4 h-4 mr-2" />
              Финансовая информация
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-green-50 rounded-xl border border-green-200">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-green-600">Доход</div>
                    <div className="text-xl font-bold text-green-900">{user.stats.totalRevenue.toLocaleString()} ₸</div>
                  </div>
                  <TrendingUp className="w-5 h-5 text-green-600" />
                </div>
              </div>
              <div className="p-4 bg-red-50 rounded-xl border border-red-200">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-red-600">Долг</div>
                    <div className="text-xl font-bold text-red-900">{user.stats.totalDebt.toLocaleString()} ₸</div>
                  </div>
                  <AlertCircle className="w-5 h-5 text-red-600" />
                </div>
              </div>
              <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-blue-600">Предоплата</div>
                    <div className="text-xl font-bold text-blue-900">{user.stats.totalPrepaid.toLocaleString()} ₸</div>
                  </div>
                  <Clock className="w-5 h-5 text-blue-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Список учеников */}
          {user.students.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-4 flex items-center">
                <Users className="w-4 h-4 mr-2" />
                Ученики ({user.students.length})
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {user.students.map((student) => (
                  <div key={student.id} className="p-4 bg-white rounded-xl border border-gray-200 shadow-sm">
                    <div className="flex items-start space-x-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <User className="w-5 h-5 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h5 className="font-medium text-gray-900 truncate">{student.fullName}</h5>
                        <div className="mt-1 space-y-1">
                          <div className="flex items-center text-sm text-gray-600">
                            <Phone className="w-3 h-3 mr-1 flex-shrink-0" />
                            <span className="truncate">{student.phone}</span>
                          </div>
                          <div className="text-sm text-gray-600">
                            Возраст: {student.age} лет
                          </div>
                          {student.diagnosis && (
                            <div className="text-sm text-gray-600">
                              Диагноз: {student.diagnosis}
                            </div>
                          )}
                          {student.comment && (
                            <div className="text-sm text-gray-500 mt-2 p-2 bg-gray-50 rounded border">
                              <strong>Комментарий:</strong> {student.comment}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
