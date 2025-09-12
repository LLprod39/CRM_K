'use client';

import { ReactNode } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string | ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  children: ReactNode;
  footer?: ReactNode;
  showCloseButton?: boolean;
  className?: string;
}

export default function Modal({
  isOpen,
  onClose,
  title,
  size = 'lg',
  children,
  footer,
  showCloseButton = true,
  className = ''
}: ModalProps) {
  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-2xl',
    lg: 'max-w-4xl',
    xl: 'max-w-6xl',
    full: 'max-w-[95vw]'
  };

  return (
    <div 
      className="fixed inset-0 z-50 overflow-y-auto"
      onClick={onClose}
    >
      {/* Backdrop с единым стилем */}
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
      
      {/* Modal container */}
      <div className="flex min-h-screen items-center justify-center p-4">
        <div 
          className={`relative w-full ${sizeClasses[size]} transform transition-all ${className}`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Modal content с единым стилем */}
          <div className="bg-white rounded-2xl shadow-2xl overflow-hidden animate-scale-in">
            {/* Header */}
            {(title || showCloseButton) && (
              <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-gray-50/50">
                <div className="flex items-center justify-between">
                  {title && (
                    <h2 className="text-xl font-semibold text-gray-900">
                      {title}
                    </h2>
                  )}
                  {showCloseButton && (
                    <button
                      onClick={onClose}
                      className="ml-auto p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all duration-200"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </div>
            )}
            
            {/* Body */}
            <div className="overflow-y-auto max-h-[calc(100vh-200px)]">
              {children}
            </div>
            
            {/* Footer */}
            {footer && (
              <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50">
                {footer}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Компонент для секций внутри модального окна
export function ModalSection({
  icon,
  title,
  children,
  className = ''
}: {
  icon?: ReactNode;
  title?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`bg-white p-6 ${className}`}>
      {(icon || title) && (
        <div className="flex items-center gap-3 mb-4">
          {icon && (
            <div className="p-2.5 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl">
              {icon}
            </div>
          )}
          {title && (
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          )}
        </div>
      )}
      {children}
    </div>
  );
}

// Компонент для информационных карточек внутри модального окна
export function InfoCard({
  label,
  value,
  icon,
  className = ''
}: {
  label: string;
  value: string | ReactNode;
  icon?: ReactNode;
  className?: string;
}) {
  return (
    <div className={`bg-gray-50 rounded-xl p-4 border border-gray-100 ${className}`}>
      <div className="flex items-start gap-3">
        {icon && (
          <div className="text-gray-400 mt-0.5">
            {icon}
          </div>
        )}
        <div className="flex-1">
          <div className="text-sm text-gray-600 mb-0.5">{label}</div>
          <div className="text-base font-medium text-gray-900">{value}</div>
        </div>
      </div>
    </div>
  );
}

// Стандартные кнопки для footer
export function ModalFooter({
  onCancel,
  onConfirm,
  cancelText = 'Отмена',
  confirmText = 'Сохранить',
  loading = false,
  variant = 'primary'
}: {
  onCancel: () => void;
  onConfirm?: () => void;
  cancelText?: string;
  confirmText?: string;
  loading?: boolean;
  variant?: 'primary' | 'danger' | 'success';
}) {
  const variantClasses = {
    primary: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500',
    danger: 'bg-red-600 hover:bg-red-700 focus:ring-red-500',
    success: 'bg-green-600 hover:bg-green-700 focus:ring-green-500'
  };

  return (
    <div className="flex gap-3">
      <button
        type="button"
        onClick={onCancel}
        className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 rounded-xl font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
      >
        {cancelText}
      </button>
      {onConfirm && (
        <button
          type="button"
          onClick={onConfirm}
          disabled={loading}
          className={`flex-1 px-4 py-2.5 text-white rounded-xl font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${variantClasses[variant]}`}
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Сохранение...
            </span>
          ) : (
            confirmText
          )}
        </button>
      )}
    </div>
  );
}
