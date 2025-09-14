import React, { memo } from 'react';
import { Badge } from '@/components/ui/Badge';
import { User, Users } from 'lucide-react';

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
}

interface ChatListProps {
  chats: Chat[];
  selectedChatId?: string;
  onChatSelect: (chat: Chat) => void;
  isLoading?: boolean;
}

const ChatItem = memo(({ 
  chat, 
  isSelected, 
  onSelect 
}: { 
  chat: Chat; 
  isSelected: boolean; 
  onSelect: () => void; 
}) => {
  const formatMessageDate = (date: Date | string | null | undefined) => {
    if (!date) return '';
    
    try {
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      
      if (!(dateObj instanceof Date) || isNaN(dateObj.getTime())) {
        return '';
      }
      
      const now = new Date();
      const isToday = dateObj.toDateString() === now.toDateString();
      const isYesterday = dateObj.toDateString() === new Date(now.getTime() - 24 * 60 * 60 * 1000).toDateString();
      
      if (isToday) {
        return new Intl.DateTimeFormat('ru-RU', {
          hour: '2-digit',
          minute: '2-digit'
        }).format(dateObj);
      } else if (isYesterday) {
        return 'Вчера';
      } else {
        return new Intl.DateTimeFormat('ru-RU', {
          day: '2-digit',
          month: '2-digit'
        }).format(dateObj);
      }
    } catch (error) {
      return '';
    }
  };

  return (
    <div
      onClick={onSelect}
      className={`p-4 cursor-pointer border-b border-gray-100 hover:bg-gray-50 transition-colors ${
        isSelected ? 'bg-blue-50 border-blue-200' : ''
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
  );
});

ChatItem.displayName = 'ChatItem';

export const ChatList = memo(({ chats, selectedChatId, onChatSelect, isLoading }: ChatListProps) => {
  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (chats.length === 0) {
    return (
      <div className="p-8 text-center text-gray-500">
        <p className="text-sm">Нет активных чатов</p>
      </div>
    );
  }

  return (
    <div>
      {chats.map((chat) => (
        <ChatItem
          key={chat.id}
          chat={chat}
          isSelected={selectedChatId === chat.id}
          onSelect={() => onChatSelect(chat)}
        />
      ))}
    </div>
  );
});

ChatList.displayName = 'ChatList';
