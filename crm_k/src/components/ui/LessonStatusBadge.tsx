'use client';

import { CheckCircle, Clock, AlertTriangle, DollarSign, XCircle } from 'lucide-react';

interface LessonStatusBadgeProps {
  isCompleted: boolean;
  isPaid: boolean;
  isCancelled: boolean;
  size?: 'sm' | 'md' | 'lg';
  showLabels?: boolean;
}

export default function LessonStatusBadge({
  isCompleted,
  isPaid,
  isCancelled,
  size = 'md',
  showLabels = true
}: LessonStatusBadgeProps) {
  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return {
          container: 'px-2 py-1 text-xs',
          icon: 'w-3 h-3',
          dot: 'w-1.5 h-1.5'
        };
      case 'lg':
        return {
          container: 'px-4 py-2 text-base',
          icon: 'w-6 h-6',
          dot: 'w-3 h-3'
        };
      default:
        return {
          container: 'px-3 py-1.5 text-sm',
          icon: 'w-4 h-4',
          dot: 'w-2 h-2'
        };
    }
  };

  const sizeClasses = getSizeClasses();

  if (isCancelled) {
    return (
      <div className={`inline-flex items-center space-x-2 bg-gray-100 text-gray-700 border border-gray-300 rounded ${sizeClasses.container}`}>
        <XCircle className={sizeClasses.icon} />
        {showLabels && <span className="font-medium">Отменено</span>}
      </div>
    );
  }

  if (!isCompleted && !isPaid) {
    return (
      <div className={`inline-flex items-center space-x-2 bg-gray-50 text-gray-600 border border-gray-200 rounded ${sizeClasses.container}`}>
        <Clock className={sizeClasses.icon} />
        {showLabels && <span className="font-medium">Запланировано</span>}
      </div>
    );
  }

  if (isCompleted && isPaid) {
    return (
      <div className={`inline-flex items-center space-x-2 bg-gray-100 text-gray-800 border border-gray-300 rounded ${sizeClasses.container}`}>
        <CheckCircle className={sizeClasses.icon} />
        {showLabels && <span className="font-medium">Завершено</span>}
      </div>
    );
  }

  if (isCompleted && !isPaid) {
    return (
      <div className={`inline-flex items-center space-x-2 bg-gray-100 text-gray-700 border border-gray-300 rounded ${sizeClasses.container}`}>
        <DollarSign className={sizeClasses.icon} />
        {showLabels && <span className="font-medium">Ожидает оплаты</span>}
      </div>
    );
  }

  if (!isCompleted && isPaid) {
    return (
      <div className={`inline-flex items-center space-x-2 bg-gray-100 text-gray-700 border border-gray-300 rounded ${sizeClasses.container}`}>
        <AlertTriangle className={sizeClasses.icon} />
        {showLabels && <span className="font-medium">Оплачено</span>}
      </div>
    );
  }

  return null;
}

// Компонент для отображения нескольких статусов
export function LessonStatusGroup({
  isCompleted,
  isPaid,
  isCancelled,
  showLabels = true
}: Omit<LessonStatusBadgeProps, 'size'>) {
  if (isCancelled) {
    return (
      <div className="flex items-center space-x-2">
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
          <span className="text-sm text-gray-700 font-medium">Отменено</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-4">
      <div className="flex items-center space-x-2">
        <div className={`w-2 h-2 rounded-full ${isCompleted ? 'bg-gray-800' : 'bg-gray-300'}`}></div>
        <span className={`text-sm font-medium ${isCompleted ? 'text-gray-800' : 'text-gray-400'}`}>
          Проведено
        </span>
      </div>
      <div className="flex items-center space-x-2">
        <div className={`w-2 h-2 rounded-full ${isPaid ? 'bg-gray-800' : 'bg-gray-400'}`}></div>
        <span className={`text-sm font-medium ${isPaid ? 'text-gray-800' : 'text-gray-500'}`}>
          Оплачено
        </span>
      </div>
    </div>
  );
}
