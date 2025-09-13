'use client';

import { cn } from '@/shared/utils';
import { ReactNode } from 'react';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';

interface MobileButtonProps {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost' | 'gradient-primary' | 'gradient-secondary';
  size?: 'sm' | 'md' | 'lg';
  icon?: ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  disabled?: boolean;
  loading?: boolean;
  className?: string;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
}

export default function MobileButton({
  children,
  variant = 'primary',
  size = 'md',
  icon,
  iconPosition = 'left',
  fullWidth = false,
  disabled = false,
  loading = false,
  className,
  onClick,
  type = 'button'
}: MobileButtonProps) {
  const { trigger } = useHapticFeedback();

  const baseClasses = cn(
    "inline-flex items-center justify-center font-semibold rounded-2xl",
    "transition-all duration-300 active:scale-95 focus:outline-none",
    "disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none",
    fullWidth && "w-full"
  );

  const variantClasses = {
    primary: "bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800 shadow-lg hover:shadow-xl",
    secondary: "bg-gray-100 text-gray-700 hover:bg-gray-200 active:bg-gray-300 border border-gray-200",
    ghost: "text-gray-700 hover:bg-gray-100 active:bg-gray-200",
    'gradient-primary': "mobile-btn-gradient mobile-btn-primary",
    'gradient-secondary': "mobile-btn-gradient mobile-btn-secondary"
  };

  const sizeClasses = {
    sm: "px-4 py-2 text-sm min-h-10",
    md: "px-6 py-3 text-base min-h-12",
    lg: "px-8 py-4 text-lg min-h-14"
  };

  const handleClick = () => {
    if (!disabled && !loading) {
      trigger('light');
      onClick?.();
    }
  };

  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={handleClick}
      className={cn(
        baseClasses,
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
    >
      {loading && (
        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
      )}
      
      {!loading && icon && iconPosition === 'left' && (
        <span className="mr-2">{icon}</span>
      )}
      
      {children}
      
      {!loading && icon && iconPosition === 'right' && (
        <span className="ml-2">{icon}</span>
      )}
    </button>
  );
}