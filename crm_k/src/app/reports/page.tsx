'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/presentation/contexts';
import ProtectedRoute from '@/components/ProtectedRoute';
import DailyReportForm from '@/components/reports/DailyReportForm';
import ReportsList from '@/components/reports/ReportsList';
import ReportStats from '@/components/reports/ReportStats';
import Button from '@/components/ui/Button';
import Card, { CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { 
  FileText, 
  Plus, 
  BarChart3, 
  TrendingUp,
  CalendarDays,
  Clock
} from 'lucide-react';
import { useToastContext } from '@/presentation/contexts';

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
  user: {
    name: string;
    email: string;
  };
}

export default function ReportsPage() {
  const { user } = useAuth();
  const { success, error } = useToastContext();
  const [activeTab, setActiveTab] = useState('new');
  const [reports, setReports] = useState<DailyReport[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    if (user) {
      loadReports();
    }
  }, [user]);

  const loadReports = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch('/api/reports', {
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

  const checkTodayReport = () => {
    const today = new Date().toISOString().split('T')[0];
    return reports.some(report => 
      new Date(report.date).toISOString().split('T')[0] === today
    );
  };

  const getTodayReport = () => {
    const today = new Date().toISOString().split('T')[0];
    return reports.find(report => 
      new Date(report.date).toISOString().split('T')[0] === today
    );
  };

  const hasTodayReport = checkTodayReport();
  const todayReport = getTodayReport();

  return (
    <ProtectedRoute>
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        {/* Заголовок страницы */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-8">
          <div className="space-y-2">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Ежедневные отчеты</h1>
                <p className="text-gray-600">Отслеживайте свою ежедневную активность и результаты</p>
              </div>
            </div>
          </div>

          {/* Быстрые действия */}
          <div className="flex flex-col sm:flex-row gap-3">
            {!hasTodayReport && (
              <Button
                onClick={() => setActiveTab('new')}
                className="bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
              >
                <Plus className="w-4 h-4 mr-2" />
                Создать отчет за сегодня
              </Button>
            )}
            
            <Button
              variant="outline"
              onClick={() => setActiveTab('stats')}
              className="border-indigo-200 text-indigo-600 hover:bg-indigo-50"
            >
              <BarChart3 className="w-4 h-4 mr-2" />
              Статистика
            </Button>
          </div>
        </div>

        {/* Быстрая информация */}
        {hasTodayReport && todayReport && (
          <div className="mb-8">
            <Card className="border-l-4 border-l-green-500 bg-green-50/50">
              <CardHeader className="pb-3">
                <div className="flex items-center space-x-2">
                  <CalendarDays className="w-5 h-5 text-green-600" />
                  <CardTitle className="text-lg text-green-800">Отчет за сегодня уже создан</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Занятий проведено:</span>
                    <div className="font-semibold text-green-700">{todayReport.lessonsHeld} из {todayReport.lessonsPlanned}</div>
                  </div>
                  <div>
                    <span className="text-gray-600">Заработано:</span>
                    <div className="font-semibold text-green-700">{todayReport.totalEarned} ₽</div>
                  </div>
                  <div>
                    <span className="text-gray-600">Получено платежей:</span>
                    <div className="font-semibold text-green-700">{todayReport.paymentsReceived} ₽</div>
                  </div>
                  <div>
                    <span className="text-gray-600">Наличные:</span>
                    <div className="font-semibold text-green-700">{todayReport.cashOnHand} ₽</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Основное содержимое */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:grid-cols-3">
            <TabsTrigger value="new" disabled={hasTodayReport} className="flex items-center space-x-2">
              <Plus className="w-4 h-4" />
              <span>Новый отчет</span>
            </TabsTrigger>
            <TabsTrigger value="list" className="flex items-center space-x-2">
              <FileText className="w-4 h-4" />
              <span>История</span>
            </TabsTrigger>
            <TabsTrigger value="stats" className="flex items-center space-x-2">
              <BarChart3 className="w-4 h-4" />
              <span>Статистика</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="new" className="space-y-6">
            {!hasTodayReport ? (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Clock className="w-5 h-5 text-indigo-600" />
                    <span>Создать отчет за {new Date().toLocaleDateString('ru-RU')}</span>
                  </CardTitle>
                  <CardDescription>
                    Заполните информацию о прошедшем дне. Данные автоматически подтянутся из системы.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <DailyReportForm
                    selectedDate={selectedDate}
                    onReportCreated={() => {
                      loadReports();
                      setActiveTab('list');
                      success('Отчет успешно создан!');
                    }}
                  />
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center space-y-4">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                      <FileText className="w-8 h-8 text-green-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Отчет за сегодня уже создан</h3>
                      <p className="text-gray-600">Вы можете посмотреть его в разделе "История" или создать отчет за другую дату.</p>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => setActiveTab('list')}
                      className="mt-4"
                    >
                      Посмотреть историю
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="list" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <FileText className="w-5 h-5 text-indigo-600" />
                  <span>История отчетов</span>
                </CardTitle>
                <CardDescription>
                  Все ваши ежедневные отчеты
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ReportsList 
                  reports={reports} 
                  loading={loading}
                  onReportUpdated={loadReports}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="stats" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <TrendingUp className="w-5 h-5 text-indigo-600" />
                  <span>Статистика и аналитика</span>
                </CardTitle>
                <CardDescription>
                  Анализ ваших показателей за период
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ReportStats reports={reports} loading={loading} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </ProtectedRoute>
  );
}
