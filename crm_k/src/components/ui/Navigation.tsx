'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { 
  Users, 
  Calendar, 
  DollarSign, 
  Home,
  Menu,
  X,
  LogOut,
  User,
  Settings
} from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

const navigation = [
  { name: 'Главная', href: '/', icon: Home },
  { name: 'Ученики', href: '/students', icon: Users },
  { name: 'Расписание', href: '/schedule', icon: Calendar },
  { name: 'Финансы', href: '/finances', icon: DollarSign },
];

const adminNavigation = [
  { name: 'Админ панель', href: '/admin', icon: Settings },
  { name: 'Пользователи', href: '/admin/users', icon: Users },
];

export default function Navigation() {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const { user, logout, isLoading } = useAuth();

  return (
    <nav className="bg-white/95 backdrop-blur-md shadow-lg border-b border-gray-200/50 sticky top-0 z-50 transition-all duration-300">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Логотип */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2 group">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center shadow-md group-hover:shadow-lg transition-all duration-200 group-hover:scale-105">
                <span className="text-white font-bold text-sm">CRM</span>
              </div>
              <span className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                CRM_K
              </span>
            </Link>
          </div>

          {/* Десктопное меню */}
          <div className="hidden lg:flex items-center space-x-1">
            {user && navigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:scale-105',
                    isActive
                      ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/80'
                  )}
                >
                  <item.icon className={cn("w-4 h-4", isActive && "animate-pulse")} />
                  <span>{item.name}</span>
                </Link>
              );
            })}
            
            {user?.role === 'ADMIN' && adminNavigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:scale-105',
                    isActive
                      ? 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-md'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/80'
                  )}
                >
                  <item.icon className={cn("w-4 h-4", isActive && "animate-pulse")} />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </div>

          {/* Пользовательское меню */}
          <div className="flex items-center space-x-2">
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100/80 transition-all duration-200 hover:scale-105"
                >
                  <User className="w-4 h-4" />
                  <span className="hidden sm:block">{user.name}</span>
                  <span className="text-xs text-gray-500 hidden sm:block">({user.role})</span>
                </button>
                
                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                    <button
                      onClick={logout}
                      className="flex items-center space-x-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Выйти</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link
                  href="/login"
                  className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Войти
                </Link>
              </div>
            )}

            {/* Мобильное меню кнопка */}
            <div className="lg:hidden">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100/80 transition-all duration-200 hover:scale-105"
              >
                <div className="relative w-6 h-6">
                  <Menu className={cn("w-6 h-6 absolute transition-all duration-200", isMobileMenuOpen && "opacity-0 rotate-90")} />
                  <X className={cn("w-6 h-6 absolute transition-all duration-200", !isMobileMenuOpen && "opacity-0 -rotate-90")} />
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Мобильное меню */}
        <div className={cn(
          "lg:hidden overflow-hidden transition-all duration-300 ease-in-out",
          isMobileMenuOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
        )}>
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {user && navigation.map((item, index) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={cn(
                    'flex items-center space-x-3 px-4 py-3 rounded-lg text-base font-medium transition-all duration-200 hover:scale-105 animate-slide-in',
                    isActive
                      ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/80'
                  )}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <item.icon className={cn("w-5 h-5", isActive && "animate-pulse")} />
                  <span>{item.name}</span>
                </Link>
              );
            })}
            
            {user?.role === 'ADMIN' && adminNavigation.map((item, index) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={cn(
                    'flex items-center space-x-3 px-4 py-3 rounded-lg text-base font-medium transition-all duration-200 hover:scale-105 animate-slide-in',
                    isActive
                      ? 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-md'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/80'
                  )}
                  style={{ animationDelay: `${(navigation.length + index) * 50}ms` }}
                >
                  <item.icon className={cn("w-5 h-5", isActive && "animate-pulse")} />
                  <span>{item.name}</span>
                </Link>
              );
            })}
            
            {user && (
              <div className="border-t border-gray-200 pt-2 mt-2">
                <button
                  onClick={() => {
                    logout();
                    setIsMobileMenuOpen(false);
                  }}
                  className="flex items-center space-x-3 w-full px-4 py-3 rounded-lg text-base font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100/80 transition-all duration-200"
                >
                  <LogOut className="w-5 h-5" />
                  <span>Выйти</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
