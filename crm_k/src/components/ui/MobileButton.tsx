'use client';

import { cn } from '@/shared/utils';
import { ReactNode } from 'react';

interface MobileButtonProps {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  disabled?: boolean;
  loading?: boolean;
  onClick?: () => void;
  className?: string;
  type?: 'button' | 'submit' | 'reset';
}

export default function MobileButton({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  disabled = false,
  loading = false,
  onClick,
  className,
  type = 'button',
}: MobileButtonProps) {
  const baseClasses = 'mobile-app-button touch-manipulation relative overflow-hidden';
  
  const variantClasses = {
    primary: 'mobile-app-button-primary shadow-lg hover:shadow-xl',
    secondary: 'mobile-app-button-secondary',
    outline: 'border-2 border-blue-500 bg-transparent text-blue-600 hover:bg-blue-50 hover:shadow-md',
    ghost: 'bg-transparent text-gray-600 hover:bg-gray-100 hover:shadow-sm',
  };

  const sizeClasses = {
    sm: 'h-10 px-4 text-sm',
    md: 'h-12 px-6 text-base',
    lg: 'h-14 px-8 text-lg',
  };

  const buttonClasses = cn(
    baseClasses,
    variantClasses[variant],
    sizeClasses[size],
    fullWidth && 'w-full',
    disabled && 'opacity-50 cursor-not-allowed',
    loading && 'cursor-not-allowed',
    className
  );

  return (
    <button
      type={type}
      className={buttonClasses}
      onClick={onClick}
      disabled={disabled || loading}
    >
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
      <span className={cn(loading && 'opacity-0')}>
        {children}
      </span>
    </button>
  );
}
