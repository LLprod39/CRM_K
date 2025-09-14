'use client';

import { cn } from '@/shared/utils';
import { useEffect, useState } from 'react';
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';

interface MobileToastProps {
  type?: 'success' | 'error' | 'warning' | 'info';
  title?: string;
  message: string;
  duration?: number;
  onClose: () => void;
  position?: 'top' | 'bottom';
  className?: string;
}

export default function MobileToast({
  type = 'info',
  title,
  message,
  duration = 4000,
  onClose,
  position = 'top',
  className
}: MobileToastProps) {
  const [isVisible, setIsVisible] = useState(true);
  const { trigger } = useHapticFeedback();

  useEffect(() => {
    // Тактильная обратная связь при показе уведомления
    const hapticMap = {
      success: 'success' as const,
      error: 'error' as const,
      warning: 'warning' as const,
      info: 'light' as const
    };
    trigger(hapticMap[type]);

    // Автоматическое скрытие
    const timer = setTimeout(() => {
      handleClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, type, trigger]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300); // Дождаться окончания анимации
  };

  const icons = {
    success: <CheckCircle className="w-5 h-5" />,
    error: <XCircle className="w-5 h-5" />,
    warning: <AlertCircle className="w-5 h-5" />,
    info: <Info className="w-5 h-5" />
  };

  const variantClasses = {
    success: 'bg-green-50 border-green-200 text-green-800',
    error: 'bg-red-50 border-red-200 text-red-800',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800'
  };

  const iconColorClasses = {
    success: 'text-green-600',
    error: 'text-red-600',
    warning: 'text-yellow-600',
    info: 'text-blue-600'
  };

  const positionClasses = position === 'top' 
    ? 'top-4 pt-safe-area' 
    : 'bottom-4 pb-safe-area';

  const animationClasses = isVisible
    ? 'animate-mobile-slide-in-right'
    : 'animate-mobile-slide-out-right';

  return (
    <div className={cn(
      "fixed left-4 right-4 z-50 lg:hidden",
      positionClasses
    )}>
      <div className={cn(
        "mobile-card-modern border-2 backdrop-blur-xl shadow-2xl",
        variantClasses[type],
        animationClasses,
        className
      )}>
        <div className="flex items-start space-x-3">
          {/* Icon */}
          <div className={cn("flex-shrink-0 mt-0.5", iconColorClasses[type])}>
            {icons[type]}
          </div>
          
          {/* Content */}
          <div className="flex-1 min-w-0">
            {title && (
              <h4 className="text-sm font-bold leading-tight mb-1">
                {title}
              </h4>
            )}
            <p className="text-sm leading-relaxed">
              {message}
            </p>
          </div>
          
          {/* Close Button */}
          <button
            onClick={handleClose}
            className="flex-shrink-0 p-1 rounded-full hover:bg-black/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        
        {/* Progress Bar */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/10 rounded-b-3xl overflow-hidden">
          <div 
            className={cn(
              "h-full bg-current opacity-30 animate-shrink-width",
              iconColorClasses[type]
            )}
            style={{ animationDuration: `${duration}ms` }}
          />
        </div>
      </div>
    </div>
  );
}
