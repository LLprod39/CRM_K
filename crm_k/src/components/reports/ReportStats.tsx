'use client';

import { useMemo } from 'react';
import Card, { CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { 
  TrendingUp, 
  TrendingDown,
  DollarSign, 
  Users, 
  Calendar,
  Target,
  Clock,
  Award,
  AlertTriangle,
  Loader2,
  BarChart3
} from 'lucide-react';

interface DailyReport {
  id: number;
  date: string;
  lessonsPlanned: number;
  lessonsHeld: number;
  lessonsCanceled: number;
  cashOnHand: number;
  totalEarned: number;
  paymentsReceived: number;
  notes?: string;
  issues?: string;
  studentFeedback?: string;
  isReviewed: boolean;
  reviewNotes?: string;
  createdAt: string;
  updatedAt: string;
}

interface ReportStatsProps {
  reports: DailyReport[];
  loading: boolean;
}

export default function ReportStats({ reports, loading }: ReportStatsProps) {
  const stats = useMemo(() => {
    if (reports.length === 0) {
      return null;
    }

    // Общая статистика
    const totalReports = reports.length;
    const totalPlanned = reports.reduce((sum, r) => sum + r.lessonsPlanned, 0);
    const totalHeld = reports.reduce((sum, r) => sum + r.lessonsHeld, 0);
    const totalCanceled = reports.reduce((sum, r) => sum + r.lessonsCanceled, 0);
    const totalEarned = reports.reduce((sum, r) => sum + r.totalEarned, 0);
    const totalPayments = reports.reduce((sum, r) => sum + r.paymentsReceived, 0);
    const totalCash = reports.reduce((sum, r) => sum + r.cashOnHand, 0);

    // Средние показатели
    const avgLessonsPerDay = totalPlanned / totalReports;
    const avgEarnedPerDay = totalEarned / totalReports;
    const avgEfficiency = totalPlanned > 0 ? (totalHeld / totalPlanned) * 100 : 0;

    // Лучший и худший дни
    const bestDay = reports.reduce((best, current) => 
      current.totalEarned > best.totalEarned ? current : best
    );

    const worstDay = reports.reduce((worst, current) => 
      current.totalEarned < worst.totalEarned ? current : worst
    );

    // Тренды (сравнение последних 7 дней с предыдущими 7)
    const sortedReports = [...reports].sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    const last7Days = sortedReports.slice(0, 7);
    const prev7Days = sortedReports.slice(7, 14);

    let earningsTrend = 0;
    let efficiencyTrend = 0;

    if (prev7Days.length > 0) {
      const last7Earnings = last7Days.reduce((sum, r) => sum + r.totalEarned, 0) / last7Days.length;
      const prev7Earnings = prev7Days.reduce((sum, r) => sum + r.totalEarned, 0) / prev7Days.length;
      earningsTrend = prev7Earnings > 0 ? ((last7Earnings - prev7Earnings) / prev7Earnings) * 100 : 0;

      const last7Planned = last7Days.reduce((sum, r) => sum + r.lessonsPlanned, 0);
      const last7Held = last7Days.reduce((sum, r) => sum + r.lessonsHeld, 0);
      const last7Efficiency = last7Planned > 0 ? (last7Held / last7Planned) * 100 : 0;

      const prev7Planned = prev7Days.reduce((sum, r) => sum + r.lessonsPlanned, 0);
      const prev7Held = prev7Days.reduce((sum, r) => sum + r.lessonsHeld, 0);
      const prev7Efficiency = prev7Planned > 0 ? (prev7Held / prev7Planned) * 100 : 0;

      efficiencyTrend = prev7Efficiency > 0 ? last7Efficiency - prev7Efficiency : 0;
    }

    // Анализ проблем
    const reportsWithIssues = reports.filter(r => r.issues && r.issues.trim().length > 0).length;
    const reviewedReports = reports.filter(r => r.isReviewed).length;

    return {
      totalReports,
      totalPlanned,
      totalHeld,
      totalCanceled,
      totalEarned,
      totalPayments,
      totalCash,
      avgLessonsPerDay,
      avgEarnedPerDay,
      avgEfficiency,
      bestDay,
      worstDay,
      earningsTrend,
      efficiencyTrend,
      reportsWithIssues,
      reviewedReports,
    };
  }, [reports]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
        <span className="ml-2 text-gray-600">Анализируем данные...</span>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-8">
        <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Недостаточно данных</h3>
        <p className="text-gray-600">Создайте несколько отчетов для получения статистики</p>
      </div>
    );
  }

  const TrendIcon = ({ value }: { value: number }) => {
    if (value > 0) return <TrendingUp className="w-4 h-4 text-green-600" />;
    if (value < 0) return <TrendingDown className="w-4 h-4 text-red-600" />;
    return <div className="w-4 h-4" />;
  };

  const getTrendColor = (value: number) => {
    if (value > 0) return 'text-green-600';
    if (value < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  return (
    <div className="space-y-6">
      {/* Общая статистика */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Calendar className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Всего отчетов</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalReports}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Общий доход</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalEarned.toLocaleString()} ₽</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Всего занятий</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalHeld}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                <Target className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Эффективность</p>
                <p className="text-2xl font-bold text-gray-900">{stats.avgEfficiency.toFixed(1)}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Тренды */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Тренды доходности</CardTitle>
            <CardDescription>Изменение за последние 7 дней</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <TrendIcon value={stats.earningsTrend} />
              <span className={`text-lg font-semibold ${getTrendColor(stats.earningsTrend)}`}>
                {stats.earningsTrend > 0 ? '+' : ''}{stats.earningsTrend.toFixed(1)}%
              </span>
            </div>
            <p className="text-sm text-gray-600 mt-2">
              Средний доход за день: {stats.avgEarnedPerDay.toFixed(0)} ₽
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Тренды эффективности</CardTitle>
            <CardDescription>Изменение показателей работы</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <TrendIcon value={stats.efficiencyTrend} />
              <span className={`text-lg font-semibold ${getTrendColor(stats.efficiencyTrend)}`}>
                {stats.efficiencyTrend > 0 ? '+' : ''}{stats.efficiencyTrend.toFixed(1)}%
              </span>
            </div>
            <p className="text-sm text-gray-600 mt-2">
              Среднее занятий в день: {stats.avgLessonsPerDay.toFixed(1)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Лучший и худший дни */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-l-4 border-l-green-500">
          <CardHeader>
            <CardTitle className="text-lg flex items-center space-x-2">
              <Award className="w-5 h-5 text-green-600" />
              <span>Лучший день</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="font-semibold">
                {new Date(stats.bestDay.date).toLocaleDateString('ru-RU')}
              </p>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Доход:</span>
                  <div className="font-semibold text-green-700">{stats.bestDay.totalEarned} ₽</div>
                </div>
                <div>
                  <span className="text-gray-600">Занятий:</span>
                  <div className="font-semibold text-green-700">{stats.bestDay.lessonsHeld}</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500">
          <CardHeader>
            <CardTitle className="text-lg flex items-center space-x-2">
              <Clock className="w-5 h-5 text-orange-600" />
              <span>День для улучшения</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="font-semibold">
                {new Date(stats.worstDay.date).toLocaleDateString('ru-RU')}
              </p>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Доход:</span>
                  <div className="font-semibold text-orange-700">{stats.worstDay.totalEarned} ₽</div>
                </div>
                <div>
                  <span className="text-gray-600">Занятий:</span>
                  <div className="font-semibold text-orange-700">{stats.worstDay.lessonsHeld}</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Дополнительная аналитика */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Дополнительная аналитика</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <AlertTriangle className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900">{stats.reportsWithIssues}</div>
              <div className="text-sm text-gray-600">Отчетов с проблемами</div>
              <Badge variant="outline" className="mt-2">
                {((stats.reportsWithIssues / stats.totalReports) * 100).toFixed(1)}%
              </Badge>
            </div>

            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <Award className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900">{stats.reviewedReports}</div>
              <div className="text-sm text-gray-600">Проверено админом</div>
              <Badge variant="outline" className="mt-2">
                {((stats.reviewedReports / stats.totalReports) * 100).toFixed(1)}%
              </Badge>
            </div>

            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <DollarSign className="w-8 h-8 text-green-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900">{stats.totalCash.toLocaleString()}</div>
              <div className="text-sm text-gray-600">Общая сумма наличных</div>
              <Badge variant="outline" className="mt-2">
                ₽
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Детальная статистика */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Сводка по занятиям</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 border border-gray-200 rounded-lg">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{stats.totalPlanned}</div>
                <div className="text-sm text-gray-600">Запланировано</div>
              </div>
            </div>

            <div className="p-4 border border-gray-200 rounded-lg">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{stats.totalHeld}</div>
                <div className="text-sm text-gray-600">Проведено</div>
              </div>
            </div>

            <div className="p-4 border border-gray-200 rounded-lg">
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{stats.totalCanceled}</div>
                <div className="text-sm text-gray-600">Отменено</div>
              </div>
            </div>
          </div>

          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <div className="text-sm text-blue-800">
              <strong>Анализ:</strong> Из {stats.totalPlanned} запланированных занятий было проведено {stats.totalHeld} ({stats.avgEfficiency.toFixed(1)}%). 
              {stats.totalCanceled > 0 && ` Отменено ${stats.totalCanceled} занятий.`}
              {stats.avgEfficiency >= 80 && ' Отличные показатели эффективности!'}
              {stats.avgEfficiency < 60 && ' Рекомендуется проанализировать причины отмен.'}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
