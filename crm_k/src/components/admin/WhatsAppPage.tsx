'use client';

import React, { useState, useEffect, useRef } from 'react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { Textarea } from '@/components/ui/textarea';
import Card, { CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { 
  Loader2, 
  MessageSquare, 
  Smartphone, 
  Wifi, 
  WifiOff, 
  Search,
  Send,
  Phone,
  MoreVertical,
  Paperclip,
  Smile,
  Mic,
  Settings,
  User,
  X,
  ChevronRight,
  Circle,
  Check,
  CheckCheck,
  RefreshCw,
  Plus,
  Users
} from 'lucide-react';

interface WhatsAppStatus {
  ready: boolean;
  qrCode: string | null;
}

interface Contact {
  id: string;
  name: string;
  number: string;
  avatar?: string;
  lastSeen?: string;
  isOnline?: boolean;
}

interface Message {
  id: string;
  chatId: string;
  text: string;
  timestamp: Date;
  fromMe: boolean;
  status: 'sending' | 'sent' | 'delivered' | 'read';
}

interface Chat {
  id: string;
  name: string;
  number: string;
  avatar?: string;
  lastMessage?: string;
  lastMessageTime?: Date;
  unreadCount: number;
  isOnline?: boolean;
  isGroup: boolean;
  isMuted?: boolean;
  isArchived?: boolean;
  messages: Message[];
}

export default function WhatsAppPage() {
  const [status, setStatus] = useState<WhatsAppStatus>({ ready: false, qrCode: null });
  const [isLoading, setIsLoading] = useState(false);
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [currentMessage, setCurrentMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewChat, setShowNewChat] = useState(false);
  const [newChatNumber, setNewChatNumber] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [chatStats, setChatStats] = useState<{totalChats: number, activeChats: number} | null>(null);
  const [loadingMessage, setLoadingMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    initializeWhatsApp();
    // Проверяем статус каждые 5 секунд
    const interval = setInterval(checkStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (status.ready) {
      loadChats();
      // Автоматически обновляем чаты каждые 30 секунд
      const interval = setInterval(loadChats, 30000);
      return () => clearInterval(interval);
    }
  }, [status.ready]);

  useEffect(() => {
    scrollToBottom();
  }, [selectedChat?.messages]);

  useEffect(() => {
    if (selectedChat && status.ready) {
      // Автоматически обновляем сообщения выбранного чата каждые 10 секунд
      const interval = setInterval(() => {
        loadChatMessages(selectedChat.id);
      }, 10000);
      return () => clearInterval(interval);
    }
  }, [selectedChat?.id, status.ready]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const initializeWhatsApp = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/whatsapp?action=init');
      const data = await response.json();
      
      if (data.success) {
        setStatus({ ready: data.ready, qrCode: data.qrCode });
      }
    } catch (error) {
      console.error('Error initializing WhatsApp:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const checkStatus = async () => {
    try {
      const response = await fetch('/api/whatsapp?action=status');
      const data = await response.json();
      setStatus({ ready: data.ready, qrCode: data.qrCode });
    } catch (error) {
      console.error('Error checking status:', error);
    }
  };

  const loadChats = async () => {
    setIsRefreshing(true);
    setLoadingMessage('Загружаем чаты из WhatsApp...');
    
    try {
      const response = await fetch('/api/whatsapp?action=chats');
      const data = await response.json();
      
      if (data.success) {
        // Преобразуем даты в объекты Date при загрузке
        const processedChats = (data.chats || []).map((chat: any) => ({
          ...chat,
          lastMessageTime: chat.lastMessageTime ? new Date(chat.lastMessageTime) : null
        }));
        
        setChats(processedChats);
        setChatStats({
          totalChats: data.totalChats || 0,
          activeChats: data.activeChats || 0
        });
        setLoadingMessage('');
        console.log(`Загружено ${processedChats.length} чатов`);
      } else {
        console.error('Ошибка загрузки чатов:', data.error);
        setLoadingMessage(`Ошибка: ${data.error}`);
        
        // Если нужно переподключиться
        if (data.shouldReconnect) {
          setStatus({ ready: false, qrCode: null });
          setLoadingMessage('Соединение потеряно. Переподключение...');
          setTimeout(() => {
            initializeWhatsApp();
          }, 2000);
        }
      }
    } catch (error) {
      console.error('Error loading chats:', error);
      setLoadingMessage('Ошибка подключения к серверу');
    } finally {
      setIsRefreshing(false);
      setTimeout(() => setLoadingMessage(''), 3000); // Убираем сообщение через 3 секунды
    }
  };

  const loadChatMessages = async (chatId: string) => {
    try {
      console.log('Loading messages for chat:', chatId);
      const response = await fetch(`/api/whatsapp?action=messages&chatId=${encodeURIComponent(chatId)}`);
      const data = await response.json();
      console.log('Messages response:', data);
      
      if (data.success && data.messages) {
        // Преобразуем даты в объекты Date при загрузке сообщений
        const processedMessages = (data.messages || []).map((message: any) => ({
          ...message,
          timestamp: message.timestamp ? new Date(message.timestamp) : new Date()
        }));
        
        console.log('Processed messages:', processedMessages);
        
        setChats(prevChats => 
          prevChats.map(chat => 
            chat.id === chatId 
              ? { ...chat, messages: processedMessages }
              : chat
          )
        );
      } else {
        console.log('No messages found or error:', data);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const sendMessage = async () => {
    if (!selectedChat || !currentMessage.trim()) {
      return;
    }

    setSendingMessage(true);
    const messageId = Date.now().toString();
    const newMessage: Message = {
      id: messageId,
      chatId: selectedChat.id,
      text: currentMessage,
      timestamp: new Date(),
      fromMe: true,
      status: 'sending'
    };

    // Оптимистично добавляем сообщение в UI
    setChats(prevChats => 
      prevChats.map(chat => 
        chat.id === selectedChat.id 
          ? { 
              ...chat, 
              messages: [...chat.messages, newMessage],
              lastMessage: currentMessage,
              lastMessageTime: new Date()
            }
          : chat
      )
    );

    const messageText = currentMessage;
    setCurrentMessage('');

    try {
      const response = await fetch('/api/whatsapp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'send',
          phoneNumber: selectedChat.number,
          message: messageText,
        }),
      });

      const data = await response.json();
      
      // Обновляем статус сообщения
      setChats(prevChats => 
        prevChats.map(chat => 
          chat.id === selectedChat.id 
            ? {
                ...chat,
                messages: chat.messages.map(msg => 
                  msg.id === messageId 
                    ? { ...msg, status: data.success ? 'sent' : 'sending' }
                    : msg
                )
              }
            : chat
        )
      );

      if (!data.success) {
        alert(`Ошибка: ${data.error}`);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Ошибка при отправке сообщения');
      
      // Помечаем сообщение как неотправленное
      setChats(prevChats => 
        prevChats.map(chat => 
          chat.id === selectedChat.id 
            ? {
                ...chat,
                messages: chat.messages.filter(msg => msg.id !== messageId)
              }
            : chat
        )
      );
    } finally {
      setSendingMessage(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const startNewChat = async () => {
    if (!newChatNumber.trim()) return;

    const formattedNumber = formatPhoneNumber(newChatNumber);
    const existingChat = chats.find(chat => chat.number === formattedNumber);
    
    if (existingChat) {
      setSelectedChat(existingChat);
      setShowNewChat(false);
      setNewChatNumber('');
      return;
    }

    const newChat: Chat = {
      id: formattedNumber,
      name: formattedNumber,
      number: formattedNumber,
      unreadCount: 0,
      isGroup: false,
      isMuted: false,
      isArchived: false,
      messages: []
    };

    setChats(prev => [newChat, ...prev]);
    setSelectedChat(newChat);
    setShowNewChat(false);
    setNewChatNumber('');
  };

  const disconnect = async () => {
    try {
      await fetch('/api/whatsapp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'disconnect',
        }),
      });
      
      setStatus({ ready: false, qrCode: null });
      setChats([]);
      setSelectedChat(null);
    } catch (error) {
      console.error('Error disconnecting:', error);
    }
  };

  const formatPhoneNumber = (phone: string) => {
    // Удаляем все нецифровые символы
    const cleaned = phone.replace(/\D/g, '');
    
    // Если номер начинается с 8, заменяем на +7
    if (cleaned.startsWith('8') && cleaned.length === 11) {
      return '+7' + cleaned.slice(1);
    }
    
    // Если номер начинается с 7, добавляем +
    if (cleaned.startsWith('7') && cleaned.length === 11) {
      return '+' + cleaned;
    }
    
    return '+' + cleaned;
  };

  const formatTime = (date: Date | string | null | undefined) => {
    if (!date) return '';
    
    // Преобразуем в объект Date если это строка
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    // Проверяем что дата валидна
    if (!(dateObj instanceof Date) || isNaN(dateObj.getTime())) {
      return '';
    }
    
    return new Intl.DateTimeFormat('ru-RU', {
      hour: '2-digit',
      minute: '2-digit'
    }).format(dateObj);
  };

  const formatMessageDate = (date: Date | string | null | undefined) => {
    if (!date) return '';
    
    try {
      // Преобразуем в объект Date если это строка
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      
      // Проверяем что дата валидна
      if (!(dateObj instanceof Date) || isNaN(dateObj.getTime())) {
        return '';
      }
      
      const now = new Date();
      const isToday = dateObj.toDateString() === now.toDateString();
      const isYesterday = dateObj.toDateString() === new Date(now.getTime() - 24 * 60 * 60 * 1000).toDateString();
      
      if (isToday) {
        return formatTime(dateObj);
      } else if (isYesterday) {
        return 'Вчера';
      } else {
        return new Intl.DateTimeFormat('ru-RU', {
          day: '2-digit',
          month: '2-digit'
        }).format(dateObj);
      }
    } catch (error) {
      console.error('Error formatting message date:', error);
      return '';
    }
  };

  const getMessageStatusIcon = (status: Message['status']) => {
    switch (status) {
      case 'sending':
        return <Circle className="w-3 h-3 text-gray-400" />;
      case 'sent':
        return <Check className="w-3 h-3 text-gray-400" />;
      case 'delivered':
        return <CheckCheck className="w-3 h-3 text-gray-400" />;
      case 'read':
        return <CheckCheck className="w-3 h-3 text-blue-500" />;
      default:
        return null;
    }
  };

  const filteredChats = chats.filter(chat => 
    chat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    chat.number.includes(searchQuery)
  );

  if (!status.ready && !isLoading && !status.qrCode) {
    return (
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <MessageSquare className="w-10 h-10 text-green-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-4">WhatsApp Web</h3>
          <p className="text-gray-600 mb-8 max-w-md mx-auto">
            Подключитесь к WhatsApp для отправки сообщений клиентам и управления чатами
          </p>
          <Button onClick={initializeWhatsApp} disabled={isLoading} size="lg">
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                Подключение...
              </>
            ) : (
              <>
                <Wifi className="w-5 h-5 mr-2" />
                Подключиться к WhatsApp
              </>
            )}
          </Button>
        </div>
      </div>
    );
  }

  if (!status.ready && status.qrCode) {
    return (
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <MessageSquare className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Подключение к WhatsApp</h3>
            <p className="text-gray-600">Отсканируйте QR-код в WhatsApp на телефоне</p>
          </div>
          
          <div className="flex flex-col lg:flex-row gap-8 items-center">
            <div className="bg-white p-6 rounded-2xl border-2 border-gray-200">
              <img 
                src={status.qrCode} 
                alt="WhatsApp QR Code" 
                className="w-64 h-64"
              />
            </div>
            
            <div className="flex-1 space-y-4">
              <h4 className="text-lg font-semibold text-gray-900">Инструкция по подключению:</h4>
              <ol className="space-y-3 text-gray-700">
                <li className="flex items-start">
                  <span className="flex-shrink-0 w-6 h-6 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-sm font-semibold mr-3 mt-0.5">1</span>
                  Откройте WhatsApp на телефоне
                </li>
                <li className="flex items-start">
                  <span className="flex-shrink-0 w-6 h-6 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-sm font-semibold mr-3 mt-0.5">2</span>
                  Нажмите Меню или Настройки и выберите "Связанные устройства"
                </li>
                <li className="flex items-start">
                  <span className="flex-shrink-0 w-6 h-6 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-sm font-semibold mr-3 mt-0.5">3</span>
                  Нажмите "Связать устройство"
                </li>
                <li className="flex items-start">
                  <span className="flex-shrink-0 w-6 h-6 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-sm font-semibold mr-3 mt-0.5">4</span>
                  Отсканируйте QR-код камерой телефона
                </li>
              </ol>
              
              <div className="pt-4">
                <Button variant="outline" onClick={() => window.location.reload()}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Обновить QR-код
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Заголовок и статус */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <MessageSquare className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">WhatsApp Web</h1>
              <div className="flex items-center space-x-2 mt-1">
                <Wifi className="w-4 h-4 text-green-600" />
                <span className="text-sm text-green-800 font-medium">Подключено</span>
                <Badge className="bg-green-100 text-green-800">
                  {chats.length} активных чатов
                </Badge>
                {chatStats && (
                  <Badge variant="outline" className="text-xs">
                    Всего: {chatStats.totalChats}
                  </Badge>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <Button 
              variant="outline" 
              onClick={loadChats} 
              disabled={isRefreshing}
              className="flex items-center"
              title="Обновить список чатов"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              Синхронизировать
            </Button>
            <Button 
              variant="outline" 
              onClick={() => {
                if (confirm('Вы уверены, что хотите отключиться от WhatsApp?')) {
                  disconnect();
                }
              }} 
              className="text-red-600 hover:bg-red-50"
            >
              <WifiOff className="w-4 h-4 mr-2" />
              Отключиться
            </Button>
          </div>
        </div>
      </div>

      {/* Основной интерфейс чата */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden" style={{ height: '70vh' }}>
        <div className="flex h-full">
          {/* Левая панель - список чатов */}
          <div className="w-1/3 border-r border-gray-200 flex flex-col">
            {/* Заголовок левой панели */}
            <div className="p-4 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-900">Чаты</h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowNewChat(true)}
                  className="p-2"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              
              {/* Поиск */}
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Поиск чатов..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 text-sm"
                />
              </div>
            </div>

            {/* Индикатор загрузки */}
            {(isRefreshing || loadingMessage) && (
              <div className="px-4 py-2 bg-blue-50 border-b border-blue-200">
                <div className="flex items-center gap-2">
                  {isRefreshing && <Loader2 className="w-4 h-4 animate-spin text-blue-600" />}
                  <span className="text-sm text-blue-800">
                    {loadingMessage || 'Обновление...'}
                  </span>
                </div>
              </div>
            )}

            {/* Список чатов */}
            <div className="flex-1 overflow-y-auto">
              {showNewChat && (
                <div className="p-4 border-b border-gray-200 bg-blue-50">
                  <div className="space-y-3">
                    <h4 className="font-medium text-gray-900">Новый чат</h4>
                    <Input
                      placeholder="Введите номер телефона"
                      value={newChatNumber}
                      onChange={(e) => setNewChatNumber(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && startNewChat()}
                    />
                    <div className="flex space-x-2">
                      <Button size="sm" onClick={startNewChat} className="flex-1">
                        Начать чат
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => setShowNewChat(false)}
                      >
                        Отмена
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {filteredChats.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <MessageSquare className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p className="text-sm">
                    {searchQuery ? 'Чаты не найдены' : 'Нет активных чатов'}
                  </p>
                  {!searchQuery && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setShowNewChat(true)}
                      className="mt-3"
                    >
                      Начать новый чат
                    </Button>
                  )}
                </div>
              ) : (
                <div>
                  {filteredChats.map((chat) => (
                    <div
                      key={chat.id}
                      onClick={() => {
                        setSelectedChat(chat);
                        loadChatMessages(chat.id);
                      }}
                      className={`p-4 cursor-pointer border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                        selectedChat?.id === chat.id ? 'bg-blue-50 border-blue-200' : ''
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="relative">
                          <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                            {chat.isGroup ? (
                              <Users className="w-6 h-6 text-gray-500" />
                            ) : (
                              <User className="w-6 h-6 text-gray-500" />
                            )}
                          </div>
                          {chat.isOnline && (
                            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 border-2 border-white rounded-full"></div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium text-gray-900 truncate">
                              {chat.name}
                            </h4>
                            {chat.lastMessageTime && (
                              <span className="text-xs text-gray-500">
                                {formatMessageDate(chat.lastMessageTime)}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center justify-between">
                            <p className="text-sm text-gray-600 truncate">
                              {chat.lastMessage || (chat.isGroup ? 'Групповой чат' : 'Новый чат')}
                            </p>
                            <div className="flex items-center space-x-1">
                              {chat.isMuted && (
                                <span className="text-gray-400" title="Уведомления отключены">
                                  🔇
                                </span>
                              )}
                              {chat.unreadCount > 0 && (
                                <Badge className="text-xs px-1.5 py-0.5 bg-green-500">
                                  {chat.unreadCount > 99 ? '99+' : chat.unreadCount}
                                </Badge>
                              )}
                            </div>
                          </div>
                          {!chat.isGroup && chat.number && (
                            <p className="text-xs text-gray-400 truncate">
                              {chat.number}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Правая панель - чат */}
          <div className="flex-1 flex flex-col">
            {selectedChat ? (
              <>
                {/* Заголовок чата */}
                <div className="p-4 border-b border-gray-200 bg-white">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-gray-500" />
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">{selectedChat.name}</h3>
                        <p className="text-sm text-gray-600">{selectedChat.number}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button variant="outline" size="sm" className="p-2">
                        <Phone className="w-4 h-4" />
                      </Button>
                      <Button variant="outline" size="sm" className="p-2">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Сообщения */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                  {selectedChat.messages.length === 0 ? (
                    <div className="text-center text-gray-500 py-8">
                      <MessageSquare className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                      <p>Начните разговор с {selectedChat.name}</p>
                    </div>
                  ) : (
                    selectedChat.messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${message.fromMe ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                            message.fromMe
                              ? 'bg-green-500 text-white'
                              : 'bg-white text-gray-900 border border-gray-200'
                          }`}
                        >
                          <p className="text-sm whitespace-pre-wrap">{message.text}</p>
                          <div className={`flex items-center justify-end mt-1 space-x-1 ${
                            message.fromMe ? 'text-green-100' : 'text-gray-500'
                          }`}>
                            <span className="text-xs">
                              {formatTime(message.timestamp)}
                            </span>
                            {message.fromMe && getMessageStatusIcon(message.status)}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Поле ввода */}
                <div className="p-4 border-t border-gray-200 bg-white">
                  <div className="flex items-end space-x-2">
                    <Button variant="outline" size="sm" className="p-2 mb-1">
                      <Paperclip className="w-4 h-4" />
                    </Button>
                    <div className="flex-1 relative">
                      <Textarea
                        placeholder="Введите сообщение..."
                        value={currentMessage}
                        onChange={(e) => setCurrentMessage(e.target.value)}
                        onKeyPress={handleKeyPress}
                        disabled={sendingMessage}
                        rows={2}
                        className="resize-none pr-20 py-2"
                      />
                      <div className="absolute right-2 bottom-2 flex items-center space-x-1">
                        <Button variant="ghost" size="sm" className="p-1">
                          <Smile className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="p-1">
                          <Mic className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    <Button
                      onClick={sendMessage}
                      disabled={!currentMessage.trim() || sendingMessage}
                      size="sm"
                      className="p-2 mb-1"
                    >
                      {sendingMessage ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              /* Экран выбора чата */
              <div className="flex-1 flex items-center justify-center text-center bg-gray-50">
                <div>
                  <div className="w-32 h-32 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
                    <MessageSquare className="w-16 h-16 text-gray-400" />
                  </div>
                  <h3 className="text-xl font-medium text-gray-900 mb-2">
                    Выберите чат
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Выберите существующий чат или создайте новый для начала общения
                  </p>
                  <Button onClick={() => setShowNewChat(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Начать новый чат
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
