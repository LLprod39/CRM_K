'use client';

import { useState, useEffect } from 'react';
import { useToastContext } from '@/presentation/contexts';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Card, { CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { 
  FileText,
  Filter,
  Search,
  Eye,
  MessageSquare,
  CheckCircle,
  Clock,
  Calendar,
  User,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  Loader2,
  RefreshCw
} from 'lucide-react';
import { formatDistance } from 'date-fns';
import { ru } from 'date-fns/locale';

interface DailyReport {
  id: number;
  date: string;
  userId: number;
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
  user: {
    id: number;
    name: string;
    email: string;
  };
}

interface ReportsStats {
  totalReports: number;
  reviewedReports: number;
  pendingReports: number;
  totalEarned: number;
  totalCash: number;
  totalLessonsPlanned: number;
  totalLessonsHeld: number;
  avgReportsPerDay: number;
  reportsWithIssues: number;
  efficiency: number;
  userStats: {
    user: {
      id: number;
      name: string;
      email: string;
    };
    totalReports: number;
    reviewedReports: number;
    totalEarned: number;
    totalLessons: number;
    lastReportDate: string;
  }[];
}

export default function ReportsManagement() {
  const { success, error } = useToastContext();
  const [reports, setReports] = useState<DailyReport[]>([]);
  const [stats, setStats] = useState<ReportsStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterUser, setFilterUser] = useState('');
  const [filterReviewed, setFilterReviewed] = useState<'all' | 'reviewed' | 'pending'>('all');
  const [expandedReport, setExpandedReport] = useState<number | null>(null);
  const [reviewingReport, setReviewingReport] = useState<number | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');

  useEffect(() => {
    loadReports();
    loadStats();
  }, []);

  const loadReports = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const params = new URLSearchParams();
      if (filterUser) params.append('userId', filterUser);
      if (filterReviewed !== 'all') {
        params.append('isReviewed', filterReviewed === 'reviewed' ? 'true' : 'false');
      }

      const response = await fetch(`/api/admin/reports?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setReports(data);
      } else {
        throw new Error('Ошибка при загрузке отчетов');
      }
    } catch (err) {
      console.error('Ошибка при загрузке отчетов:', err);
      error('Ошибка при загрузке отчетов');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch('/api/admin/reports/stats', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (err) {
      console.error('Ошибка при загрузке статистики:', err);
    }
  };

  const handleReviewReport = async (reportId: number, isReviewed: boolean, notes?: string) => {
    try {
      setReviewingReport(reportId);
      const token = localStorage.getItem('token');
      
      const response = await fetch(`/api/admin/reports/${reportId}/review`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          isReviewed,
          reviewNotes: notes,
        }),
      });

      if (response.ok) {
        success(isReviewed ? 'Отчет отмечен как проверенный' : 'Отметка о проверке снята');
        loadReports();
        loadStats();
        setReviewNotes('');
        setExpandedReport(null);
      } else {
        throw new Error('Ошибка при обновлении отчета');
      }
    } catch (err) {
      console.error('Ошибка при обновлении отчета:', err);
      error(err instanceof Error ? err.message : 'Ошибка при обновлении отчета');
    } finally {
      setReviewingReport(null);
    }
  };

  const filteredReports = reports.filter(report => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        report.user.name.toLowerCase().includes(query) ||
        report.user.email.toLowerCase().includes(query) ||
        report.notes?.toLowerCase().includes(query) ||
        report.issues?.toLowerCase().includes(query)
      );
    }
    return true;
  });

  const getEfficiency = (report: DailyReport) => {
    return report.lessonsPlanned > 0 
      ? Math.round((report.lessonsHeld / report.lessonsPlanned) * 100)
      : 0;
  };

  if (loading && !stats) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        <span className="ml-3 text-gray-600">Загрузка отчетов...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Заголовок и статистика */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center space-x-3">
            <FileText className="w-7 h-7 text-indigo-600" />
            <span>Управление отчетами</span>
          </h1>
          <p className="text-gray-600 mt-1">Просмотр и контроль ежедневных отчетов пользователей</p>
        </div>

        <Button
          onClick={() => {
            loadReports();
            loadStats();
          }}
          variant="outline"
          className="self-start lg:self-auto"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Обновить
        </Button>
      </div>

      {/* Общая статистика */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <FileText className="w-5 h-5 text-blue-600" />
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
                <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <Clock className="w-5 h-5 text-yellow-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">На проверке</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.pendingReports}</p>
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
                  <TrendingUp className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Эффективность</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.efficiency}%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Фильтры */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Поиск
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Поиск по имени, email или содержимому..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Статус проверки
              </label>
              <select
                value={filterReviewed}
                onChange={(e) => setFilterReviewed(e.target.value as 'all' | 'reviewed' | 'pending')}
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="all">Все отчеты</option>
                <option value="pending">На проверке</option>
                <option value="reviewed">Проверенные</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Действия
              </label>
              <div className="flex space-x-2">
                <Button variant="outline" onClick={loadReports} className="flex-1">
                  <Filter className="w-4 h-4 mr-2" />
                  Применить
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Список отчетов */}
      <div className="space-y-4">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
            <span className="ml-2 text-gray-600">Загрузка отчетов...</span>
          </div>
        ) : filteredReports.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Отчетов не найдено</h3>
              <p className="text-gray-600">Попробуйте изменить фильтры поиска</p>
            </CardContent>
          </Card>
        ) : (
          filteredReports.map((report) => (
            <Card key={report.id} className={`transition-all duration-200 ${expandedReport === report.id ? 'ring-2 ring-indigo-200' : ''}`}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-lg flex items-center justify-center">
                      <User className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">
                        {report.user.name}
                      </CardTitle>
                      <CardDescription>
                        {new Date(report.date).toLocaleDateString('ru-RU', { 
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })} • {formatDistance(new Date(report.createdAt), new Date(), { addSuffix: true, locale: ru })}
                      </CardDescription>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    {report.issues && (
                      <Badge variant="warning" className="bg-yellow-100 text-yellow-800">
                        <AlertTriangle className="w-3 h-3 mr-1" />
                        Есть проблемы
                      </Badge>
                    )}
                    
                    {report.isReviewed ? (
                      <Badge variant="success" className="bg-green-100 text-green-800">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Проверен
                      </Badge>
                    ) : (
                      <Badge variant="warning" className="bg-yellow-100 text-yellow-800">
                        <Clock className="w-3 h-3 mr-1" />
                        На проверке
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>

              <CardContent>
                {/* Основная статистика */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <Calendar className="w-4 h-4 text-gray-600 mx-auto mb-1" />
                    <div className="text-xs text-gray-600">Эффективность</div>
                    <div className="text-lg font-bold text-gray-900">{getEfficiency(report)}%</div>
                    <div className="text-xs text-gray-500">{report.lessonsHeld}/{report.lessonsPlanned}</div>
                  </div>

                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <DollarSign className="w-4 h-4 text-blue-600 mx-auto mb-1" />
                    <div className="text-xs text-gray-600">Заработано</div>
                    <div className="text-lg font-bold text-blue-900">{report.totalEarned} ₽</div>
                  </div>

                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <DollarSign className="w-4 h-4 text-green-600 mx-auto mb-1" />
                    <div className="text-xs text-gray-600">Платежи</div>
                    <div className="text-lg font-bold text-green-900">{report.paymentsReceived} ₽</div>
                  </div>

                  <div className="text-center p-3 bg-orange-50 rounded-lg">
                    <DollarSign className="w-4 h-4 text-orange-600 mx-auto mb-1" />
                    <div className="text-xs text-gray-600">Наличные</div>
                    <div className="text-lg font-bold text-orange-900">{report.cashOnHand} ₽</div>
                  </div>
                </div>

                {/* Дополнительные детали */}
                {expandedReport === report.id && (
                  <div className="space-y-4 pt-4 border-t border-gray-200">
                    {/* Текстовая информация */}
                    {(report.notes || report.issues || report.studentFeedback) && (
                      <div className="space-y-3">
                        {report.notes && (
                          <div>
                            <h5 className="font-medium text-gray-900 mb-1">Заметки о дне</h5>
                            <p className="text-sm text-gray-700 bg-blue-50 p-3 rounded-lg">{report.notes}</p>
                          </div>
                        )}

                        {report.issues && (
                          <div>
                            <h5 className="font-medium text-gray-900 mb-1">Проблемы и вопросы</h5>
                            <p className="text-sm text-gray-700 bg-yellow-50 p-3 rounded-lg">{report.issues}</p>
                          </div>
                        )}

                        {report.studentFeedback && (
                          <div>
                            <h5 className="font-medium text-gray-900 mb-1">Обратная связь</h5>
                            <p className="text-sm text-gray-700 bg-green-50 p-3 rounded-lg">{report.studentFeedback}</p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Комментарии администратора */}
                    {report.isReviewed && report.reviewNotes && (
                      <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                        <h5 className="font-medium text-purple-900 mb-2 flex items-center space-x-2">
                          <MessageSquare className="w-4 h-4" />
                          <span>Комментарий администратора</span>
                        </h5>
                        <p className="text-sm text-purple-800">{report.reviewNotes}</p>
                      </div>
                    )}

                    {/* Форма для добавления комментария */}
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <h5 className="font-medium text-gray-900 mb-3">Административный контроль</h5>
                      
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Комментарий администратора
                          </label>
                          <textarea
                            value={reviewNotes}
                            onChange={(e) => setReviewNotes(e.target.value)}
                            placeholder="Добавьте комментарий к отчету..."
                            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            rows={3}
                          />
                        </div>

                        <div className="flex space-x-3">
                          {!report.isReviewed ? (
                            <Button
                              onClick={() => handleReviewReport(report.id, true, reviewNotes)}
                              disabled={reviewingReport === report.id}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              {reviewingReport === report.id ? (
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              ) : (
                                <CheckCircle className="w-4 h-4 mr-2" />
                              )}
                              Отметить как проверенный
                            </Button>
                          ) : (
                            <Button
                              onClick={() => handleReviewReport(report.id, false)}
                              disabled={reviewingReport === report.id}
                              variant="outline"
                            >
                              {reviewingReport === report.id ? (
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              ) : (
                                <Clock className="w-4 h-4 mr-2" />
                              )}
                              Снять отметку о проверке
                            </Button>
                          )}

                          {reviewNotes && (
                            <Button
                              onClick={() => handleReviewReport(report.id, report.isReviewed, reviewNotes)}
                              disabled={reviewingReport === report.id}
                              variant="outline"
                            >
                              <MessageSquare className="w-4 h-4 mr-2" />
                              Сохранить комментарий
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Действия */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setExpandedReport(expandedReport === report.id ? null : report.id)}
                    className="flex items-center space-x-2"
                  >
                    <Eye className="w-4 h-4" />
                    <span>{expandedReport === report.id ? 'Скрыть детали' : 'Показать детали'}</span>
                  </Button>

                  <div className="text-xs text-gray-500">
                    ID: {report.id} • Пользователь: {report.user.email}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
