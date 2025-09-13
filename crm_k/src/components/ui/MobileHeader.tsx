'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Menu, 
  X, 
  LogOut, 
  User,
  Bell,
  Search
} from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '@/presentation/contexts';
import { cn } from '@/shared/utils';

export default function MobileHeader() {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, logout } = useAuth();

  if (!user) return null;

  // Определяем заголовок страницы
  const getPageTitle = () => {
    switch (pathname) {
      case '/':
        return 'Главная';
      case '/students':
        return 'Ученики';
      case '/schedule':
        return 'Расписание';
      case '/finances':
        return 'Финансы';
      case '/flexible-subscriptions':
        return 'Абонементы';
      case '/admin':
        return 'Админ панель';
      default:
        return 'CRM_K';
    }
  };

  return (
    <header className="lg:hidden sticky top-0 z-50 bg-gradient-to-r from-white/97 to-white/95 backdrop-blur-xl border-b border-white/30 shadow-lg">
      <div className="px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Левая часть - логотип и заголовок */}
          <div className="flex items-center space-x-3">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center shadow-lg animate-mobile-glow">
                <span className="text-white font-bold text-xs">CRM</span>
              </div>
            </Link>
            <div>
              <h1 className="mobile-app-title text-lg font-bold">
                {getPageTitle()}
              </h1>
              {user.role === 'ADMIN' && (
                <p className="text-xs text-gray-500 font-medium">
                  Администратор
                </p>
              )}
            </div>
          </div>

          {/* Правая часть - действия */}
          <div className="flex items-center space-x-2">
            {/* Поиск */}
            <button className="mobile-app-button-secondary w-10 h-10 rounded-full">
              <Search className="w-5 h-5" />
            </button>

            {/* Уведомления */}
            <button className="mobile-app-button-secondary w-10 h-10 rounded-full relative">
              <Bell className="w-5 h-5" />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
            </button>

            {/* Меню пользователя */}
            <div className="relative">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="flex items-center space-x-2 mobile-app-button-secondary px-3 h-10"
              >
                <User className="w-4 h-4" />
                <span className="text-sm font-semibold max-w-20 truncate">
                  {user.name}
                </span>
                <div className={cn(
                  "transition-transform duration-200",
                  isMenuOpen && "rotate-180"
                )}>
                  <Menu className="w-4 h-4" />
                </div>
              </button>

              {/* Выпадающее меню */}
              {isMenuOpen && (
                <div className="absolute right-0 top-12 w-48 bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 py-2 animate-mobile-slide-up">
                  <div className="px-4 py-3 border-b border-gray-100">
                    <p className="text-sm font-semibold text-gray-900">{user.name}</p>
                    <p className="text-xs text-gray-500">{user.role}</p>
                  </div>
                  
                  <button
                    onClick={() => {
                      logout();
                      setIsMenuOpen(false);
                    }}
                    className="flex items-center space-x-3 w-full px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Выйти</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Градиентная линия снизу */}
      <div className="h-1 bg-gradient-to-r from-blue-500 via-blue-600 to-blue-700"></div>
    </header>
  );
}
