'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { 
  Users, 
  Calendar, 
  DollarSign, 
  Settings,
  BarChart3,
  UserPlus,
  Activity,
  Shield,
  Home,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import { useState } from 'react'

const adminNavigation = [
  { 
    name: 'Обзор', 
    href: '/admin', 
    icon: Home,
    description: 'Главная панель управления'
  },
  { 
    name: 'Пользователи', 
    href: '/admin/users', 
    icon: Users,
    description: 'Управление пользователями'
  },
  { 
    name: 'Статистика', 
    href: '/admin/stats', 
    icon: BarChart3,
    description: 'Аналитика и отчеты'
  },
  { 
    name: 'Занятия', 
    href: '/admin/lessons', 
    icon: Calendar,
    description: 'Управление занятиями'
  },
  { 
    name: 'Финансы', 
    href: '/admin/finances', 
    icon: DollarSign,
    description: 'Финансовые отчеты'
  },
  { 
    name: 'Настройки', 
    href: '/admin/settings', 
    icon: Settings,
    description: 'Системные настройки'
  }
]

interface AdminSidebarProps {
  className?: string
  isMobileOpen?: boolean
  onMobileClose?: () => void
}

export default function AdminSidebar({ className, isMobileOpen, onMobileClose }: AdminSidebarProps) {
  const pathname = usePathname()
  const [isCollapsed, setIsCollapsed] = useState(false)

  return (
    <>
      {/* Мобильный оверлей */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={onMobileClose}
        />
      )}
      
      {/* Боковая панель */}
      <div className={cn(
        "bg-white border-r border-gray-200 transition-all duration-300 ease-in-out",
        "w-64 lg:w-64",
        "fixed lg:relative z-50 lg:z-auto",
        "h-full max-h-screen overflow-y-auto",
        isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        "lg:block",
        className
      )}>
      {/* Заголовок */}
      <div className="p-4 sm:p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-red-600 rounded-lg flex items-center justify-center shadow-md">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Админ панель</h2>
              <p className="text-xs text-gray-500">CRM_K</p>
            </div>
          </div>
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden lg:block p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            {isCollapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {/* Навигация */}
      <nav className="p-3 sm:p-4 space-y-2">
        {adminNavigation.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={onMobileClose}
              className={cn(
                "flex items-center space-x-3 px-3 py-3 rounded-xl text-sm font-medium transition-all duration-200 group relative",
                "touch-manipulation", // Улучшает тач-события на мобильных
                isActive
                  ? "bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg shadow-red-500/25"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-50 active:bg-gray-100"
              )}
            >
              <div className={cn(
                "flex-shrink-0 transition-transform duration-200",
                isActive && "scale-110"
              )}>
                <item.icon className="w-5 h-5" />
              </div>
              
              {!isCollapsed && (
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{item.name}</div>
                  <div className={cn(
                    "text-xs truncate transition-colors",
                    isActive ? "text-red-100" : "text-gray-500"
                  )}>
                    {item.description}
                  </div>
                </div>
              )}

              {/* Индикатор активности */}
              {isActive && (
                <div className="absolute right-2 w-2 h-2 bg-white rounded-full animate-pulse" />
              )}

              {/* Tooltip для свернутого состояния */}
              {isCollapsed && (
                <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                  {item.name}
                </div>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Дополнительная информация */}
      {!isCollapsed && (
        <div className="p-4 mt-auto">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-200">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <Activity className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <div className="text-sm font-medium text-gray-900">Система активна</div>
                <div className="text-xs text-gray-500">Все сервисы работают</div>
              </div>
            </div>
          </div>
        </div>
      )}
      </div>
    </>
  )
}
