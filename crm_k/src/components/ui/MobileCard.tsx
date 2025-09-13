'use client';

import { cn } from '@/shared/utils';
import { ReactNode } from 'react';

interface MobileCardProps {
  children: ReactNode;
  variant?: 'default' | 'stat' | 'glass' | 'gradient';
  hover?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  className?: string;
  onClick?: () => void;
  animation?: 'fadeIn' | 'slideUp' | 'popIn' | 'bounceIn';
  animationDelay?: number;
}

export default function MobileCard({
  children,
  variant = 'default',
  hover = false,
  padding = 'md',
  className,
  onClick,
  animation = 'fadeIn',
  animationDelay = 0,
}: MobileCardProps) {
  const baseClasses = 'touch-manipulation';
  
  const variantClasses = {
    default: 'mobile-app-card',
    stat: 'mobile-stat-card',
    glass: 'bg-white/85 backdrop-blur-xl border border-white/30 rounded-2xl shadow-xl',
    gradient: 'bg-gradient-to-br from-white/95 to-blue-50/90 backdrop-blur-xl border border-blue-100/20 rounded-2xl shadow-lg',
  };

  const paddingClasses = {
    none: 'p-0',
    sm: 'p-3',
    md: 'p-5',
    lg: 'p-6',
  };

  const animationClasses = {
    fadeIn: 'animate-mobile-fade-in',
    slideUp: 'animate-mobile-slide-up',
    popIn: 'animate-mobile-pop-in',
    bounceIn: 'animate-mobile-bounce-in',
  };

  const cardClasses = cn(
    baseClasses,
    variantClasses[variant],
    paddingClasses[padding],
    hover && 'mobile-app-card-hover cursor-pointer',
    animationClasses[animation],
    className
  );

  const style = animationDelay > 0 ? { animationDelay: `${animationDelay}ms` } : undefined;

  if (onClick) {
    return (
      <button
        className={cardClasses}
        onClick={onClick}
        style={style}
      >
        {children}
      </button>
    );
  }

  return (
    <div className={cardClasses} style={style}>
      {children}
    </div>
  );
}
