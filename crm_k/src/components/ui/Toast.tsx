'use client';

import * as React from 'react';
import { cn } from '@/shared/utils';
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react';

export interface ToastProps {
  id: string;
  type?: 'success' | 'error' | 'warning' | 'info';
  title?: string;
  description?: string;
  duration?: number;
}

interface ToastContainerProps {
  toasts: ToastProps[];
  onClose: (id: string) => void;
}

const Toast = React.forwardRef<
  HTMLDivElement,
  ToastProps & {
    onClose: (id: string) => void;
  }
>(({ id, type = 'info', title, description, duration = 5000, onClose }, ref) => {
  const [isVisible, setIsVisible] = React.useState(true);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      handleClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => onClose(id), 300); // Дождаться окончания анимации
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

  const animationClasses = isVisible
    ? 'animate-slide-in-right'
    : 'animate-slide-out-right';

  return (
    <div
      ref={ref}
      className={cn(
        'fixed top-4 right-4 z-50 flex items-start space-x-3 p-4 rounded-lg border shadow-lg max-w-md transition-all duration-300',
        variantClasses[type],
        animationClasses
      )}
    >
      <div className={cn('flex-shrink-0', iconColorClasses[type])}>
        {icons[type]}
      </div>
      
      <div className="flex-1 min-w-0">
        {title && (
          <div className="text-sm font-medium mb-1">
            {title}
          </div>
        )}
        {description && (
          <div className="text-sm opacity-90">
            {description}
          </div>
        )}
      </div>

      <button
        onClick={handleClose}
        className="flex-shrink-0 rounded-lg p-1 hover:bg-black/10 transition-colors"
        aria-label="Закрыть уведомление"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
});
Toast.displayName = 'Toast';

const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onClose }) => {
  return (
    <div className="fixed top-0 right-0 z-50 p-4 space-y-2 pointer-events-none">
      {toasts.map((toast, index) => (
        <div
          key={toast.id}
          className="pointer-events-auto"
          style={{
            transform: `translateY(${index * 8}px)`,
            zIndex: 1000 - index,
          }}
        >
          <Toast
            {...toast}
            onClose={onClose}
          />
        </div>
      ))}
    </div>
  );
};

export { Toast, ToastContainer };
