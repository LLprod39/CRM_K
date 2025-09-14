'use client';

import { Users, Calendar, DollarSign, TrendingUp, ArrowRight, Sparkles, AlertCircle, Clock } from 'lucide-react';
import { UserRole } from '@/domain/entities/User';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/presentation/contexts';
import { apiRequest } from '@/lib/api';

export default function Home() {
  const { user } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState({
    students: 0,
    todayLessons: 0,
    monthlyRevenue: 0,
    debts: 0
  });

  useEffect(() => {
    // Загружаем статистику
    const fetchStats = async () => {
      if (!user) return;
      
      try {
        const [studentsRes, lessonsRes, financesRes] = await Promise.all([
          apiRequest('/api/students'),
          apiRequest('/api/lessons'),
          apiRequest('/api/finances/stats?period=month')
        ]);

        if (studentsRes.ok) {
          const students = await studentsRes.json();
          setStats(prev => ({ ...prev, students: students.length }));
        }

        if (lessonsRes.ok) {
          const lessons = await lessonsRes.json();
          const today = new Date().toDateString();
          const todayLessons = lessons.filter((lesson: { date: string | Date }) => 
            new Date(lesson.date).toDateString() === today
          );
          setStats(prev => ({ ...prev, todayLessons: todayLessons.length }));
        }

        if (financesRes.ok) {
          const finances = await financesRes.json();
          setStats(prev => ({ 
            ...prev, 
            monthlyRevenue: finances.totalRevenue || 0,
            debts: finances.totalDebt || 0
          }));
        }
      } catch (error) {
        console.error('Ошибка при загрузке статистики:', error);
      }
    };

    fetchStats();
  }, [user]);

  const statCards = [
    {
      title: 'Всего учеников',
      value: stats.students,
      icon: Users,
      color: 'purple',
      href: '/students'
    },
    {
      title: 'Занятий сегодня',
      value: stats.todayLessons,
      icon: Calendar,
      color: 'sky',
      href: '/schedule'
    },
    {
      title: 'Доход за месяц',
      value: `₸${stats.monthlyRevenue.toLocaleString()}`,
      icon: TrendingUp,
      color: 'green',
      href: '/finances'
    },
    {
      title: 'Задолженности',
      value: `₸${stats.debts.toLocaleString()}`,
      icon: AlertCircle,
      color: 'red',
      href: '/finances'
    }
  ];

  const quickActions = [
    {
      title: 'Добавить ученика',
      description: 'Создать нового ученика в системе',
      icon: Users,
      color: 'purple',
      href: '/students'
    },
    {
      title: user?.role === UserRole.ADMIN ? 'Заполнить расписание' : 'Просмотреть расписание',
      description: user?.role === UserRole.ADMIN ? 'Добавить новое занятие в расписание' : 'Посмотреть все запланированные занятия',
      icon: Calendar,
      color: 'sky',
      href: '/schedule'
    },
    {
      title: 'Посмотреть финансы',
      description: 'Открыть финансовый отчет',
      icon: DollarSign,
      color: 'green',
      href: '/finances'
    }
  ];

  return (
    <ProtectedRoute>
      {/* Десктопная версия */}
      <div className="space-y-8 hidden lg:block">
        {/* Заголовок */}
        <div className="text-center">
          <div className="flex items-center justify-center mb-4">
            <h1 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Добро пожаловать, {user?.name}!
            </h1>
          </div>
        </div>

      {/* Статистические карточки */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6">
        {statCards.map((card, index) => (
          <Link
            key={card.title}
            href={card.href}
            className="group animate-fade-in"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className="bg-white/95 backdrop-blur-sm p-6 rounded-xl shadow-lg border border-gray-200/50 hover:shadow-xl transition-all duration-300 hover:scale-105 hover:-translate-y-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className={`p-3 bg-${card.color}-100 rounded-xl group-hover:scale-110 transition-transform duration-200`}>
                    <card.icon className={`w-6 h-6 text-${card.color}-600`} />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">{card.title}</p>
                    <p className="text-2xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                      {card.value}
                    </p>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all duration-200" />
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Быстрые действия */}
      <div className="bg-white/95 backdrop-blur-sm p-6 sm:p-8 rounded-xl shadow-lg border border-gray-200/50 animate-fade-in">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
          <Sparkles className="w-6 h-6 text-blue-600 mr-2 stroke-1.5" />
          Быстрые действия
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {quickActions.map((action, index) => (
            <Link
              key={action.title}
              href={action.href}
              className="group animate-scale-in"
              style={{ animationDelay: `${index * 150}ms` }}
            >
              <div className="p-6 text-left border border-gray-200/50 rounded-xl hover:border-blue-300 hover:shadow-lg transition-all duration-300 hover:scale-105 hover:-translate-y-1 bg-gradient-to-br from-white to-gray-50/50">
                <div className={`w-12 h-12 bg-${action.color}-100 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-200`}>
                  <action.icon className={`w-6 h-6 text-${action.color}-600`} />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors mb-2">
                  {action.title}
                </h3>
                <p className="text-sm text-gray-600 group-hover:text-gray-700 transition-colors">
                  {action.description}
                </p>
                <div className="mt-4 flex items-center text-blue-600 group-hover:text-blue-700 transition-colors">
                  <span className="text-sm font-medium">Перейти</span>
                  <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform duration-200" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Последние действия */}
      <div className="bg-white/95 backdrop-blur-sm p-6 sm:p-8 rounded-xl shadow-lg border border-gray-200/50 animate-fade-in">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
          <Clock className="w-6 h-6 text-blue-600 mr-2" />
          Последние действия
        </h2>
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Clock className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-gray-500 text-lg mb-2">Пока нет данных для отображения</p>
          <p className="text-sm text-gray-400">
            {user?.role === UserRole.ADMIN 
              ? 'Начните с добавления первого ученика или запланируйте занятие'
              : 'Начните с добавления первого ученика или посмотрите расписание'
            }
          </p>
          <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/students"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Users className="w-4 h-4 mr-2" />
              Добавить ученика
            </Link>
            <Link
              href="/schedule"
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Calendar className="w-4 h-4 mr-2" />
              {user?.role === UserRole.ADMIN ? 'Запланировать занятие' : 'Просмотреть расписание'}
            </Link>
          </div>
        </div>
      </div>
      </div>

      {/* Мобильная версия */}
      <div className="lg:hidden space-y-6 p-4">
        {/* Приветственная карточка */}
        <div className="mobile-card-modern animate-mobile-bounce-in">
          <div className="text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-500 via-blue-600 to-purple-600 rounded-3xl mx-auto mb-6 flex items-center justify-center shadow-2xl animate-mobile-glow relative">
              <span className="text-white text-2xl font-bold">
                {user?.name?.charAt(0).toUpperCase() || 'U'}
              </span>
              {/* Декоративные кольца */}
              <div className="absolute inset-0 rounded-3xl border-2 border-white/20"></div>
              <div className="absolute -inset-2 rounded-3xl border border-blue-200/30 animate-ping"></div>
            </div>
            <h1 className="mobile-title-gradient">
              Добро пожаловать!
            </h1>
            <div className="flex items-center justify-center space-x-3 mb-4">
              <div className="w-2 h-2 rounded-full bg-gradient-to-r from-green-400 to-green-500"></div>
              <p className="text-gray-700 font-semibold">
                {user?.name}
              </p>
              <div className="px-3 py-1 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full">
                <span className="text-xs font-bold text-blue-700">
                  {user?.role === UserRole.ADMIN ? '👑 Администратор' : '👤 Пользователь'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Статистические карточки */}
        <div className="grid grid-cols-2 gap-3">
          {statCards.map((card, index) => (
            <Link
              key={card.title}
              href={card.href}
              className="animate-mobile-pop-in mobile-interactive-modern"
              style={{ animationDelay: `${index * 150}ms` }}
            >
              <div className="mobile-stat-modern text-center relative overflow-hidden">
                <div className={`w-14 h-14 mx-auto mb-4 rounded-2xl flex items-center justify-center bg-gradient-to-br ${
                  card.color === 'purple' ? 'from-purple-400 via-purple-500 to-purple-600' :
                  card.color === 'sky' ? 'from-sky-400 via-sky-500 to-sky-600' :
                  card.color === 'blue' ? 'from-blue-400 via-blue-500 to-blue-600' :
                  card.color === 'green' ? 'from-green-400 via-green-500 to-emerald-600' :
                  card.color === 'yellow' ? 'from-yellow-400 via-yellow-500 to-orange-600' :
                  'from-red-400 via-red-500 to-red-600'
                } shadow-xl relative`}>
                  <card.icon className="w-7 h-7 text-white drop-shadow-sm" />
                  {/* Градиентный ободок */}
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/20 to-transparent"></div>
                </div>
                <p className="text-xl font-bold text-gray-900 mb-2 leading-tight">
                  {card.value}
                </p>
                <p className="text-xs font-bold text-gray-600 uppercase tracking-wide leading-tight">
                  {card.title}
                </p>
                
                {/* Декоративные элементы */}
                <div className="absolute top-2 right-2 w-8 h-8 bg-gradient-to-br from-white/10 to-transparent rounded-full"></div>
                <div className="absolute bottom-2 left-2 w-6 h-6 bg-gradient-to-br from-white/5 to-transparent rounded-full"></div>
              </div>
            </Link>
          ))}
        </div>

        {/* Быстрые действия */}
        <div className="mobile-card-modern animate-mobile-slide-up" style={{ animationDelay: '800ms' }}>
          <div className="flex items-center mb-6">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-500 via-purple-600 to-pink-600 rounded-2xl mr-3 flex items-center justify-center shadow-lg">
              <span className="text-white text-lg">⚡</span>
            </div>
            <h2 className="mobile-subtitle-modern mb-0">Быстрые действия</h2>
          </div>
          <div className="space-y-4">
            {quickActions.map((action, index) => (
              <Link
                key={action.title}
                href={action.href}
                className="flex items-center p-5 bg-gradient-to-r from-white/80 to-white/40 rounded-3xl border border-white/60 backdrop-blur-sm transition-all duration-300 mobile-interactive-modern shadow-sm"
              >
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mr-4 bg-gradient-to-br ${
                  action.color === 'purple' ? 'from-purple-400 via-purple-500 to-purple-600' :
                  action.color === 'sky' ? 'from-sky-400 via-sky-500 to-sky-600' :
                  action.color === 'blue' ? 'from-blue-400 via-blue-500 to-blue-600' :
                  action.color === 'green' ? 'from-green-400 via-green-500 to-emerald-600' :
                  'from-yellow-400 via-yellow-500 to-orange-600'
                } shadow-lg relative`}>
                  <action.icon className="w-6 h-6 text-white drop-shadow-sm" />
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/20 to-transparent"></div>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-gray-900 text-base leading-tight mb-1">
                    {action.title}
                  </h3>
                  <p className="text-sm text-gray-600 leading-tight">
                    {action.description}
                  </p>
                </div>
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center ml-3">
                  <span className="text-gray-600 text-lg">→</span>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Советы для начала работы */}
        <div className="mobile-card-modern bg-gradient-to-br from-blue-50/80 via-purple-50/80 to-pink-50/80 border-blue-200/50 animate-mobile-slide-up relative overflow-hidden" style={{ animationDelay: '1000ms' }}>
          {/* Декоративный фон */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-100/30 to-purple-100/30"></div>
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-200/20 to-purple-200/20 rounded-full -translate-y-16 translate-x-16"></div>
          
          <div className="text-center relative z-10">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 via-blue-600 to-purple-600 rounded-3xl mx-auto mb-6 flex items-center justify-center shadow-2xl animate-mobile-glow relative">
              <span className="text-white text-2xl">💡</span>
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-white/20 to-transparent"></div>
              <div className="absolute -inset-1 rounded-3xl bg-gradient-to-br from-blue-400/30 to-purple-400/30 animate-pulse"></div>
            </div>
            
            <h3 className="text-xl font-bold text-gray-900 mb-3 leading-tight">
              🚀 Начните с базовых настроек
            </h3>
            <p className="text-sm text-gray-700 mb-6 leading-relaxed font-medium">
              {user?.role === UserRole.ADMIN 
                ? 'Добавьте первого ученика и запланируйте занятие для начала работы с системой'
                : 'Просмотрите расписание и добавьте первого ученика'
              }
            </p>
            
            <div className="flex gap-3">
              <Link
                href="/students"
                className="flex-1 mobile-btn-gradient mobile-btn-primary text-sm py-4 font-bold"
              >
                👥 Добавить ученика
              </Link>
              <Link
                href="/schedule"
                className="flex-1 mobile-btn-gradient mobile-btn-secondary text-sm py-4 font-bold"
              >
                📅 Расписание
              </Link>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
