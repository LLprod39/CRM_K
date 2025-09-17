'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/presentation/contexts'
import { apiRequest } from '@/lib/api'
import { 
  Search, 
  Users, 
  UserCheck, 
  Calendar, 
  Settings, 
  Target, 
  BarChart3, 
  Shield,
  Plus,
  RefreshCw,
  CreditCard,
  CalendarDays,
  X,
  Command,
  Home,
  MessageSquare,
  Bell,
  BookOpen,
  DollarSign,
  TrendingUp,
  Activity,
  Eye,
  Edit,
  Trash2,
  Filter,
  Download,
  Upload,
  Zap,
  Loader2
} from 'lucide-react'

interface SearchResult {
  id: string
  title: string
  description: string
  icon: React.ComponentType<any>
  action: () => void
  category: string
  type: 'navigation' | 'action' | 'data'
  data?: any
}

interface GlobalSearchProps {
  isOpen: boolean
  onClose: () => void
}

export default function GlobalSearch({ isOpen, onClose }: GlobalSearchProps) {
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [recentSearches, setRecentSearches] = useState<string[]>([])
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const { user } = useAuth()

  // Загружаем недавние поиски из localStorage
  useEffect(() => {
    const saved = localStorage.getItem('recentSearches')
    if (saved) {
      setRecentSearches(JSON.parse(saved))
    }
  }, [])

  // Сохраняем поиски в localStorage
  const saveSearch = (searchTerm: string) => {
    if (!searchTerm.trim()) return
    
    const updated = [searchTerm, ...recentSearches.filter(s => s !== searchTerm)].slice(0, 5)
    setRecentSearches(updated)
    localStorage.setItem('recentSearches', JSON.stringify(updated))
  }

  // Базовые команды навигации
  const getNavigationCommands = (): SearchResult[] => [
    {
      id: 'overview',
      title: 'Обзор',
      description: 'Перейти к обзору системы',
      icon: Home,
      action: () => router.push('/admin'),
      category: 'Навигация',
      type: 'navigation'
    },
    {
      id: 'users',
      title: 'Пользователи',
      description: 'Управление пользователями',
      icon: Users,
      action: () => router.push('/admin?tab=users'),
      category: 'Навигация',
      type: 'navigation'
    },
    {
      id: 'students',
      title: 'Ученики',
      description: 'Управление учениками',
      icon: UserCheck,
      action: () => router.push('/admin?tab=students'),
      category: 'Навигация',
      type: 'navigation'
    },
    {
      id: 'lessons',
      title: 'Занятия',
      description: 'Управление занятиями',
      icon: Calendar,
      action: () => router.push('/admin?tab=lessons'),
      category: 'Навигация',
      type: 'navigation'
    },
    {
      id: 'schedule',
      title: 'Расписание',
      description: 'Просмотр расписания',
      icon: CalendarDays,
      action: () => router.push('/schedule'),
      category: 'Навигация',
      type: 'navigation'
    },
    {
      id: 'finances',
      title: 'Финансы',
      description: 'Финансовая отчетность',
      icon: DollarSign,
      action: () => router.push('/finances'),
      category: 'Навигация',
      type: 'navigation'
    },
    {
      id: 'subscriptions',
      title: 'Подписки',
      description: 'Управление подписками',
      icon: CreditCard,
      action: () => router.push('/subscriptions'),
      category: 'Навигация',
      type: 'navigation'
    },
    {
      id: 'settings',
      title: 'Настройки',
      description: 'Системные настройки',
      icon: Settings,
      action: () => router.push('/admin?tab=settings'),
      category: 'Навигация',
      type: 'navigation'
    },
    {
      id: 'toys',
      title: 'Игрушки',
      description: 'Управление игрушками',
      icon: Target,
      action: () => router.push('/admin?tab=more&subtab=toys'),
      category: 'Навигация',
      type: 'navigation'
    },
    {
      id: 'analytics',
      title: 'Аналитика',
      description: 'Аналитика и отчеты',
      icon: BarChart3,
      action: () => router.push('/admin?tab=more&subtab=analytics'),
      category: 'Навигация',
      type: 'navigation'
    },
    {
      id: 'security',
      title: 'Безопасность',
      description: 'Логи безопасности',
      icon: Shield,
      action: () => router.push('/admin?tab=more&subtab=security'),
      category: 'Навигация',
      type: 'navigation'
    },
    {
      id: 'whatsapp',
      title: 'WhatsApp',
      description: 'Отправка сообщений',
      icon: MessageSquare,
      action: () => router.push('/admin?tab=whatsapp'),
      category: 'Навигация',
      type: 'navigation'
    },
    {
      id: 'notifications',
      title: 'Уведомления',
      description: 'Настройка уведомлений',
      icon: Bell,
      action: () => router.push('/admin?tab=notifications'),
      category: 'Навигация',
      type: 'navigation'
    }
  ]

  // Поиск данных
  const searchData = async (searchTerm: string) => {
    if (!searchTerm.trim() || !user) return []

    setIsLoading(true)
    const results: SearchResult[] = []

    try {
      // Поиск пользователей
      const usersResponse = await apiRequest('/api/admin/users')
      if (usersResponse.ok) {
        const usersData = await usersResponse.json()
        const users = usersData.usersWithStats || []
        
        users
          .filter((u: any) => 
            u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            u.email.toLowerCase().includes(searchTerm.toLowerCase())
          )
          .slice(0, 5)
          .forEach((user: any) => {
            results.push({
              id: `user-${user.id}`,
              title: user.name,
              description: `${user.email} • ${user.role === 'ADMIN' ? 'Администратор' : 'Пользователь'}`,
              icon: Users,
              action: () => {
                router.push('/admin?tab=users')
                // Можно добавить выделение конкретного пользователя
              },
              category: 'Пользователи',
              type: 'data',
              data: user
            })
          })
      }

      // Поиск учеников
      const studentsResponse = await apiRequest('/api/students')
      if (studentsResponse.ok) {
        const students = await studentsResponse.json()
        
        students
          .filter((s: any) => 
            s.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            s.parentName?.toLowerCase().includes(searchTerm.toLowerCase())
          )
          .slice(0, 5)
          .forEach((student: any) => {
            results.push({
              id: `student-${student.id}`,
              title: student.fullName,
              description: `Родитель: ${student.parentName || 'Не указан'} • Возраст: ${student.age || 'Не указан'}`,
              icon: UserCheck,
              action: () => {
                router.push('/admin?tab=students')
              },
              category: 'Ученики',
              type: 'data',
              data: student
            })
          })
      }

      // Поиск занятий
      const lessonsResponse = await apiRequest('/api/lessons')
      if (lessonsResponse.ok) {
        const lessons = await lessonsResponse.json()
        
        lessons
          .filter((l: any) => 
            l.student?.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            l.teacher?.name?.toLowerCase().includes(searchTerm.toLowerCase())
          )
          .slice(0, 5)
          .forEach((lesson: any) => {
            results.push({
              id: `lesson-${lesson.id}`,
              title: `${lesson.student?.fullName || 'Без ученика'}`,
              description: `${new Date(lesson.date).toLocaleDateString('ru-RU')} • ${lesson.status === 'COMPLETED' ? 'Завершено' : lesson.status === 'SCHEDULED' ? 'Запланировано' : 'Отменено'}`,
              icon: Calendar,
              action: () => {
                router.push('/admin?tab=lessons')
              },
              category: 'Занятия',
              type: 'data',
              data: lesson
            })
          })
      }

    } catch (error) {
      console.error('Ошибка поиска:', error)
    } finally {
      setIsLoading(false)
    }

    return results
  }

  // Обновление результатов поиска
  useEffect(() => {
    const updateResults = async () => {
      if (!query.trim()) {
        setSearchResults([])
        return
      }

      const navigationResults = getNavigationCommands().filter(cmd =>
        cmd.title.toLowerCase().includes(query.toLowerCase()) ||
        cmd.description.toLowerCase().includes(query.toLowerCase()) ||
        cmd.category.toLowerCase().includes(query.toLowerCase())
      )

      const dataResults = await searchData(query)
      
      setSearchResults([...navigationResults, ...dataResults])
    }

    const timeoutId = setTimeout(updateResults, 300) // Debounce
    return () => clearTimeout(timeoutId)
  }, [query])

  // Обработка клавиш
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault()
          setSelectedIndex(prev => 
            prev < searchResults.length - 1 ? prev + 1 : 0
          )
          break
        case 'ArrowUp':
          e.preventDefault()
          setSelectedIndex(prev => 
            prev > 0 ? prev - 1 : searchResults.length - 1
          )
          break
        case 'Enter':
          e.preventDefault()
          if (searchResults[selectedIndex]) {
            searchResults[selectedIndex].action()
            saveSearch(query)
            onClose()
          }
          break
        case 'Escape':
          e.preventDefault()
          onClose()
          break
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, selectedIndex, searchResults, query, onClose])

  // Сброс индекса при изменении запроса
  useEffect(() => {
    setSelectedIndex(0)
  }, [query])

  // Фокус на input при открытии
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center pt-20 z-[9999]">
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 w-full max-w-3xl mx-4">
        {/* Поиск */}
        <div className="flex items-center border-b border-gray-200 p-4">
          <Search className="w-5 h-5 text-gray-400 mr-3" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Поиск по системе..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 text-lg outline-none"
          />
          {isLoading && <Loader2 className="w-5 h-5 text-gray-400 animate-spin mr-3" />}
          <button
            onClick={onClose}
            className="ml-3 p-1 text-gray-400 hover:text-gray-600 rounded"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Результаты поиска */}
        <div className="max-h-96 overflow-y-auto">
          {searchResults.length > 0 ? (
            <div className="p-2">
              {searchResults.map((result, index) => {
                const Icon = result.icon
                const isSelected = index === selectedIndex
                
                return (
                  <button
                    key={result.id}
                    onClick={() => {
                      result.action()
                      saveSearch(query)
                      onClose()
                    }}
                    className={`w-full flex items-center p-3 rounded-lg text-left transition-colors ${
                      isSelected 
                        ? 'bg-blue-50 border border-blue-200' 
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center mr-3 ${
                      isSelected ? 'bg-blue-100' : 'bg-gray-100'
                    }`}>
                      <Icon className={`w-4 h-4 ${
                        isSelected ? 'text-blue-600' : 'text-gray-600'
                      }`} />
                    </div>
                    <div className="flex-1">
                      <div className={`font-medium ${
                        isSelected ? 'text-blue-900' : 'text-gray-900'
                      }`}>
                        {result.title}
                      </div>
                      <div className={`text-sm ${
                        isSelected ? 'text-blue-700' : 'text-gray-500'
                      }`}>
                        {result.description}
                      </div>
                    </div>
                    <div className={`text-xs px-2 py-1 rounded ${
                      isSelected 
                        ? 'bg-blue-200 text-blue-800' 
                        : result.type === 'data' 
                          ? 'bg-green-200 text-green-800'
                          : 'bg-gray-200 text-gray-600'
                    }`}>
                      {result.category}
                    </div>
                  </button>
                )
              })}
            </div>
          ) : query.trim() ? (
            <div className="p-8 text-center text-gray-500">
              <Search className="w-8 h-8 mx-auto mb-2 text-gray-400" />
              <div>Ничего не найдено</div>
              <div className="text-sm mt-1">Попробуйте другой поисковый запрос</div>
            </div>
          ) : (
            <div className="p-4">
              <div className="text-sm text-gray-600 mb-3">Недавние поиски:</div>
              <div className="space-y-1">
                {recentSearches.map((search, index) => (
                  <button
                    key={index}
                    onClick={() => setQuery(search)}
                    className="w-full text-left p-2 text-sm text-gray-500 hover:bg-gray-50 rounded"
                  >
                    {search}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Подсказки */}
        <div className="border-t border-gray-200 p-3 bg-gray-50 rounded-b-xl">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center space-x-4">
              <span className="flex items-center">
                <kbd className="px-1 py-0.5 bg-gray-200 rounded text-xs">↑↓</kbd>
                <span className="ml-1">навигация</span>
              </span>
              <span className="flex items-center">
                <kbd className="px-1 py-0.5 bg-gray-200 rounded text-xs">Enter</kbd>
                <span className="ml-1">выбрать</span>
              </span>
              <span className="flex items-center">
                <kbd className="px-1 py-0.5 bg-gray-200 rounded text-xs">Esc</kbd>
                <span className="ml-1">закрыть</span>
              </span>
            </div>
            <div className="flex items-center">
              <kbd className="px-1 py-0.5 bg-gray-200 rounded text-xs">Ctrl+Shift+K</kbd>
              <span className="ml-1">глобальный поиск</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}


