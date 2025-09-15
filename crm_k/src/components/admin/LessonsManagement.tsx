'use client'

import { useState, useEffect } from 'react'
import { 
  Calendar, 
  Clock, 
  DollarSign, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Search,
  Filter,
  Download,
  Eye,
  Edit,
  Trash2,
  Plus,
  User,
  BookOpen,
  TrendingUp,
  TrendingDown,
  CalendarDays,
  CreditCard,
  Users,
  AlertTriangle
} from 'lucide-react'
import { Lesson, Student, User as UserType } from '@/types'
import { apiRequest } from '@/lib/api'
import { cn } from '@/lib/utils'
import { useAuth } from '@/presentation/contexts'
import { getLessonStatusInfo, getLessonStatus, getLessonStatusText } from '@/lib/lessonStatusUtils'
import BulkLessonForm from '../forms/BulkLessonForm'
import PrepaymentForm from '../forms/PrepaymentForm'

interface LessonsManagementProps {
  className?: string
}

interface LessonWithDetails extends Lesson {
  student?: Student & {
    user?: UserType
  }
  teacher?: UserType
}

export default function LessonsManagement({ className }: LessonsManagementProps) {
  const { user } = useAuth()
  const [lessons, setLessons] = useState<LessonWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'paid' | 'scheduled' | 'cancelled'>('all')
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'month'>('all')
  const [selectedLesson, setSelectedLesson] = useState<LessonWithDetails | null>(null)
  const [showBulkForm, setShowBulkForm] = useState(false)
  const [showPrepaymentForm, setShowPrepaymentForm] = useState(false)
  const [activeTab, setActiveTab] = useState<'list' | 'create'>('list')

  // Проверяем, что пользователь является админом
  if (user?.role !== 'ADMIN') {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Доступ запрещен</h3>
          <p className="text-gray-500">У вас нет прав для просмотра этой страницы</p>
        </div>
      </div>
    )
  }

  useEffect(() => {
    fetchLessons()
  }, [])

  const fetchLessons = async () => {
    try {
      setLoading(true)
      const response = await apiRequest('/api/lessons')
      if (response.ok) {
        const data = await response.json()
        setLessons(data)
      }
    } catch (error) {
      console.error('Ошибка загрузки занятий:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusInfo = (lesson: LessonWithDetails) => {
    const status = getLessonStatus(
      lesson.isCompleted,
      lesson.isPaid,
      lesson.isCancelled
    )
    
    switch (status) {
      case 'scheduled':
        return {
          icon: Calendar,
          text: 'Запланировано',
          color: 'bg-sky-100 text-sky-800',
          iconColor: 'text-sky-600'
        }
      case 'prepaid':
        return {
          icon: CreditCard,
          text: 'Предоплачено',
          color: 'bg-yellow-100 text-yellow-800',
          iconColor: 'text-yellow-600'
        }
      case 'cancelled':
        return {
          icon: XCircle,
          text: 'Отменено',
          color: 'bg-orange-100 text-orange-800',
          iconColor: 'text-orange-600'
        }
      case 'completed':
        return {
          icon: CheckCircle,
          text: 'Проведено',
          color: 'bg-purple-100 text-purple-800',
          iconColor: 'text-purple-600'
        }
      case 'debt':
        return {
          icon: AlertTriangle,
          text: 'Задолженность',
          color: 'bg-red-100 text-red-800',
          iconColor: 'text-red-600'
        }
      case 'unpaid':
        return {
          icon: Clock,
          text: 'Не оплачено',
          color: 'bg-gray-100 text-gray-800',
          iconColor: 'text-gray-600'
        }
      default:
        return {
          icon: Clock,
          text: 'Неизвестно',
          color: 'bg-gray-100 text-gray-800',
          iconColor: 'text-gray-600'
        }
    }
  }

  const filteredLessons = lessons.filter(lesson => {
    const matchesSearch = searchQuery === '' || 
      lesson.student?.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lesson.student?.user?.name?.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || (
      statusFilter === 'completed' && lesson.isCompleted && lesson.isPaid ||
      statusFilter === 'paid' && lesson.isPaid && !lesson.isCompleted ||
      statusFilter === 'scheduled' && !lesson.isCompleted && !lesson.isCancelled ||
      statusFilter === 'cancelled' && lesson.isCancelled
    )
    
    const lessonDate = new Date(lesson.date)
    const now = new Date()
    const matchesDate = dateFilter === 'all' || (
      dateFilter === 'today' && lessonDate.toDateString() === now.toDateString() ||
      dateFilter === 'week' && lessonDate >= new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) ||
      dateFilter === 'month' && lessonDate >= new Date(now.getFullYear(), now.getMonth(), 1)
    )
    
    return matchesSearch && matchesStatus && matchesDate
  })

  const generateLessonsCSV = () => {
    const headers = ['ID', 'Ученик', 'Преподаватель', 'Email преподавателя', 'Дата', 'Время', 'Стоимость', 'Статус', 'Оплачено', 'Проведено', 'Тип занятия']
    const rows = filteredLessons.map(lesson => [
      lesson.id,
      lesson.student?.fullName || 'Неизвестно',
      lesson.student?.user?.name || 'Неизвестно',
      lesson.student?.user?.email || 'Неизвестно',
      new Date(lesson.date).toLocaleDateString('ru-RU'),
      new Date(lesson.date).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
      lesson.cost,
      getStatusInfo(lesson).text,
      lesson.isPaid ? 'Да' : 'Нет',
      lesson.isCompleted ? 'Да' : 'Нет',
      lesson.lessonType === 'group' ? 'Групповое' : 'Индивидуальное'
    ])
    
    return [headers, ...rows].map(row => 
      row.map(field => `"${field}"`).join(',')
    ).join('\n')
  }

  const downloadCSV = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', filename)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleExportLessons = () => {
    const csvContent = generateLessonsCSV()
    downloadCSV(csvContent, 'lessons.csv')
  }

  const handleUpdateLessonStatus = async (lessonId: number, updates: Partial<Lesson>) => {
    try {
      const response = await apiRequest(`/api/lessons/${lessonId}`, {
        method: 'PUT',
        body: JSON.stringify(updates)
      })
      
      if (response.ok) {
        await fetchLessons()
      }
    } catch (error) {
      console.error('Ошибка обновления занятия:', error)
    }
  }

  const handleDeleteLesson = async (lessonId: number) => {
    if (!confirm('Вы уверены, что хотите удалить это занятие?')) return

    try {
      const response = await apiRequest(`/api/lessons/${lessonId}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        await fetchLessons()
      }
    } catch (error) {
      console.error('Ошибка удаления занятия:', error)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <BookOpen className="w-6 h-6 text-blue-600" />
          </div>
          <div className="text-lg font-medium text-gray-900">Загрузка занятий...</div>
        </div>
      </div>
    )
  }

  return (
    <div className={cn("space-y-6 max-w-7xl mx-auto", className)}>
      {/* Заголовок и вкладки */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Занятия</h2>
            <p className="text-sm text-gray-600 mt-1">
              Всего: {lessons.length} • Проведено: {lessons.filter(l => l.isCompleted && l.isPaid).length} • Доход: {lessons.filter(l => l.isPaid).reduce((sum, l) => sum + l.cost, 0).toLocaleString()} ₸
            </p>
          </div>
        </div>

        {/* Вкладки */}
        <div className="flex space-x-1 bg-gray-100 rounded-xl p-1">
          <button
            onClick={() => setActiveTab('list')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              activeTab === 'list'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Список</span>
          </button>
          <button
            onClick={() => setActiveTab('create')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              activeTab === 'create'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
            }`}
          >
            <Plus className="w-4 h-4" />
            <span>Создать</span>
          </button>
        </div>
      </div>

      {/* Контент вкладок */}
      {activeTab === 'list' && (
        <>
          {/* Фильтры */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 sm:p-6">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Поиск по ученику или преподавателю..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              
              <div className="flex gap-2">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">Все статусы</option>
                  <option value="scheduled">Запланировано</option>
                  <option value="paid">Оплачено</option>
                  <option value="completed">Проведено</option>
                  <option value="cancelled">Отменено</option>
                </select>
                
                <select
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value as any)}
                  className="px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">Все даты</option>
                  <option value="today">Сегодня</option>
                  <option value="week">Неделя</option>
                  <option value="month">Месяц</option>
                </select>
                
                <button
                  onClick={handleExportLessons}
                  className="px-4 py-2 bg-gray-600 text-white rounded-xl hover:bg-gray-700 transition-colors flex items-center"
                  title="Экспорт в CSV"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Экспорт
                </button>
              </div>
            </div>
            
            {(searchQuery || statusFilter !== 'all' || dateFilter !== 'all') && (
              <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-blue-700">
                    Найдено: {filteredLessons.length} из {lessons.length} занятий
                  </span>
                  <button
                    onClick={() => {
                      setSearchQuery('')
                      setStatusFilter('all')
                      setDateFilter('all')
                    }}
                    className="text-xs text-blue-600 hover:text-blue-800 underline"
                  >
                    Сбросить фильтры
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {activeTab === 'create' && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 sm:p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Создание занятий</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={() => setShowBulkForm(true)}
              className="p-6 bg-green-50 hover:bg-green-100 rounded-xl border border-green-200 transition-all duration-200 text-left hover:shadow-md"
            >
              <CalendarDays className="w-8 h-8 text-green-600 mb-3" />
              <div className="font-medium text-gray-900">Массовое создание</div>
              <div className="text-sm text-gray-600">Создать несколько занятий</div>
            </button>
            
            <button
              onClick={() => setShowPrepaymentForm(true)}
              className="p-6 bg-yellow-50 hover:bg-yellow-100 rounded-xl border border-yellow-200 transition-all duration-200 text-left hover:shadow-md"
            >
              <CreditCard className="w-8 h-8 text-yellow-600 mb-3" />
              <div className="font-medium text-gray-900">Предоплата</div>
              <div className="text-sm text-gray-600">Закрыть долги</div>
            </button>
          </div>
        </div>
      )}

      {/* Список занятий */}
      {activeTab === 'list' && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200">
          <div className="p-4 sm:p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Список занятий</h3>
          </div>
        
        <div className="p-4 sm:p-6">
          {filteredLessons.length > 0 ? (
            <div className="space-y-4">
              {filteredLessons.map((lesson) => {
                const statusInfo = getStatusInfo(lesson)
                const StatusIcon = statusInfo.icon

                return (
                  <div
                    key={lesson.id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center space-x-4 flex-1 min-w-0">
                      <div className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0",
                        statusInfo.color
                      )}>
                        <StatusIcon className={cn("w-5 h-5", statusInfo.iconColor)} />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center space-x-2">
                            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                              <span className="text-sm font-medium text-blue-800">
                                {(lesson.student?.fullName || '?').charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <h4 className="font-medium text-gray-900 truncate">
                              {lesson.student?.fullName || 'Неизвестный ученик'}
                            </h4>
                          </div>
                          <div className="flex items-center space-x-2 text-sm text-gray-600">
                            <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center">
                              <span className="text-xs font-medium text-green-800">
                                {lesson.teacher?.name?.charAt(0).toUpperCase() || '?'}
                              </span>
                            </div>
                            <span className="truncate">
                              👨‍🏫 {lesson.teacher?.name || 'Неизвестный преподаватель'}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-4 mt-1 text-sm text-gray-600">
                          <span>{new Date(lesson.date).toLocaleDateString('ru-RU')}</span>
                          <span>{new Date(lesson.date).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}</span>
                          <span className="font-medium text-gray-900">{lesson.cost} ₸</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <div className={cn(
                        "px-3 py-1 text-xs font-medium rounded-full",
                        statusInfo.color
                      )}>
                        {statusInfo.text}
                      </div>
                      
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => setSelectedLesson(lesson)}
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Просмотр"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        
                        {!lesson.isCompleted && !lesson.isCancelled && (
                          <button
                            onClick={() => handleUpdateLessonStatus(lesson.id, { isCompleted: true })}
                            className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            title="Отметить как проведенное"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        )}
                        
                        {!lesson.isPaid && !lesson.isCancelled && (
                          <button
                            onClick={() => handleUpdateLessonStatus(lesson.id, { isPaid: true })}
                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Отметить как оплаченное"
                          >
                            <DollarSign className="w-4 h-4" />
                          </button>
                        )}
                        
                        <button
                          onClick={() => handleDeleteLesson(lesson.id)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Удалить"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
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
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchQuery || statusFilter !== 'all' || dateFilter !== 'all' ? 'Занятия не найдены' : 'Нет занятий'}
              </h3>
              <p className="text-gray-500">
                {searchQuery || statusFilter !== 'all' || dateFilter !== 'all' 
                  ? 'Попробуйте изменить параметры поиска' 
                  : 'Занятия появятся здесь после их добавления'
                }
              </p>
            </div>
          )}
        </div>
        </div>
      )}
      
      {/* Модальные окна */}
      
      <BulkLessonForm
        isOpen={showBulkForm}
        onClose={() => setShowBulkForm(false)}
        onSuccess={() => {
          setShowBulkForm(false);
          fetchLessons();
        }}
      />
      
      <PrepaymentForm
        isOpen={showPrepaymentForm}
        onClose={() => setShowPrepaymentForm(false)}
        onSuccess={() => {
          setShowPrepaymentForm(false);
          fetchLessons();
        }}
      />
    </div>
  )
}
