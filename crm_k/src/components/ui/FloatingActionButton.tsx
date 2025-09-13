'use client';

import { ReactNode, useState } from 'react';
import { cn } from '@/shared/utils';
import { Plus, X } from 'lucide-react';

interface FloatingAction {
  icon: ReactNode;
  label: string;
  onClick: () => void;
  color?: 'blue' | 'green' | 'red' | 'purple' | 'yellow';
}

interface FloatingActionButtonProps {
  actions?: FloatingAction[];
  mainAction?: () => void;
  mainIcon?: ReactNode;
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export default function FloatingActionButton({
  actions = [],
  mainAction,
  mainIcon = <Plus className="w-6 h-6" />,
  position = 'bottom-right',
  size = 'md',
  className,
}: FloatingActionButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  const positionClasses = {
    'bottom-right': 'bottom-20 right-4',
    'bottom-left': 'bottom-20 left-4', 
    'top-right': 'top-20 right-4',
    'top-left': 'top-20 left-4',
  };

  const sizeClasses = {
    sm: 'w-12 h-12',
    md: 'w-14 h-14',
    lg: 'w-16 h-16',
  };

  const colorClasses = {
    blue: 'from-blue-600 to-blue-700',
    green: 'from-green-600 to-green-700',
    red: 'from-red-600 to-red-700',
    purple: 'from-purple-600 to-purple-700',
    yellow: 'from-yellow-600 to-yellow-700',
  };

  const handleMainClick = () => {
    if (actions.length > 0) {
      setIsOpen(!isOpen);
    } else if (mainAction) {
      mainAction();
    }
  };

  return (
    <div className={cn('fixed z-50 lg:hidden', positionClasses[position], className)}>
      {/* Список действий */}
      {actions.length > 0 && isOpen && (
        <div className="absolute bottom-16 right-0 space-y-3 animate-mobile-slide-up">
          {actions.map((action, index) => (
            <div
              key={index}
              className="flex items-center space-x-3 animate-mobile-pop-in"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <span className="bg-white/95 backdrop-blur-xl px-3 py-2 rounded-xl text-sm font-medium text-gray-700 shadow-lg border border-white/20">
                {action.label}
              </span>
              <button
                onClick={() => {
                  action.onClick();
                  setIsOpen(false);
                }}
                className={cn(
                  'w-12 h-12 rounded-full flex items-center justify-center text-white shadow-lg transition-all duration-300 active:scale-95 bg-gradient-to-br',
                  colorClasses[action.color || 'blue']
                )}
              >
                {action.icon}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Фон при открытии */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm -z-10 animate-mobile-fade-in"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Главная кнопка */}
      <button
        onClick={handleMainClick}
        className={cn(
          'bg-gradient-to-br from-blue-600 to-blue-700 rounded-full flex items-center justify-center text-white shadow-lg hover:shadow-xl transition-all duration-300 animate-mobile-bounce-in active:scale-95',
          sizeClasses[size],
          isOpen && 'rotate-45'
        )}
      >
        {isOpen && actions.length > 0 ? (
          <X className="w-6 h-6" />
        ) : (
          mainIcon
        )}
      </button>
    </div>
  );
}
