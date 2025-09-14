'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Menu, 
  X, 
  LogOut, 
  User,
  Bell,
  Search,
  Settings,
  ChevronDown
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAuth } from '@/presentation/contexts';
import { cn } from '@/shared/utils';

export default function MobileHeader() {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { user, logout } = useAuth();

  // Отслеживание скролла для изменения стиля хедера
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Закрытие меню при клике вне его
  useEffect(() => {
    const handleClickOutside = () => setIsMenuOpen(false);
    if (isMenuOpen) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [isMenuOpen]);

  if (!user) return null;

  // Определяем заголовок страницы с эмодзи
  const getPageInfo = () => {
    switch (pathname) {
      case '/':
        return { title: 'Главная', emoji: '🏠', color: 'from-blue-500 to-blue-600' };
      case '/students':
        return { title: 'Ученики', emoji: '👥', color: 'from-green-500 to-emerald-600' };
      case '/schedule':
        return { title: 'Расписание', emoji: '📅', color: 'from-purple-500 to-purple-600' };
      case '/finances':
        return { title: 'Финансы', emoji: '💰', color: 'from-yellow-500 to-orange-600' };
      case '/flexible-subscriptions':
        return { title: 'Абонементы', emoji: '📚', color: 'from-indigo-500 to-indigo-600' };
      case '/admin':
        return { title: 'Админ панель', emoji: '⚙️', color: 'from-gray-600 to-gray-700' };
      default:
        return { title: 'CRM_K', emoji: '💼', color: 'from-blue-500 to-blue-600' };
    }
  };

  const pageInfo = getPageInfo();

  return (
    <header className={cn(
      "lg:hidden sticky top-0 z-50 transition-all duration-300",
      scrolled 
        ? "bg-white/90 backdrop-blur-xl border-b border-gray-200/50 shadow-lg" 
        : "bg-white/95 backdrop-blur-sm border-b border-white/30 shadow-md"
    )}>
      {/* Градиентная линия сверху */}
      <div className={cn("h-1 bg-gradient-to-r transition-opacity duration-300", pageInfo.color)} />
      
      <div className="px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Левая часть - логотип и заголовок */}
          <div className="flex items-center space-x-3 flex-1">
            <Link href="/" className="shrink-0">
              <div className={cn(
                "w-10 h-10 rounded-2xl flex items-center justify-center shadow-lg transition-all duration-300 bg-gradient-to-br",
                pageInfo.color,
                "hover:scale-105 active:scale-95"
              )}>
                <span className="text-lg">
                  {pageInfo.emoji}
                </span>
              </div>
            </Link>
            
            <div className="min-w-0 flex-1">
              <h1 className="text-lg font-bold text-gray-900 leading-tight truncate">
                {pageInfo.title}
              </h1>
              <div className="flex items-center space-x-2">
                <div className={cn(
                  "inline-block w-2 h-2 rounded-full bg-gradient-to-r",
                  user.role === 'ADMIN' ? "from-green-400 to-green-500" : "from-blue-400 to-blue-500"
                )} />
                <p className="text-xs text-gray-500 font-medium">
                  {user.role === 'ADMIN' ? 'Администратор' : 'Пользователь'}
                </p>
              </div>
            </div>
          </div>

          {/* Правая часть - действия */}
          <div className="flex items-center space-x-1">
            {/* Поиск */}
            <button className="w-10 h-10 rounded-full bg-gray-100/80 hover:bg-gray-200/80 active:bg-gray-300/80 flex items-center justify-center transition-all duration-200 active:scale-95">
              <Search className="w-4 h-4 text-gray-600" />
            </button>

            {/* Уведомления */}
            <button className="relative w-10 h-10 rounded-full bg-gray-100/80 hover:bg-gray-200/80 active:bg-gray-300/80 flex items-center justify-center transition-all duration-200 active:scale-95">
              <Bell className="w-4 h-4 text-gray-600" />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-gradient-to-r from-red-500 to-red-600 rounded-full border border-white animate-pulse" />
            </button>

            {/* Меню пользователя */}
            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsMenuOpen(!isMenuOpen);
                }}
                className={cn(
                  "flex items-center space-x-2 px-3 h-10 rounded-full transition-all duration-200 active:scale-95",
                  isMenuOpen 
                    ? "bg-blue-100/80" 
                    : "bg-gray-100/80 hover:bg-gray-200/80 active:bg-gray-300/80"
                )}
              >
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                  <span className="text-white text-xs font-bold">
                    {user.name?.charAt(0).toUpperCase() || 'U'}
                  </span>
                </div>
                <ChevronDown className={cn(
                  "w-3 h-3 text-gray-600 transition-transform duration-200",
                  isMenuOpen && "rotate-180"
                )} />
              </button>

              {/* Выпадающее меню */}
              {isMenuOpen && (
                <div 
                  className="absolute right-0 top-12 w-64 bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-gray-200/50 overflow-hidden animate-mobile-slide-up"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Профиль пользователя */}
                  <div className="px-6 py-4 bg-gradient-to-r from-blue-50 to-purple-50 border-b border-gray-100">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
                        <span className="text-white text-lg font-bold">
                          {user.name?.charAt(0).toUpperCase() || 'U'}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-gray-900 truncate">{user.name}</p>
                        <p className="text-xs text-gray-600 font-medium">
                          {user.role === 'ADMIN' ? 'Администратор системы' : 'Пользователь'}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Пункты меню */}
                  <div className="py-2">
                    {user.role === 'ADMIN' && (
                      <Link
                        href="/admin"
                        onClick={() => setIsMenuOpen(false)}
                        className="flex items-center space-x-3 px-6 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        <div className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center">
                          <Settings className="w-4 h-4 text-gray-600" />
                        </div>
                        <span className="font-medium">Настройки системы</span>
                      </Link>
                    )}
                    
                    <button
                      onClick={() => {
                        logout();
                        setIsMenuOpen(false);
                      }}
                      className="flex items-center space-x-3 w-full px-6 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <div className="w-8 h-8 rounded-xl bg-red-100 flex items-center justify-center">
                        <LogOut className="w-4 h-4 text-red-600" />
                      </div>
                      <span className="font-medium">Выйти из системы</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
