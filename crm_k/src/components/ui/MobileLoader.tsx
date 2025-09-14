'use client';

import { cn } from '@/shared/utils';

interface MobileLoaderProps {
  variant?: 'spinner' | 'dots' | 'pulse' | 'skeleton';
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  fullScreen?: boolean;
  className?: string;
}

export default function MobileLoader({
  variant = 'spinner',
  size = 'md',
  text,
  fullScreen = false,
  className
}: MobileLoaderProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };

  const containerClasses = cn(
    "flex flex-col items-center justify-center",
    fullScreen && "fixed inset-0 bg-white/80 backdrop-blur-sm z-50",
    className
  );

  const renderLoader = () => {
    switch (variant) {
      case 'spinner':
        return (
          <div
            className={cn(
              "border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin",
              sizeClasses[size]
            )}
          />
        );
      
      case 'dots':
        return (
          <div className="flex space-x-1">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className={cn(
                  "bg-blue-600 rounded-full animate-bounce",
                  size === 'sm' && 'w-2 h-2',
                  size === 'md' && 'w-3 h-3',
                  size === 'lg' && 'w-4 h-4'
                )}
                style={{ animationDelay: `${i * 0.1}s` }}
              />
            ))}
          </div>
        );
      
      case 'pulse':
        return (
          <div
            className={cn(
              "bg-blue-600 rounded-full animate-pulse",
              sizeClasses[size]
            )}
          />
        );
      
      case 'skeleton':
        return (
          <div className="space-y-3 w-full max-w-sm">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="h-4 bg-gray-200 rounded-lg animate-pulse"
                style={{ width: `${100 - i * 20}%` }}
              />
            ))}
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className={containerClasses}>
      {renderLoader()}
      {text && (
        <p className="text-gray-600 text-sm font-medium mt-3 animate-pulse">
          {text}
        </p>
      )}
    </div>
  );
}
