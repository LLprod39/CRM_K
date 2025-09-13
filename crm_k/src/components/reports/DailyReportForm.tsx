'use client';

import { useState, useEffect } from 'react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Textarea } from '@/components/ui/Textarea';
import Card, { CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Separator } from '@/components/ui/Separator';
import { 
  RefreshCw, 
  Save, 
  Users, 
  Calendar, 
  DollarSign,
  AlertCircle,
  CheckCircle,
  XCircle,
  Loader2
} from 'lucide-react';
import { useToastContext } from '@/presentation/contexts';

interface StudentInfo {
  id: number;
  name: string;
  lessonTime: string;
  cost: number;
  isCompleted: boolean;
  isCancelled: boolean;
  comment?: string;
}

interface StatsData {
  lessonsPlanned: number;
  lessonsHeld: number;
  lessonsCanceled: number;
  totalEarned: number;
  paymentsReceived: number;
  cashOnHand: number;
  studentsInfo: StudentInfo[];
}

interface DailyReportFormProps {
  selectedDate: string;
  onReportCreated: () => void;
}

export default function DailyReportForm({ selectedDate, onReportCreated }: DailyReportFormProps) {
  const { success, error } = useToastContext();
  const [loading, setLoading] = useState(false);
  const [loadingStats, setLoadingStats] = useState(false);
  const [stats, setStats] = useState<StatsData | null>(null);
  const [formData, setFormData] = useState({
    lessonsPlanned: 0,
    lessonsHeld: 0,
    lessonsCanceled: 0,
    cashOnHand: 0,
    totalEarned: 0,
    paymentsReceived: 0,
    notes: '',
    issues: '',
    studentFeedback: '',
  });

  useEffect(() => {
    loadStats();
  }, [selectedDate]);

  const loadStats = async () => {
    try {
      setLoadingStats(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch(`/api/reports/stats?date=${selectedDate}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data);
        
        // Автозаполнение формы данными из системы
        setFormData(prev => ({
          ...prev,
          lessonsPlanned: data.lessonsPlanned || 0,
          lessonsHeld: data.lessonsHeld || 0,
          lessonsCanceled: data.lessonsCanceled || 0,
          totalEarned: data.totalEarned || 0,
          paymentsReceived: data.paymentsReceived || 0,
          // cashOnHand остается пустым - пользователь должен заполнить сам
        }));
      } else {
        throw new Error('Ошибка при загрузке статистики');
      }
    } catch (err) {
      console.error('Ошибка при загрузке статистики:', err);
      error('Ошибка при загрузке данных');
    } finally {
      setLoadingStats(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch('/api/reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          date: selectedDate,
          ...formData,
        }),
      });

      if (response.ok) {
        success('Отчет успешно создан!');
        onReportCreated();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Ошибка при создании отчета');
      }
    } catch (err) {
      console.error('Ошибка при создании отчета:', err);
      error(err instanceof Error ? err.message : 'Ошибка при создании отчета');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Загрузка статистики */}
      {loadingStats && (
        <Card className="border-blue-200 bg-blue-50/50">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-3">
              <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
              <span className="text-blue-800">Загружаем данные из системы...</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Автозаполненные данные */}
      {stats && (
        <Card className="border-green-200 bg-green-50/50">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg text-green-800 flex items-center space-x-2">
                <CheckCircle className="w-5 h-5" />
                <span>Данные из системы</span>
              </CardTitle>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={loadStats}
                disabled={loadingStats}
                className="border-green-300 text-green-700 hover:bg-green-100"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${loadingStats ? 'animate-spin' : ''}`} />
                Обновить
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="text-center p-3 bg-white rounded-lg border border-green-200">
                <Users className="w-5 h-5 text-green-600 mx-auto mb-1" />
                <div className="text-sm text-gray-600">Занятий запланировано</div>
                <div className="text-xl font-bold text-green-700">{stats.lessonsPlanned}</div>
              </div>
              <div className="text-center p-3 bg-white rounded-lg border border-green-200">
                <Calendar className="w-5 h-5 text-green-600 mx-auto mb-1" />
                <div className="text-sm text-gray-600">Проведено</div>
                <div className="text-xl font-bold text-green-700">{stats.lessonsHeld}</div>
              </div>
              <div className="text-center p-3 bg-white rounded-lg border border-green-200">
                <DollarSign className="w-5 h-5 text-green-600 mx-auto mb-1" />
                <div className="text-sm text-gray-600">Заработано</div>
                <div className="text-xl font-bold text-green-700">{stats.totalEarned} ₽</div>
              </div>
            </div>

            {/* Детали по ученикам */}
            {stats.studentsInfo.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium text-gray-800">Занятия за день:</h4>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {stats.studentsInfo.map((student, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-white rounded border border-green-200">
                      <div className="flex-1">
                        <div className="font-medium text-sm">{student.name}</div>
                        <div className="text-xs text-gray-600">
                          {new Date(student.lessonTime).toLocaleTimeString('ru-RU', { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium">{student.cost} ₽</span>
                        {student.isCompleted && (
                          <Badge variant="default" className="bg-green-100 text-green-800">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Проведено
                          </Badge>
                        )}
                        {student.isCancelled && (
                          <Badge variant="destructive" className="bg-red-100 text-red-800">
                            <XCircle className="w-3 h-3 mr-1" />
                            Отменено
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Форма отчета */}
      <Card>
        <CardHeader>
          <CardTitle>Заполните отчет</CardTitle>
          <CardDescription>
            Проверьте автозаполненные данные и добавьте дополнительную информацию
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Информация о занятиях */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center space-x-2">
              <Calendar className="w-5 h-5 text-blue-600" />
              <span>Информация о занятиях</span>
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="lessonsPlanned">Запланировано занятий</Label>
                <Input
                  id="lessonsPlanned"
                  type="number"
                  min="0"
                  value={formData.lessonsPlanned}
                  onChange={(e) => handleInputChange('lessonsPlanned', parseInt(e.target.value) || 0)}
                  className="text-center"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="lessonsHeld">Проведено занятий</Label>
                <Input
                  id="lessonsHeld"
                  type="number"
                  min="0"
                  max={formData.lessonsPlanned}
                  value={formData.lessonsHeld}
                  onChange={(e) => handleInputChange('lessonsHeld', parseInt(e.target.value) || 0)}
                  className="text-center"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="lessonsCanceled">Отменено занятий</Label>
                <Input
                  id="lessonsCanceled"
                  type="number"
                  min="0"
                  value={formData.lessonsCanceled}
                  onChange={(e) => handleInputChange('lessonsCanceled', parseInt(e.target.value) || 0)}
                  className="text-center"
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Финансовая информация */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center space-x-2">
              <DollarSign className="w-5 h-5 text-green-600" />
              <span>Финансовая информация</span>
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="totalEarned">Заработано за день (₽)</Label>
                <Input
                  id="totalEarned"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.totalEarned}
                  onChange={(e) => handleInputChange('totalEarned', parseFloat(e.target.value) || 0)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="paymentsReceived">Получено платежей (₽)</Label>
                <Input
                  id="paymentsReceived"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.paymentsReceived}
                  onChange={(e) => handleInputChange('paymentsReceived', parseFloat(e.target.value) || 0)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cashOnHand">Наличные на руках (₽)</Label>
                <Input
                  id="cashOnHand"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.cashOnHand}
                  onChange={(e) => handleInputChange('cashOnHand', parseFloat(e.target.value) || 0)}
                  className="border-orange-300 focus:border-orange-500"
                  placeholder="Введите сумму наличных"
                />
                <p className="text-xs text-orange-600 flex items-center space-x-1">
                  <AlertCircle className="w-3 h-3" />
                  <span>Обязательно укажите сумму наличных денег</span>
                </p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Дополнительная информация */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Дополнительная информация</h3>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="notes">Заметки о дне</Label>
                <Textarea
                  id="notes"
                  placeholder="Как прошел день, что важно отметить..."
                  value={formData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="issues">Проблемы и вопросы</Label>
                <Textarea
                  id="issues"
                  placeholder="Возникшие проблемы, вопросы к администрации..."
                  value={formData.issues}
                  onChange={(e) => handleInputChange('issues', e.target.value)}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="studentFeedback">Обратная связь от родителей/учеников</Label>
                <Textarea
                  id="studentFeedback"
                  placeholder="Отзывы, комментарии, пожелания от родителей..."
                  value={formData.studentFeedback}
                  onChange={(e) => handleInputChange('studentFeedback', e.target.value)}
                  rows={3}
                />
              </div>
            </div>
          </div>

          {/* Кнопка отправки */}
          <div className="pt-4">
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Создание отчета...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Создать отчет
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}
