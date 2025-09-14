'use client'

import { useState, useEffect } from 'react'
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  User, 
  Lock, 
  Unlock,
  Eye,
  EyeOff,
  Filter,
  Download,
  RefreshCw,
  Search,
  X
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface SecurityLog {
  id: string
  timestamp: Date
  type: 'login' | 'logout' | 'failed_login' | 'password_change' | 'security_violation' | 'admin_action'
  severity: 'low' | 'medium' | 'high' | 'critical'
  user?: string
  ip: string
  userAgent: string
  description: string
  details?: Record<string, unknown>
}

interface SecurityLogsProps {
  className?: string
}

export default function SecurityLogs({ className }: SecurityLogsProps) {
  const [logs, setLogs] = useState<SecurityLog[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState<string>('all')
  const [filterSeverity, setFilterSeverity] = useState<string>('all')
  const [showDetails, setShowDetails] = useState<Set<string>>(new Set())

  // Моковые данные для демонстрации
  const mockLogs: SecurityLog[] = [
    {
      id: '1',
      timestamp: new Date(Date.now() - 1000 * 60 * 5), // 5 минут назад
      type: 'login',
      severity: 'low',
      user: 'admin@example.com',
      ip: '192.168.1.100',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      description: 'Успешный вход в систему',
      details: { sessionId: 'sess_123456' }
    },
    {
      id: '2',
      timestamp: new Date(Date.now() - 1000 * 60 * 15), // 15 минут назад
      type: 'failed_login',
      severity: 'medium',
      user: 'unknown@example.com',
      ip: '192.168.1.200',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      description: 'Неудачная попытка входа',
      details: { attempts: 3, reason: 'Invalid password' }
    },
    {
      id: '3',
      timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 минут назад
      type: 'password_change',
      severity: 'medium',
      user: 'user@example.com',
      ip: '192.168.1.150',
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      description: 'Изменение пароля',
      details: { method: 'self_change' }
    },
    {
      id: '4',
      timestamp: new Date(Date.now() - 1000 * 60 * 60), // 1 час назад
      type: 'security_violation',
      severity: 'high',
      user: 'admin@example.com',
      ip: '192.168.1.100',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      description: 'Попытка доступа к защищенному ресурсу',
      details: { resource: '/api/admin/users', action: 'DELETE' }
    },
    {
      id: '5',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 часа назад
      type: 'admin_action',
      severity: 'medium',
      user: 'admin@example.com',
      ip: '192.168.1.100',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      description: 'Создание нового пользователя',
      details: { targetUser: 'newuser@example.com', role: 'USER' }
    }
  ]

  useEffect(() => {
    loadLogs()
  }, [])

  const loadLogs = async () => {
    setIsLoading(true)
    try {
      // Имитация загрузки логов
      await new Promise(resolve => setTimeout(resolve, 1000))
      setLogs(mockLogs)
    } catch (error) {
      console.error('Ошибка загрузки логов безопасности:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'login':
        return <Unlock className="w-4 h-4 text-green-600" />
      case 'logout':
        return <Lock className="w-4 h-4 text-gray-600" />
      case 'failed_login':
        return <AlertTriangle className="w-4 h-4 text-red-600" />
      case 'password_change':
        return <Shield className="w-4 h-4 text-blue-600" />
      case 'security_violation':
        return <AlertTriangle className="w-4 h-4 text-red-600" />
      case 'admin_action':
        return <User className="w-4 h-4 text-purple-600" />
      default:
        return <Shield className="w-4 h-4 text-gray-600" />
    }
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'login':
        return 'Вход'
      case 'logout':
        return 'Выход'
      case 'failed_login':
        return 'Неудачный вход'
      case 'password_change':
        return 'Смена пароля'
      case 'security_violation':
        return 'Нарушение безопасности'
      case 'admin_action':
        return 'Действие администратора'
      default:
        return type
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low':
        return 'bg-green-100 text-green-800'
      case 'medium':
        return 'bg-yellow-100 text-yellow-800'
      case 'high':
        return 'bg-orange-100 text-orange-800'
      case 'critical':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getSeverityLabel = (severity: string) => {
    switch (severity) {
      case 'low':
        return 'Низкий'
      case 'medium':
        return 'Средний'
      case 'high':
        return 'Высокий'
      case 'critical':
        return 'Критический'
      default:
        return severity
    }
  }

  const filteredLogs = logs.filter(log => {
    const matchesSearch = searchQuery === '' || 
      log.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.user?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.ip.includes(searchQuery)
    
    const matchesType = filterType === 'all' || log.type === filterType
    const matchesSeverity = filterSeverity === 'all' || log.severity === filterSeverity
    
    return matchesSearch && matchesType && matchesSeverity
  })

  const toggleDetails = (logId: string) => {
    const newShowDetails = new Set(showDetails)
    if (newShowDetails.has(logId)) {
      newShowDetails.delete(logId)
    } else {
      newShowDetails.add(logId)
    }
    setShowDetails(newShowDetails)
  }

  const exportLogs = () => {
    const csvContent = [
      ['Время', 'Тип', 'Уровень', 'Пользователь', 'IP', 'Описание'],
      ...filteredLogs.map(log => [
        log.timestamp.toLocaleString('ru-RU'),
        getTypeLabel(log.type),
        getSeverityLabel(log.severity),
        log.user || 'Неизвестно',
        log.ip,
        log.description
      ])
    ].map(row => row.map(field => `"${field}"`).join(',')).join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `security_logs_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Заголовок */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Логи безопасности</h2>
          <p className="text-gray-600 mt-1">Мониторинг событий безопасности системы</p>
        </div>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={loadLogs}
            disabled={isLoading}
            className="px-4 py-2 bg-gray-600 text-white rounded-xl hover:bg-gray-700 transition-colors flex items-center"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Обновить
          </button>
          
          <button
            onClick={exportLogs}
            className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors flex items-center"
          >
            <Download className="w-4 h-4 mr-2" />
            Экспорт
          </button>
        </div>
      </div>

      {/* Фильтры */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 sm:p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <div className="relative">
              <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Поиск по описанию, пользователю или IP..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          
          <div>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Все типы</option>
              <option value="login">Вход</option>
              <option value="logout">Выход</option>
              <option value="failed_login">Неудачный вход</option>
              <option value="password_change">Смена пароля</option>
              <option value="security_violation">Нарушение безопасности</option>
              <option value="admin_action">Действие администратора</option>
            </select>
          </div>
          
          <div>
            <select
              value={filterSeverity}
              onChange={(e) => setFilterSeverity(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Все уровни</option>
              <option value="low">Низкий</option>
              <option value="medium">Средний</option>
              <option value="high">Высокий</option>
              <option value="critical">Критический</option>
            </select>
          </div>
        </div>
        
        {/* Результаты фильтрации */}
        {(searchQuery || filterType !== 'all' || filterSeverity !== 'all') && (
          <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center justify-between">
              <span className="text-sm text-blue-700">
                Найдено: {filteredLogs.length} из {logs.length} записей
              </span>
              <button
                onClick={() => {
                  setSearchQuery('')
                  setFilterType('all')
                  setFilterSeverity('all')
                }}
                className="text-xs text-blue-600 hover:text-blue-800 underline"
              >
                Сбросить фильтры
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Список логов */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200">
        {isLoading ? (
          <div className="text-center py-12">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto text-gray-400 mb-3" />
            <p className="text-gray-500">Загрузка логов безопасности...</p>
          </div>
        ) : filteredLogs.length > 0 ? (
          <div className="divide-y divide-gray-200">
            {filteredLogs.map((log) => (
              <div key={log.id} className="p-4 sm:p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3 flex-1">
                    <div className="flex-shrink-0 mt-1">
                      {getTypeIcon(log.type)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="font-medium text-gray-900">
                          {getTypeLabel(log.type)}
                        </span>
                        <span className={cn(
                          "px-2 py-1 text-xs rounded-full",
                          getSeverityColor(log.severity)
                        )}>
                          {getSeverityLabel(log.severity)}
                        </span>
                      </div>
                      
                      <p className="text-sm text-gray-600 mb-2">
                        {log.description}
                      </p>
                      
                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        <div className="flex items-center space-x-1">
                          <Clock className="w-3 h-3" />
                          <span>{log.timestamp.toLocaleString('ru-RU')}</span>
                        </div>
                        
                        {log.user && (
                          <div className="flex items-center space-x-1">
                            <User className="w-3 h-3" />
                            <span>{log.user}</span>
                          </div>
                        )}
                        
                        <div className="flex items-center space-x-1">
                          <Shield className="w-3 h-3" />
                          <span>{log.ip}</span>
                        </div>
                      </div>
                      
                      {showDetails.has(log.id) && log.details && (
                        <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                          <pre className="text-xs text-gray-600 whitespace-pre-wrap">
                            {JSON.stringify(log.details, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 ml-4">
                    <button
                      onClick={() => toggleDetails(log.id)}
                      className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                      title={showDetails.has(log.id) ? 'Скрыть детали' : 'Показать детали'}
                    >
                      {showDetails.has(log.id) ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Shield className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500">Логи безопасности не найдены</p>
            <p className="text-sm text-gray-400">
              {searchQuery || filterType !== 'all' || filterSeverity !== 'all'
                ? 'Попробуйте изменить параметры поиска'
                : 'События безопасности будут отображаться здесь'
              }
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
