'use client';

import { useState } from 'react';
import Button from '@/components/ui/Button';
import Card, { CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { 
  CalendarDays, 
  DollarSign, 
  Users, 
  Eye, 
  Edit, 
  Trash2,
  CheckCircle,
  AlertCircle,
  Loader2,
  MessageSquare
} from 'lucide-react';
import { useToastContext } from '@/presentation/contexts';
import { formatDistance } from 'date-fns';
import { ru } from 'date-fns/locale';

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

interface ReportsListProps {
  reports: DailyReport[];
  loading: boolean;
  onReportUpdated: () => void;
}

export default function ReportsList({ reports, loading, onReportUpdated }: ReportsListProps) {
  const { success, error } = useToastContext();
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const handleDelete = async (reportId: number) => {
    if (!confirm('Вы уверены, что хотите удалить этот отчет?')) {
      return;
    }

    try {
      setDeletingId(reportId);
      const token = localStorage.getItem('token');
      
      const response = await fetch(`/api/reports/${reportId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        success('Отчет успешно удален');
        onReportUpdated();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Ошибка при удалении отчета');
      }
    } catch (err) {
      console.error('Ошибка при удалении отчета:', err);
      error(err instanceof Error ? err.message : 'Ошибка при удалении отчета');
    } finally {
      setDeletingId(null);
    }
  };

  const toggleExpanded = (reportId: number) => {
    setExpandedId(expandedId === reportId ? null : reportId);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
        <span className="ml-2 text-gray-600">Загрузка отчетов...</span>
      </div>
    );
  }

  if (reports.length === 0) {
    return (
      <div className="text-center py-8">
        <CalendarDays className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Отчетов пока нет</h3>
        <p className="text-gray-600">Создайте свой первый ежедневный отчет</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {reports.map((report) => {
        const reportDate = new Date(report.date);
        const isExpanded = expandedId === report.id;
        const efficiency = report.lessonsPlanned > 0 
          ? Math.round((report.lessonsHeld / report.lessonsPlanned) * 100)
          : 0;

        return (
          <Card key={report.id} className={`transition-all duration-200 ${isExpanded ? 'ring-2 ring-indigo-200' : ''}`}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-lg flex items-center justify-center">
                    <CalendarDays className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">
                      {reportDate.toLocaleDateString('ru-RU', { 
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </CardTitle>
                    <CardDescription>
                      Создан {formatDistance(new Date(report.createdAt), new Date(), { addSuffix: true, locale: ru })}
                    </CardDescription>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  {report.isReviewed ? (
                    <Badge variant="default" className="bg-green-100 text-green-800">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Проверен
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                      <AlertCircle className="w-3 h-3 mr-1" />
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
                  <Users className="w-4 h-4 text-gray-600 mx-auto mb-1" />
                  <div className="text-xs text-gray-600">Эффективность</div>
                  <div className="text-lg font-bold text-gray-900">
                    {efficiency}%
                  </div>
                  <div className="text-xs text-gray-500">
                    {report.lessonsHeld}/{report.lessonsPlanned}
                  </div>
                </div>

                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <CalendarDays className="w-4 h-4 text-blue-600 mx-auto mb-1" />
                  <div className="text-xs text-gray-600">Занятий</div>
                  <div className="text-lg font-bold text-blue-900">{report.lessonsHeld}</div>
                  <div className="text-xs text-blue-600">проведено</div>
                </div>

                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <DollarSign className="w-4 h-4 text-green-600 mx-auto mb-1" />
                  <div className="text-xs text-gray-600">Заработано</div>
                  <div className="text-lg font-bold text-green-900">{report.totalEarned} ₽</div>
                  <div className="text-xs text-green-600">за день</div>
                </div>

                <div className="text-center p-3 bg-orange-50 rounded-lg">
                  <DollarSign className="w-4 h-4 text-orange-600 mx-auto mb-1" />
                  <div className="text-xs text-gray-600">Наличные</div>
                  <div className="text-lg font-bold text-orange-900">{report.cashOnHand} ₽</div>
                  <div className="text-xs text-orange-600">на руках</div>
                </div>
              </div>

              {/* Дополнительные детали */}
              {isExpanded && (
                <div className="space-y-4 pt-4 border-t border-gray-200">
                  {/* Финансовая информация */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Финансовая сводка</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <div className="text-sm text-gray-600">Получено платежей</div>
                        <div className="text-lg font-semibold text-gray-900">{report.paymentsReceived} ₽</div>
                      </div>
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <div className="text-sm text-gray-600">Отменено занятий</div>
                        <div className="text-lg font-semibold text-gray-900">{report.lessonsCanceled}</div>
                      </div>
                    </div>
                  </div>

                  {/* Заметки */}
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
                </div>
              )}

              {/* Действия */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => toggleExpanded(report.id)}
                  className="flex items-center space-x-2"
                >
                  <Eye className="w-4 h-4" />
                  <span>{isExpanded ? 'Скрыть детали' : 'Показать детали'}</span>
                </Button>

                <div className="flex items-center space-x-2">
                  {/* TODO: Добавить редактирование */}
                  {/* <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center space-x-2"
                  >
                    <Edit className="w-4 h-4" />
                    <span>Редактировать</span>
                  </Button> */}

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(report.id)}
                    disabled={deletingId === report.id}
                    className="text-red-600 border-red-300 hover:bg-red-50 flex items-center space-x-2"
                  >
                    {deletingId === report.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                    <span>Удалить</span>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
