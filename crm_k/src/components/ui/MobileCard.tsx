'use client';

import { cn } from '@/shared/utils';
import { ReactNode } from 'react';

interface MobileCardProps {
  children: ReactNode;
  className?: string;
  variant?: 'default' | 'modern' | 'stat' | 'gradient';
  interactive?: boolean;
  onClick?: () => void;
}

export default function MobileCard({ 
  children, 
  className, 
  variant = 'default',
  interactive = false,
  onClick
}: MobileCardProps) {
  const baseClasses = "relative overflow-hidden transition-all duration-300";
  
  const variantClasses = {
    default: "mobile-app-card",
    modern: "mobile-card-modern",
    stat: "mobile-stat-modern",
    gradient: "mobile-card-modern bg-gradient-to-br from-blue-50/80 via-purple-50/80 to-pink-50/80 border-blue-200/50"
  };

  const interactiveClasses = interactive ? "mobile-interactive-modern cursor-pointer" : "";

  return (
    <div 
      className={cn(
        baseClasses,
        variantClasses[variant],
        interactiveClasses,
        className
      )}
      onClick={onClick}
    >
      {children}
    </div>
  );
}