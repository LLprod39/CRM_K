'use client'

import { useState, useEffect, useRef } from 'react'
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
  Command
} from 'lucide-react'

interface CommandPaletteProps {
  isOpen: boolean
  onClose: () => void
  onNavigate: (tab: string, moreTab?: string) => void
  onAddUser: () => void
  onRefresh: () => void
}

interface Command {
  id: string
  title: string
  description: string
  icon: React.ComponentType<any>
  action: () => void
  category: string
}

export default function CommandPalette({ 
  isOpen, 
  onClose, 
  onNavigate, 
  onAddUser, 
  onRefresh 
}: CommandPaletteProps) {
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  const commands: Command[] = [
    // Навигация
    {
      id: 'overview',
      title: 'Обзор',
      description: 'Перейти к обзору системы',
      icon: Command,
      action: () => onNavigate('overview'),
      category: 'Навигация'
    },
    {
      id: 'users',
      title: 'Пользователи',
      description: 'Управление пользователями',
      icon: Users,
      action: () => onNavigate('users'),
      category: 'Навигация'
    },
    {
      id: 'students',
      title: 'Ученики',
      description: 'Управление учениками',
      icon: UserCheck,
      action: () => onNavigate('students'),
      category: 'Навигация'
    },
    {
      id: 'lessons',
      title: 'Занятия',
      description: 'Управление занятиями',
      icon: Calendar,
      action: () => onNavigate('lessons'),
      category: 'Навигация'
    },
    {
      id: 'settings',
      title: 'Настройки',
      description: 'Системные настройки',
      icon: Settings,
      action: () => onNavigate('settings'),
      category: 'Навигация'
    },
    {
      id: 'toys',
      title: 'Игрушки',
      description: 'Управление игрушками',
      icon: Target,
      action: () => onNavigate('more', 'toys'),
      category: 'Навигация'
    },
    {
      id: 'analytics',
      title: 'Аналитика',
      description: 'Аналитика и отчеты',
      icon: BarChart3,
      action: () => onNavigate('more', 'analytics'),
      category: 'Навигация'
    },
    {
      id: 'security',
      title: 'Безопасность',
      description: 'Логи безопасности',
      icon: Shield,
      action: () => onNavigate('more', 'security'),
      category: 'Навигация'
    },
    
    // Действия
    {
      id: 'add-user',
      title: 'Добавить пользователя',
      description: 'Создать нового пользователя',
      icon: Plus,
      action: onAddUser,
      category: 'Действия'
    },
    {
      id: 'refresh',
      title: 'Обновить данные',
      description: 'Синхронизировать с базой данных',
      icon: RefreshCw,
      action: onRefresh,
      category: 'Действия'
    },
    {
      id: 'bulk-lessons',
      title: 'Массовое создание занятий',
      description: 'Создать несколько занятий',
      icon: CalendarDays,
      action: () => onNavigate('lessons'),
      category: 'Действия'
    }
  ]

  const filteredCommands = commands.filter(command =>
    command.title.toLowerCase().includes(query.toLowerCase()) ||
    command.description.toLowerCase().includes(query.toLowerCase()) ||
    command.category.toLowerCase().includes(query.toLowerCase())
  )

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault()
          setSelectedIndex(prev => 
            prev < filteredCommands.length - 1 ? prev + 1 : 0
          )
          break
        case 'ArrowUp':
          e.preventDefault()
          setSelectedIndex(prev => 
            prev > 0 ? prev - 1 : filteredCommands.length - 1
          )
          break
        case 'Enter':
          e.preventDefault()
          if (filteredCommands[selectedIndex]) {
            filteredCommands[selectedIndex].action()
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
  }, [isOpen, selectedIndex, filteredCommands, onClose])

  useEffect(() => {
    setSelectedIndex(0)
  }, [query])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center pt-20 z-50">
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 w-full max-w-2xl mx-4">
        {/* Поиск */}
        <div className="flex items-center border-b border-gray-200 p-4">
          <Search className="w-5 h-5 text-gray-400 mr-3" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Поиск команд..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 text-lg outline-none"
          />
          <button
            onClick={onClose}
            className="ml-3 p-1 text-gray-400 hover:text-gray-600 rounded"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Список команд */}
        <div className="max-h-96 overflow-y-auto">
          {filteredCommands.length > 0 ? (
            <div className="p-2">
              {filteredCommands.map((command, index) => {
                const Icon = command.icon
                const isSelected = index === selectedIndex
                
                return (
                  <button
                    key={command.id}
                    onClick={() => {
                      command.action()
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
                        {command.title}
                      </div>
                      <div className={`text-sm ${
                        isSelected ? 'text-blue-700' : 'text-gray-500'
                      }`}>
                        {command.description}
                      </div>
                    </div>
                    <div className={`text-xs px-2 py-1 rounded ${
                      isSelected 
                        ? 'bg-blue-200 text-blue-800' 
                        : 'bg-gray-200 text-gray-600'
                    }`}>
                      {command.category}
                    </div>
                  </button>
                )
              })}
            </div>
          ) : (
            <div className="p-8 text-center text-gray-500">
              <Search className="w-8 h-8 mx-auto mb-2 text-gray-400" />
              <div>Команды не найдены</div>
              <div className="text-sm mt-1">Попробуйте другой поисковый запрос</div>
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
              <kbd className="px-1 py-0.5 bg-gray-200 rounded text-xs">Ctrl+K</kbd>
              <span className="ml-1">открыть палитру</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
