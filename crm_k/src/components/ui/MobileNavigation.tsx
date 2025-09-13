'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/shared/utils';
import { 
  Users, 
  Calendar, 
  DollarSign, 
  Home,
  BookOpen,
  Settings
} from 'lucide-react';
import { useAuth } from '@/presentation/contexts';
import { UserRole } from '@/domain/entities/User';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';

const mobileNavigation = [
  { name: 'Главная', href: '/', icon: Home },
  { name: 'Ученики', href: '/students', icon: Users },
  { name: 'Расписание', href: '/schedule', icon: Calendar },
  { name: 'Финансы', href: '/finances', icon: DollarSign },
];

const mobileAdminNavigation = [
  { name: 'Абонементы', href: '/flexible-subscriptions', icon: BookOpen },
  { name: 'Админ', href: '/admin', icon: Settings },
];

export default function MobileNavigation() {
  const pathname = usePathname();
  const { user } = useAuth();
  const { trigger } = useHapticFeedback();

  if (!user) return null;

  // Определяем основные пункты навигации
  const mainNavItems = mobileNavigation.slice(0, 4); // Первые 4 элемента
  const adminNavItems = user?.role === UserRole.ADMIN ? mobileAdminNavigation : [];

  // Комбинируем навигацию в зависимости от роли пользователя
  const allNavItems = user?.role === UserRole.ADMIN 
    ? [...mainNavItems.slice(0, 3), ...adminNavItems.slice(0, 1), mainNavItems[3]] // Главная, Ученики, Расписание, Админ, Финансы
    : mainNavItems;

  return (
    <>
      {/* Фиксированная мобильная навигация внизу экрана */}
      <nav className="mobile-app-nav lg:hidden">
        <div className="flex justify-around items-center h-full px-2">
          {allNavItems.map((item, index) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'mobile-app-nav-item',
                  isActive && 'active animate-mobile-bounce-in'
                )}
                style={{ 
                  animationDelay: `${index * 100}ms`,
                  animationFillMode: 'both'
                }}
                onClick={() => trigger('light')}
              >
                <item.icon 
                  className={cn(
                    'mobile-app-nav-icon',
                    isActive && 'animate-mobile-nav-pulse'
                  )} 
                />
                <span className="mobile-app-nav-text">{item.name}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Плавающая кнопка для дополнительных действий */}
      {user?.role === UserRole.ADMIN && (
        <div className="fixed bottom-20 right-4 lg:hidden z-50">
          <Link
            href="/flexible-subscriptions"
            className="w-14 h-14 bg-gradient-to-br from-blue-600 to-blue-700 rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 animate-mobile-bounce-in"
            style={{ animationDelay: '600ms' }}
          >
            <BookOpen className="w-6 h-6 text-white" />
          </Link>
        </div>
      )}
    </>
  );
}
