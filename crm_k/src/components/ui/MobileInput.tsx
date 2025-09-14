'use client';

import { cn } from '@/shared/utils';
import { forwardRef, ReactNode } from 'react';

interface MobileInputProps {
  label?: string;
  placeholder?: string;
  value?: string;
  type?: 'text' | 'email' | 'password' | 'tel' | 'number' | 'search';
  variant?: 'default' | 'modern';
  size?: 'sm' | 'md' | 'lg';
  icon?: ReactNode;
  iconPosition?: 'left' | 'right';
  error?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onFocus?: (e: React.FocusEvent<HTMLInputElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
}

const MobileInput = forwardRef<HTMLInputElement, MobileInputProps>(({
  label,
  placeholder,
  value,
  type = 'text',
  variant = 'default',
  size = 'md',
  icon,
  iconPosition = 'left',
  error,
  required = false,
  disabled = false,
  className,
  onChange,
  onFocus,
  onBlur,
  ...props
}, ref) => {
  const baseClasses = cn(
    "w-full transition-all duration-300 focus:outline-none",
    "disabled:opacity-50 disabled:cursor-not-allowed"
  );

  const variantClasses = {
    default: "mobile-app-input",
    modern: "mobile-input-modern"
  };

  const sizeClasses = {
    sm: "text-sm px-4 py-3 min-h-12",
    md: "text-base px-5 py-4 min-h-14",
    lg: "text-lg px-6 py-5 min-h-16"
  };

  const inputClasses = cn(
    baseClasses,
    variantClasses[variant],
    size !== 'md' && sizeClasses[size],
    error && "border-red-500 focus:border-red-500 focus:ring-red-200",
    icon && iconPosition === 'left' && "pl-12",
    icon && iconPosition === 'right' && "pr-12",
    className
  );

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <div className="relative">
        {icon && (
          <div className={cn(
            "absolute top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none",
            iconPosition === 'left' ? "left-4" : "right-4"
          )}>
            {icon}
          </div>
        )}
        
        <input
          ref={ref}
          type={type}
          value={value}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          className={inputClasses}
          onChange={onChange}
          onFocus={onFocus}
          onBlur={onBlur}
          {...props}
        />
      </div>
      
      {error && (
        <p className="text-red-500 text-xs mt-2 font-medium animate-mobile-slide-up">
          {error}
        </p>
      )}
    </div>
  );
});

MobileInput.displayName = 'MobileInput';

export default MobileInput;
