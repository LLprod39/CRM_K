import React, { memo } from 'react';
import { Circle, Check, CheckCheck } from 'lucide-react';

interface Message {
  id: string;
  chatId: string;
  text: string;
  timestamp: Date;
  fromMe: boolean;
  status: 'sending' | 'sent' | 'delivered' | 'read';
}

interface MessageListProps {
  messages: Message[];
  isLoading?: boolean;
  onLoadMore?: () => void;
  hasMore?: boolean;
}

const MessageItem = memo(({ message }: { message: Message }) => {
  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('ru-RU', {
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
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

  return (
    <div className={`flex ${message.fromMe ? 'justify-end' : 'justify-start'}`}>
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
  );
});

MessageItem.displayName = 'MessageItem';

export const MessageList = memo(({ messages, isLoading, onLoadMore, hasMore }: MessageListProps) => {
  if (isLoading) {
    return (
      <div className="flex justify-center py-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="text-center text-gray-500 py-8">
        <p>Нет сообщений</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {hasMore && onLoadMore && (
        <div className="text-center py-2">
          <button
            onClick={onLoadMore}
            className="text-xs text-blue-600 hover:text-blue-800 underline"
          >
            Загрузить больше сообщений
          </button>
        </div>
      )}
      {messages.map((message) => (
        <MessageItem key={message.id} message={message} />
      ))}
    </div>
  );
});

MessageList.displayName = 'MessageList';
