'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Card, { CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { 
  Bell, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Eye, 
  Check,
  X,
  RefreshCw,
  Filter,
  Search
} from 'lucide-react';
import Input from '@/components/ui/Input';

interface ExtractorNotification {
  id: string;
  type: 'low_confidence' | 'missing_fields' | 'validation_error' | 'ready_for_review';
  status: 'pending' | 'acknowledged' | 'resolved';
  message: string;
  confidence: number;
  conversationId: string;
  createdAt: string;
  acknowledgedAt?: string;
  resolvedAt?: string;
  draft?: {
    id: string;
    formType: string;
    isComplete: boolean;
    draftData: any;
    recentMessages: Array<{
      id: string;
      content: string;
      senderType: string;
      createdAt: string;
    }>;
  };
}

interface ExtractorNotificationsProps {
  conversationId?: string;
  onNotificationAction?: (notificationId: string, action: string) => void;
}

export default function ExtractorNotifications({ 
  conversationId, 
  onNotificationAction 
}: ExtractorNotificationsProps) {
  const [notifications, setNotifications] = useState<ExtractorNotification[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<'all' | 'pending' | 'acknowledged' | 'resolved'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const loadNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter !== 'all') {
        params.append('status', filter);
      }
      if (conversationId) {
        params.append('conversationId', conversationId);
      }
      params.append('limit', '50');

      const response = await fetch(`/api/extractor/notifications?${params}`);
      const data = await response.json();

      if (data.success) {
        setNotifications(data.notifications);
      } else {
        console.error('Error loading notifications:', data.error);
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  }, [filter, conversationId]);

  const handleNotificationAction = async (notificationId: string, action: string) => {
    try {
      const response = await fetch('/api/extractor/notifications', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          notificationId,
          status: action === 'acknowledge' ? 'acknowledged' : 'resolved',
          action: action === 'commit' ? 'commit_draft' : undefined
        })
      });

      const data = await response.json();
      if (data.success) {
        // Обновляем локальное состояние
        setNotifications(prev => 
          prev.map(notification => 
            notification.id === notificationId 
              ? {
                  ...notification,
                  status: action === 'acknowledge' ? 'acknowledged' : 'resolved',
                  acknowledgedAt: action === 'acknowledge' ? new Date().toISOString() : notification.acknowledgedAt,
                  resolvedAt: action === 'resolved' ? new Date().toISOString() : notification.resolvedAt
                }
              : notification
          )
        );

        // Вызываем callback если передан
        onNotificationAction?.(notificationId, action);
      } else {
        console.error('Error updating notification:', data.error);
      }
    } catch (error) {
      console.error('Error updating notification:', error);
    }
  };

  const refreshNotifications = async () => {
    setRefreshing(true);
    await loadNotifications();
    setRefreshing(false);
  };

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'low_confidence':
        return <AlertTriangle className="w-5 h-5 text-orange-500" />;
      case 'missing_fields':
        return <Clock className="w-5 h-5 text-blue-500" />;
      case 'validation_error':
        return <X className="w-5 h-5 text-red-500" />;
      case 'ready_for_review':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      default:
        return <Bell className="w-5 h-5 text-gray-500" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'low_confidence':
        return 'bg-orange-100 text-orange-800';
      case 'missing_fields':
        return 'bg-blue-100 text-blue-800';
      case 'validation_error':
        return 'bg-red-100 text-red-800';
      case 'ready_for_review':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'acknowledged':
        return 'bg-blue-100 text-blue-800';
      case 'resolved':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('ru-RU', {
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: '2-digit'
    }).format(date);
  };

  const filteredNotifications = notifications.filter(notification => {
    const matchesSearch = notification.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         notification.conversationId.includes(searchQuery);
    return matchesSearch;
  });

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Уведомления экстрактора
            <Badge className="bg-blue-100 text-blue-800">
              {notifications.filter(n => n.status === 'pending').length}
            </Badge>
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={refreshNotifications}
              disabled={refreshing}
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-4 mt-4">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as any)}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm"
            >
              <option value="all">Все</option>
              <option value="pending">Ожидают</option>
              <option value="acknowledged">Просмотрены</option>
              <option value="resolved">Решены</option>
            </select>
          </div>

          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Поиск уведомлений..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {loading ? (
          <div className="flex justify-center py-8">
            <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Bell className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>Нет уведомлений</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredNotifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-4 border rounded-lg ${
                  notification.status === 'pending' 
                    ? 'border-yellow-200 bg-yellow-50' 
                    : 'border-gray-200 bg-white'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    {getNotificationIcon(notification.type)}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className={getNotificationColor(notification.type)}>
                          {notification.type === 'low_confidence' && 'Низкая уверенность'}
                          {notification.type === 'missing_fields' && 'Отсутствуют поля'}
                          {notification.type === 'validation_error' && 'Ошибка валидации'}
                          {notification.type === 'ready_for_review' && 'Готово к проверке'}
                        </Badge>
                        <Badge className={getStatusColor(notification.status)}>
                          {notification.status === 'pending' && 'Ожидает'}
                          {notification.status === 'acknowledged' && 'Просмотрено'}
                          {notification.status === 'resolved' && 'Решено'}
                        </Badge>
                        {notification.confidence > 0 && (
                          <Badge variant="outline" className="text-xs">
                            {Math.round(notification.confidence * 100)}%
                          </Badge>
                        )}
                      </div>
                      
                      <p className="text-sm text-gray-700 mb-2">
                        {notification.message}
                      </p>
                      
                      <div className="text-xs text-gray-500">
                        <p>Чат: {notification.conversationId}</p>
                        <p>Создано: {formatTime(notification.createdAt)}</p>
                        {notification.acknowledgedAt && (
                          <p>Просмотрено: {formatTime(notification.acknowledgedAt)}</p>
                        )}
                        {notification.resolvedAt && (
                          <p>Решено: {formatTime(notification.resolvedAt)}</p>
                        )}
                      </div>

                      {notification.draft && (
                        <div className="mt-3 p-3 bg-gray-50 rounded border">
                          <p className="text-xs font-medium text-gray-600 mb-2">
                            Данные черновика:
                          </p>
                          <div className="text-xs text-gray-700">
                            <p>Тип формы: {notification.draft.formType}</p>
                            <p>Завершен: {notification.draft.isComplete ? 'Да' : 'Нет'}</p>
                            {notification.draft.recentMessages.length > 0 && (
                              <p>Последние сообщения: {notification.draft.recentMessages.length}</p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    {notification.status === 'pending' && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleNotificationAction(notification.id, 'acknowledge')}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          Просмотрено
                        </Button>
                        {notification.type === 'ready_for_review' && notification.draft?.isComplete && (
                          <Button
                            size="sm"
                            onClick={() => handleNotificationAction(notification.id, 'commit')}
                          >
                            <Check className="w-4 h-4 mr-1" />
                            Подтвердить
                          </Button>
                        )}
                      </>
                    )}
                    {notification.status === 'acknowledged' && (
                      <Button
                        size="sm"
                        onClick={() => handleNotificationAction(notification.id, 'resolved')}
                      >
                        <Check className="w-4 h-4 mr-1" />
                        Решено
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
