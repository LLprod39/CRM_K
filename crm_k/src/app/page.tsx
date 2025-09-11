'use client';

import { Users, Calendar, DollarSign, TrendingUp, ArrowRight, Sparkles, AlertCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/presentation/contexts';
import { apiRequest } from '@/lib/api';

export default function Home() {
  const { user } = useAuth();
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
      color: 'blue',
      href: '/students'
    },
    {
      title: 'Занятий сегодня',
      value: stats.todayLessons,
      icon: Calendar,
      color: 'green',
      href: '/schedule'
    },
    {
      title: 'Доход за месяц',
      value: `₸${stats.monthlyRevenue.toLocaleString()}`,
      icon: TrendingUp,
      color: 'yellow',
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
      color: 'blue',
      href: '/students'
    },
    {
      title: 'Запланировать занятие',
      description: 'Добавить новое занятие в расписание',
      icon: Calendar,
      color: 'green',
      href: '/schedule'
    },
    {
      title: 'Посмотреть финансы',
      description: 'Открыть финансовый отчет',
      icon: DollarSign,
      color: 'yellow',
      href: '/finances'
    }
  ];

  return (
    <ProtectedRoute>
      <div className="space-y-8">
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
          <Sparkles className="w-6 h-6 text-blue-600 mr-2" />
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
          <Calendar className="w-6 h-6 text-green-600 mr-2" />
          Последние действия
        </h2>
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Calendar className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-gray-500 text-lg mb-2">Пока нет данных для отображения</p>
          <p className="text-sm text-gray-400">
            Начните с добавления первого ученика или запланируйте занятие
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
              Запланировать занятие
            </Link>
          </div>
        </div>
      </div>
      </div>
    </ProtectedRoute>
  );
}
