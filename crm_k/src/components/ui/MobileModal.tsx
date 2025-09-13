'use client';

import { cn } from '@/shared/utils';
import { ReactNode, useEffect } from 'react';
import { X } from 'lucide-react';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';

interface MobileModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'fullscreen';
  variant?: 'default' | 'bottom-sheet';
  showCloseButton?: boolean;
  closeOnOverlayClick?: boolean;
  className?: string;
}

export default function MobileModal({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  variant = 'default',
  showCloseButton = true,
  closeOnOverlayClick = true,
  className
}: MobileModalProps) {
  const { trigger } = useHapticFeedback();

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      trigger('medium');
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen, trigger]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    fullscreen: 'w-full h-full'
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && closeOnOverlayClick) {
      onClose();
    }
  };

  const handleClose = () => {
    trigger('light');
    onClose();
  };

  if (variant === 'bottom-sheet') {
    return (
      <div className="fixed inset-0 z-50 lg:hidden">
        {/* Overlay */}
        <div 
          className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-mobile-fade-in"
          onClick={handleOverlayClick}
        />
        
        {/* Bottom Sheet */}
        <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl max-h-[90vh] overflow-hidden animate-mobile-slide-up">
          {/* Handle */}
          <div className="flex justify-center py-3">
            <div className="w-10 h-1 bg-gray-300 rounded-full"></div>
          </div>
          
          {/* Header */}
          {(title || showCloseButton) && (
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              {title && (
                <h2 className="text-lg font-bold text-gray-900">{title}</h2>
              )}
              {showCloseButton && (
                <button
                  onClick={handleClose}
                  className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
                >
                  <X className="w-4 h-4 text-gray-600" />
                </button>
              )}
            </div>
          )}
          
          {/* Content */}
          <div className={cn("overflow-y-auto mobile-scroll-smooth pb-safe-area", className)}>
            {children}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      {/* Overlay */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-mobile-fade-in"
        onClick={handleOverlayClick}
      />
      
      {/* Modal */}
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className={cn(
          "bg-white rounded-3xl shadow-2xl w-full overflow-hidden animate-mobile-pop-in",
          sizeClasses[size],
          size !== 'fullscreen' && "mx-4 my-8",
          className
        )}>
          {/* Header */}
          {(title || showCloseButton) && (
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              {title && (
                <h2 className="text-lg font-bold text-gray-900 flex-1">{title}</h2>
              )}
              {showCloseButton && (
                <button
                  onClick={handleClose}
                  className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors ml-4"
                >
                  <X className="w-4 h-4 text-gray-600" />
                </button>
              )}
            </div>
          )}
          
          {/* Content */}
          <div className="overflow-y-auto mobile-scroll-smooth max-h-[70vh]">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
