import { cn } from '@/lib/utils';
import { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  glass?: boolean;
}

export default function Card({ children, className, hover = true, glass = true }: CardProps) {
  return (
    <div
      className={cn(
        'bg-white/95 rounded-xl shadow-lg border border-gray-200/50',
        'transition-all duration-300',
        glass && 'backdrop-blur-sm',
        hover && 'card-hover hover:shadow-xl',
        className
      )}
    >
      {children}
    </div>
  );
}
