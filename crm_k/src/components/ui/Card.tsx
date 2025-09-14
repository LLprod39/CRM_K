import { cn } from '@/lib/utils';
import { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  variant?: 'default' | 'elevated' | 'flat' | 'bordered';
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export default function Card({ 
  children, 
  className, 
  hover = false, 
  variant = 'default',
  padding = 'md' 
}: CardProps) {
  const variants = {
    default: 'bg-white rounded-xl shadow-sm border border-gray-100',
    elevated: 'bg-white rounded-xl shadow-lg',
    flat: 'bg-gray-50 rounded-xl',
    bordered: 'bg-white rounded-xl border-2 border-gray-200'
  };

  const paddings = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8'
  };

  return (
    <div
      className={cn(
        variants[variant],
        paddings[padding],
        'transition-all duration-200',
        hover && 'hover:shadow-lg hover:scale-[1.02] cursor-pointer',
        className
      )}
    >
      {children}
    </div>
  );
}

interface CardHeaderProps {
  children: ReactNode;
  className?: string;
  icon?: ReactNode;
  action?: ReactNode;
}

export function CardHeader({ children, className, icon, action }: CardHeaderProps) {
  return (
    <div className={cn(
      'pb-4 mb-4 border-b border-gray-100',
      className
    )}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {icon && (
            <div className="p-2.5 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl">
              {icon}
            </div>
          )}
          <div>{children}</div>
        </div>
        {action && (
          <div className="flex items-center gap-2">
            {action}
          </div>
        )}
      </div>
    </div>
  );
}

interface CardTitleProps {
  children: ReactNode;
  className?: string;
  subtitle?: string;
}

export function CardTitle({ children, className, subtitle }: CardTitleProps) {
  return (
    <div className={className}>
      <h3 className="text-lg font-semibold text-gray-900">{children}</h3>
      {subtitle && (
        <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>
      )}
    </div>
  );
}

interface CardContentProps {
  children: ReactNode;
  className?: string;
}

export function CardContent({ children, className }: CardContentProps) {
  return (
    <div className={cn('text-gray-600', className)}>
      {children}
    </div>
  );
}
