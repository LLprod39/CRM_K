'use client';

import React, { useState, useEffect } from 'react';
import { 
  Bell,
  Settings,
  Clock,
  MessageSquare,
  Calendar,
  Save,
  Test,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Info,
  Send,
  Edit3,
  Plus,
  Trash2
} from 'lucide-react';
import { useAuth } from '@/presentation/contexts';
import { apiRequest } from '@/lib/api';

interface NotificationSettings {
  id?: number;
  isEnabled: boolean;
  reminderBeforeLessons: number;
  dailySummaryTime: string;
  isDailySummaryEnabled: boolean;
  isWeeklySummaryEnabled: boolean;
  weeklySummaryDay: number;
  weeklySummaryTime: string;
  reminderTemplate: string;
  summaryTemplate: string;
}

interface ScheduledNotification {
  id: number;
  phoneNumber: string;
  message: string;
  scheduledTime: string;
  isSent: boolean;
  sentAt?: string;
  errorMessage?: string;
  notificationType: string;
  lesson?: {
    student: {
      fullName: string;
    };
  };
}

const defaultReminderTemplate = `🎓 Напоминание о занятии

Уважаемые родители! 
Напоминаем, что через {minutes} минут у {studentName} занятие.

📅 Время: {time}
📍 Место: {location}
👩‍🏫 Преподаватель: {teacherName}

Ждём вас! 😊`;

const defaultSummaryTemplate = `📊 Сводка за день

Добро пожаловать! Вот сводка ваших занятий:

📅 Дата: {date}
✅ Проведено занятий: {completedLessons}
📝 Запланировано на завтра: {upcomingLessons}
💰 Доход за день: {dailyRevenue} ₸

Хорошего дня! 😊`;

const weekDays = [
  'Воскресенье', 'Понедельник', 'Вторник', 'Среда', 
  'Четверг', 'Пятница', 'Суббота'
];

export default function NotificationSettings() {
  const { user } = useAuth();
  const [settings, setSettings] = useState<NotificationSettings>({
    isEnabled: true,
    reminderBeforeLessons: 60,
    dailySummaryTime: '20:00',
    isDailySummaryEnabled: false,
    isWeeklySummaryEnabled: false,
    weeklySummaryDay: 0,
    weeklySummaryTime: '18:00',
    reminderTemplate: defaultReminderTemplate,
    summaryTemplate: defaultSummaryTemplate
  });
  
  const [scheduledNotifications, setScheduledNotifications] = useState<ScheduledNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testPhone, setTestPhone] = useState('');
  const [showTemplateEditor, setShowTemplateEditor] = useState<'reminder' | 'summary' | null>(null);
  const [activeTab, setActiveTab] = useState<'settings' | 'scheduled' | 'templates'>('settings');

  useEffect(() => {
    fetchSettings();
    fetchScheduledNotifications();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await apiRequest('/api/notifications/settings');
      if (response.ok) {
        const data = await response.json();
        if (data.settings) {
          setSettings(data.settings);
        }
      }
    } catch (error) {
      console.error('Ошибка загрузки настроек:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchScheduledNotifications = async () => {
    try {
      const response = await apiRequest('/api/notifications/scheduled');
      if (response.ok) {
        const data = await response.json();
        setScheduledNotifications(data.notifications || []);
      }
    } catch (error) {
      console.error('Ошибка загрузки уведомлений:', error);
    }
  };

  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      const response = await apiRequest('/api/notifications/settings', {
        method: 'POST',
        body: JSON.stringify(settings)
      });

      if (response.ok) {
        alert('Настройки сохранены успешно!');
      } else {
        alert('Ошибка сохранения настроек');
      }
    } catch (error) {
      console.error('Ошибка сохранения:', error);
      alert('Ошибка сохранения настроек');
    } finally {
      setSaving(false);
    }
  };

  const handleTestNotification = async () => {
    if (!testPhone.trim()) {
      alert('Введите номер телефона для тестирования');
      return;
    }

    setTesting(true);
    try {
      const response = await apiRequest('/api/notifications/test', {
        method: 'POST',
        body: JSON.stringify({
          phoneNumber: testPhone,
          template: settings.reminderTemplate
        })
      });

      if (response.ok) {
        alert('Тестовое уведомление отправлено!');
      } else {
        alert('Ошибка отправки тестового уведомления');
      }
    } catch (error) {
      console.error('Ошибка тестирования:', error);
      alert('Ошибка отправки тестового уведомления');
    } finally {
      setTesting(false);
    }
  };

  const handleDeleteScheduledNotification = async (id: number) => {
    if (!confirm('Удалить запланированное уведомление?')) return;

    try {
      const response = await apiRequest(`/api/notifications/scheduled/${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        await fetchScheduledNotifications();
      }
    } catch (error) {
      console.error('Ошибка удаления уведомления:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 text-blue-500 animate-spin mx-auto mb-4" />
          <div className="text-gray-600">Загрузка настроек уведомлений...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Заголовок */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <Bell className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Настройки уведомлений</h2>
            <p className="text-gray-600">Автоматические напоминания о занятиях через WhatsApp</p>
          </div>
        </div>

        {/* Навигация по вкладкам */}
        <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
          {[
            { tab: 'settings', name: 'Основные настройки', icon: Settings },
            { tab: 'templates', name: 'Шаблоны сообщений', icon: MessageSquare },
            { tab: 'scheduled', name: 'Запланированные', icon: Calendar }
          ].map((item) => {
            const isActive = activeTab === item.tab;
            return (
              <button
                key={item.tab}
                onClick={() => setActiveTab(item.tab as 'settings' | 'scheduled' | 'templates')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
                }`}
              >
                <item.icon className="w-4 h-4" />
                <span>{item.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Основные настройки */}
      {activeTab === 'settings' && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Основные настройки</h3>
          
          {/* Включение/отключение уведомлений */}
          <div className="space-y-6">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <Bell className="w-5 h-5 text-gray-500" />
                <div>
                  <div className="font-medium text-gray-900">Включить уведомления</div>
                  <div className="text-sm text-gray-600">Автоматические напоминания через WhatsApp</div>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.isEnabled}
                  onChange={(e) => setSettings({ ...settings, isEnabled: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            {settings.isEnabled && (
              <>
                {/* Напоминания о занятиях */}
                <div className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center space-x-2 mb-4">
                    <Clock className="w-5 h-5 text-blue-500" />
                    <h4 className="font-medium text-gray-900">Напоминания о занятиях</h4>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        За сколько минут до занятия отправлять напоминание
                      </label>
                      <select
                        value={settings.reminderBeforeLessons}
                        onChange={(e) => setSettings({ ...settings, reminderBeforeLessons: Number(e.target.value) })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value={15}>15 минут</option>
                        <option value={30}>30 минут</option>
                        <option value={60}>1 час</option>
                        <option value={120}>2 часа</option>
                        <option value={180}>3 часа</option>
                        <option value={360}>6 часов</option>
                        <option value={720}>12 часов</option>
                        <option value={1440}>1 день</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Ежедневная сводка */}
                <div className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-5 h-5 text-green-500" />
                      <h4 className="font-medium text-gray-900">Ежедневная сводка</h4>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.isDailySummaryEnabled}
                        onChange={(e) => setSettings({ ...settings, isDailySummaryEnabled: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                  
                  {settings.isDailySummaryEnabled && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Время отправки ежедневной сводки
                      </label>
                      <input
                        type="time"
                        value={settings.dailySummaryTime}
                        onChange={(e) => setSettings({ ...settings, dailySummaryTime: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  )}
                </div>

                {/* Еженедельная сводка */}
                <div className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-5 h-5 text-purple-500" />
                      <h4 className="font-medium text-gray-900">Еженедельная сводка</h4>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.isWeeklySummaryEnabled}
                        onChange={(e) => setSettings({ ...settings, isWeeklySummaryEnabled: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                  
                  {settings.isWeeklySummaryEnabled && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          День недели для отправки
                        </label>
                        <select
                          value={settings.weeklySummaryDay}
                          onChange={(e) => setSettings({ ...settings, weeklySummaryDay: Number(e.target.value) })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          {weekDays.map((day, index) => (
                            <option key={index} value={index}>{day}</option>
                          ))}
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Время отправки
                        </label>
                        <input
                          type="time"
                          value={settings.weeklySummaryTime}
                          onChange={(e) => setSettings({ ...settings, weeklySummaryTime: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Кнопки действий */}
          <div className="flex items-center space-x-4 mt-6 pt-6 border-t border-gray-200">
            <button
              onClick={handleSaveSettings}
              disabled={saving}
              className="flex items-center space-x-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50"
            >
              {saving ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              <span>{saving ? 'Сохранение...' : 'Сохранить настройки'}</span>
            </button>

            {/* Тестирование */}
            <div className="flex items-center space-x-2">
              <input
                type="tel"
                placeholder="+7 (xxx) xxx-xx-xx"
                value={testPhone}
                onChange={(e) => setTestPhone(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                onClick={handleTestNotification}
                disabled={testing || !testPhone.trim()}
                className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50"
              >
                {testing ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                <span>Тест</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Шаблоны сообщений */}
      {activeTab === 'templates' && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Шаблоны сообщений</h3>
          
          <div className="space-y-6">
            {/* Шаблон напоминания */}
            <div className="p-4 border border-gray-200 rounded-lg">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <Bell className="w-5 h-5 text-blue-500" />
                  <h4 className="font-medium text-gray-900">Шаблон напоминания о занятии</h4>
                </div>
                <button
                  onClick={() => setShowTemplateEditor(showTemplateEditor === 'reminder' ? null : 'reminder')}
                  className="flex items-center space-x-1 px-3 py-1 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  <Edit3 className="w-4 h-4" />
                  <span>Редактировать</span>
                </button>
              </div>
              
              {showTemplateEditor === 'reminder' ? (
                <div className="space-y-3">
                  <textarea
                    value={settings.reminderTemplate}
                    onChange={(e) => setSettings({ ...settings, reminderTemplate: e.target.value })}
                    rows={8}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Введите шаблон напоминания..."
                  />
                  <div className="text-xs text-gray-600">
                    <strong>Доступные переменные:</strong> {'{minutes}'} - минуты до занятия, {'{studentName}'} - имя ученика, 
                    {'{time}'} - время занятия, {'{location}'} - место проведения, {'{teacherName}'} - имя преподавателя
                  </div>
                </div>
              ) : (
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="text-sm text-gray-700 whitespace-pre-wrap">
                    {settings.reminderTemplate}
                  </div>
                </div>
              )}
            </div>

            {/* Шаблон сводки */}
            <div className="p-4 border border-gray-200 rounded-lg">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <Calendar className="w-5 h-5 text-green-500" />
                  <h4 className="font-medium text-gray-900">Шаблон сводки</h4>
                </div>
                <button
                  onClick={() => setShowTemplateEditor(showTemplateEditor === 'summary' ? null : 'summary')}
                  className="flex items-center space-x-1 px-3 py-1 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  <Edit3 className="w-4 h-4" />
                  <span>Редактировать</span>
                </button>
              </div>
              
              {showTemplateEditor === 'summary' ? (
                <div className="space-y-3">
                  <textarea
                    value={settings.summaryTemplate}
                    onChange={(e) => setSettings({ ...settings, summaryTemplate: e.target.value })}
                    rows={8}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Введите шаблон сводки..."
                  />
                  <div className="text-xs text-gray-600">
                    <strong>Доступные переменные:</strong> {'{date}'} - дата, {'{completedLessons}'} - количество проведенных занятий, 
                    {'{upcomingLessons}'} - количество запланированных занятий, {'{dailyRevenue}'} - доход за день
                  </div>
                </div>
              ) : (
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="text-sm text-gray-700 whitespace-pre-wrap">
                    {settings.summaryTemplate}
                  </div>
                </div>
              )}
            </div>

            {/* Кнопка сохранения шаблонов */}
            <div className="flex justify-end">
              <button
                onClick={handleSaveSettings}
                disabled={saving}
                className="flex items-center space-x-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50"
              >
                {saving ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                <span>{saving ? 'Сохранение...' : 'Сохранить шаблоны'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Запланированные уведомления */}
      {activeTab === 'scheduled' && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Запланированные уведомления</h3>
            <button
              onClick={fetchScheduledNotifications}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Обновить</span>
            </button>
          </div>
          
          {scheduledNotifications.length > 0 ? (
            <div className="space-y-3">
              {scheduledNotifications.map((notification) => (
                <div key={notification.id} className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          notification.isSent 
                            ? 'bg-green-100 text-green-800' 
                            : notification.errorMessage
                            ? 'bg-red-100 text-red-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {notification.isSent ? (
                            <>
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Отправлено
                            </>
                          ) : notification.errorMessage ? (
                            <>
                              <AlertCircle className="w-3 h-3 mr-1" />
                              Ошибка
                            </>
                          ) : (
                            <>
                              <Clock className="w-3 h-3 mr-1" />
                              Запланировано
                            </>
                          )}
                        </span>
                        <span className="text-sm text-gray-600">
                          {notification.notificationType === 'lesson_reminder' && 'Напоминание о занятии'}
                          {notification.notificationType === 'daily_summary' && 'Ежедневная сводка'}
                          {notification.notificationType === 'weekly_summary' && 'Еженедельная сводка'}
                        </span>
                      </div>
                      
                      <div className="text-sm text-gray-700 mb-2">
                        <strong>Получатель:</strong> {notification.phoneNumber}
                        {notification.lesson && (
                          <span className="ml-4">
                            <strong>Ученик:</strong> {notification.lesson.student.fullName}
                          </span>
                        )}
                      </div>
                      
                      <div className="text-sm text-gray-600">
                        <strong>Время отправки:</strong> {new Date(notification.scheduledTime).toLocaleString('ru-RU')}
                        {notification.sentAt && (
                          <span className="ml-4">
                            <strong>Отправлено:</strong> {new Date(notification.sentAt).toLocaleString('ru-RU')}
                          </span>
                        )}
                      </div>
                      
                      {notification.errorMessage && (
                        <div className="text-sm text-red-600 mt-2">
                          <strong>Ошибка:</strong> {notification.errorMessage}
                        </div>
                      )}
                    </div>
                    
                    {!notification.isSent && (
                      <button
                        onClick={() => handleDeleteScheduledNotification(notification.id)}
                        className="ml-4 p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Удалить"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Нет запланированных уведомлений</h3>
              <p className="text-gray-500">
                Уведомления будут появляться здесь после создания занятий и включения автоматических напоминаний
              </p>
            </div>
          )}
        </div>
      )}

      {/* Информационная панель */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
        <div className="flex items-start space-x-3">
          <Info className="w-6 h-6 text-blue-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-blue-800">
            <h4 className="font-medium mb-2">Как работают уведомления:</h4>
            <ul className="space-y-1 text-blue-700">
              <li>• Напоминания отправляются автоматически за указанное время до занятия</li>
              <li>• Ежедневная сводка содержит информацию о проведенных и запланированных занятиях</li>
              <li>• Еженедельная сводка отправляется в выбранный день недели</li>
              <li>• Все уведомления отправляются через WhatsApp API</li>
              <li>• Для работы уведомлений необходимо подключить WhatsApp во вкладке "WhatsApp"</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
