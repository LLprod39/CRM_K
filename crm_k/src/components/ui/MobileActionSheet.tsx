'use client';

import { cn } from '@/shared/utils';
import { ReactNode } from 'react';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';

interface ActionSheetAction {
  label: string;
  icon?: ReactNode;
  variant?: 'default' | 'primary' | 'destructive';
  disabled?: boolean;
  onClick: () => void;
}

interface MobileActionSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  actions: ActionSheetAction[];
  cancelLabel?: string;
  className?: string;
}

export default function MobileActionSheet({
  isOpen,
  onClose,
  title,
  description,
  actions,
  cancelLabel = 'Отмена',
  className
}: MobileActionSheetProps) {
  const { trigger } = useHapticFeedback();

  if (!isOpen) return null;

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleActionClick = (action: ActionSheetAction) => {
    if (!action.disabled) {
      trigger('light');
      action.onClick();
      onClose();
    }
  };

  const handleCancel = () => {
    trigger('light');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      {/* Overlay */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-mobile-fade-in"
        onClick={handleOverlayClick}
      />
      
      {/* Action Sheet */}
      <div className="absolute bottom-0 left-0 right-0 p-4 pb-safe-area animate-mobile-slide-up">
        {/* Actions Card */}
        <div className={cn("bg-white rounded-3xl overflow-hidden shadow-2xl mb-3", className)}>
          {/* Header */}
          {(title || description) && (
            <div className="px-6 py-4 text-center border-b border-gray-100">
              {title && (
                <h3 className="text-lg font-bold text-gray-900 mb-1">{title}</h3>
              )}
              {description && (
                <p className="text-sm text-gray-600">{description}</p>
              )}
            </div>
          )}
          
          {/* Actions */}
          <div className="divide-y divide-gray-100">
            {actions.map((action, index) => {
              const variantClasses = {
                default: 'text-gray-900',
                primary: 'text-blue-600 font-semibold',
                destructive: 'text-red-600 font-semibold'
              };

              return (
                <button
                  key={index}
                  onClick={() => handleActionClick(action)}
                  disabled={action.disabled}
                  className={cn(
                    "w-full flex items-center justify-center px-6 py-4 text-base transition-colors",
                    "disabled:opacity-50 disabled:cursor-not-allowed",
                    "active:bg-gray-50",
                    variantClasses[action.variant || 'default']
                  )}
                >
                  {action.icon && (
                    <span className="mr-3">{action.icon}</span>
                  )}
                  {action.label}
                </button>
              );
            })}
          </div>
        </div>
        
        {/* Cancel Button */}
        <button
          onClick={handleCancel}
          className="w-full bg-white rounded-3xl px-6 py-4 text-base font-semibold text-gray-900 shadow-lg active:bg-gray-50 transition-colors"
        >
          {cancelLabel}
        </button>
      </div>
    </div>
  );
}
