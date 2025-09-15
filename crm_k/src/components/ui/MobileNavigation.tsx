'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/shared/utils';
import { 
  Users, 
  Calendar, 
  DollarSign, 
  Home,
  Settings,
  CalendarDays
} from 'lucide-react';
import { useAuth } from '@/presentation/contexts';
import { UserRole } from '@/domain/entities/User';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';

const mobileNavigation = [
  { name: 'Главная', href: '/', icon: Home, gradient: 'from-blue-500 to-blue-600' },
  { name: 'Ученики', href: '/students', icon: Users, gradient: 'from-green-500 to-emerald-600' },
  { name: 'Расписание', href: '/schedule', icon: Calendar, gradient: 'from-purple-500 to-purple-600' },
  { name: 'Абонименты', href: '/subscriptions', icon: CalendarDays, gradient: 'from-indigo-500 to-indigo-600' },
  { name: 'Финансы', href: '/finances', icon: DollarSign, gradient: 'from-yellow-500 to-orange-600' },
  { name: 'Админ', href: '/admin', icon: Settings, gradient: 'from-gray-600 to-gray-700' },
];

export default function MobileNavigation() {
  const pathname = usePathname();
  const { user } = useAuth();
  const { trigger } = useHapticFeedback();

  if (!user) return null;

  // Определяем пункты навигации в зависимости от роли пользователя
  const navItems = user?.role === UserRole.ADMIN 
    ? mobileNavigation
    : mobileNavigation.slice(0, 4); // Без админ панели для обычных пользователей

  return (
    <>
      {/* Главная нижняя навигация */}
      <nav className="fixed bottom-0 left-0 right-0 lg:hidden z-50">
        <div className="bg-white/95 backdrop-blur-xl border-t border-white/20 shadow-2xl">
          {/* Градиентная линия сверху */}
          <div className="h-0.5 bg-gradient-to-r from-blue-500 via-purple-500 to-blue-600"></div>
          
          <div className="px-2 py-2 pb-safe-area">
            <div className="flex justify-around items-center">
              {navItems.map((item, index) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      "relative flex flex-col items-center justify-center min-w-[64px] h-16 rounded-2xl transition-all duration-300 ease-out",
                      "touch-manipulation select-none",
                      isActive 
                        ? "transform scale-105" 
                        : "hover:bg-gray-50/80 active:scale-95"
                    )}
                    style={{ 
                      animationDelay: `${index * 100}ms`
                    }}
                    onClick={() => trigger('light')}
                  >
                    {/* Фон для активного состояния */}
                    {isActive && (
                      <div className={cn(
                        "absolute inset-0 rounded-2xl bg-gradient-to-br opacity-10 animate-pulse",
                        item.gradient
                      )} />
                    )}
                    
                    {/* Иконка */}
                    <div className={cn(
                      "relative w-8 h-8 rounded-xl flex items-center justify-center mb-1 transition-all duration-300",
                      isActive 
                        ? `bg-gradient-to-br ${item.gradient} shadow-lg` 
                        : "bg-gray-100"
                    )}>
                      <item.icon className={cn(
                        "w-4 h-4 transition-all duration-300",
                        isActive 
                          ? "text-white transform scale-110" 
                          : "text-gray-600"
                      )} />
                      
                      {/* Индикатор активности */}
                      {isActive && (
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-gradient-to-br from-white to-blue-100 rounded-full border-2 border-white animate-pulse" />
                      )}
                    </div>
                    
                    {/* Текст */}
                    <span className={cn(
                      "text-xs font-semibold transition-all duration-300 leading-tight",
                      isActive 
                        ? "text-gray-900 transform scale-105" 
                        : "text-gray-500"
                    )}>
                      {item.name}
                    </span>
                    
                    {/* Точка под активным элементом */}
                    {isActive && (
                      <div className={cn(
                        "absolute -bottom-1 w-1 h-1 rounded-full bg-gradient-to-r animate-pulse",
                        item.gradient
                      )} />
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </nav>

    </>
  );
}
