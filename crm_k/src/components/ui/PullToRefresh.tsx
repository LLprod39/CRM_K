'use client';

import { ReactNode, useRef, useState, useEffect } from 'react';
import { RefreshCw } from 'lucide-react';

interface PullToRefreshProps {
  children: ReactNode;
  onRefresh: () => Promise<void>;
  threshold?: number;
  className?: string;
}

export default function PullToRefresh({
  children,
  onRefresh,
  threshold = 80,
  className = '',
}: PullToRefreshProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [startY, setStartY] = useState(0);
  const [isPulling, setIsPulling] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleTouchStart = (e: TouchEvent) => {
    const container = containerRef.current;
    if (!container || container.scrollTop > 0) return;
    
    setStartY(e.touches[0].clientY);
    setIsPulling(true);
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (!isPulling || isRefreshing) return;

    const container = containerRef.current;
    if (!container || container.scrollTop > 0) {
      setIsPulling(false);
      setPullDistance(0);
      return;
    }

    const currentY = e.touches[0].clientY;
    const distance = Math.max(0, currentY - startY);
    
    if (distance > 0) {
      e.preventDefault();
      setPullDistance(Math.min(distance, threshold * 1.5));
    }
  };

  const handleTouchEnd = async () => {
    if (!isPulling) return;

    setIsPulling(false);

    if (pullDistance >= threshold && !isRefreshing) {
      setIsRefreshing(true);
      try {
        await onRefresh();
      } catch (error) {
        console.error('Ошибка при обновлении:', error);
      } finally {
        setIsRefreshing(false);
      }
    }

    setPullDistance(0);
  };

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('touchstart', handleTouchStart, { passive: false });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd);

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isPulling, pullDistance, startY, isRefreshing]);

  const pullProgress = Math.min(pullDistance / threshold, 1);
  const shouldShowRefresh = pullDistance > threshold * 0.5;

  return (
    <div
      ref={containerRef}
      className={`relative overflow-auto ${className}`}
      style={{
        transform: `translateY(${isRefreshing ? threshold / 2 : pullDistance}px)`,
        transition: isPulling ? 'none' : 'transform 0.3s ease-out',
      }}
    >
      {/* Индикатор обновления */}
      {(shouldShowRefresh || isRefreshing) && (
        <div
          className="absolute top-0 left-0 right-0 flex items-center justify-center"
          style={{
            height: `${threshold}px`,
            transform: `translateY(-${threshold}px)`,
          }}
        >
          <div className="flex items-center space-x-3 bg-white/95 backdrop-blur-xl px-4 py-2 rounded-full shadow-lg border border-white/20">
            <RefreshCw
              className={`w-5 h-5 text-blue-600 ${
                isRefreshing ? 'animate-spin' : ''
              }`}
              style={{
                transform: isPulling && !isRefreshing ? `rotate(${pullProgress * 360}deg)` : '',
              }}
            />
            <span className="text-sm font-medium text-gray-700">
              {isRefreshing ? 'Обновление...' : 'Потяните для обновления'}
            </span>
          </div>
        </div>
      )}

      {children}
    </div>
  );
}
