'use client';

import { useCallback } from 'react';

export type HapticType = 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error';

export function useHapticFeedback() {
  const trigger = useCallback((type: HapticType = 'light') => {
    if (typeof window === 'undefined') return;

    // Проверяем поддержку Haptic Feedback API
    if ('navigator' in window && 'vibrate' in navigator) {
      let pattern: number | number[];

      switch (type) {
        case 'light':
          pattern = 10;
          break;
        case 'medium':
          pattern = 20;
          break;
        case 'heavy':
          pattern = 50;
          break;
        case 'success':
          pattern = [10, 50, 10];
          break;
        case 'warning':
          pattern = [25, 25, 25];
          break;
        case 'error':
          pattern = [50, 100, 50];
          break;
        default:
          pattern = 10;
      }

      try {
        navigator.vibrate(pattern);
      } catch (error) {
        // Игнорируем ошибки вибрации
        console.debug('Haptic feedback not supported');
      }
    }

    // Для iOS устройств
    if ('window' in globalThis && 'DeviceMotionEvent' in window) {
      try {
        // Попытка использовать Web Vibration API для iOS
        const audio = new Audio();
        audio.preload = 'auto';
        
        switch (type) {
          case 'light':
          case 'medium':
          case 'heavy':
            // Создаем очень короткий звук для имитации тактильной обратной связи
            audio.src = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBDuY4PLNeSsFJIHA';
            audio.volume = 0.01;
            audio.play().catch(() => {});
            break;
          case 'success':
            // Двойной тик для успеха
            setTimeout(() => {
              audio.play().catch(() => {});
            }, 50);
            setTimeout(() => {
              audio.play().catch(() => {});
            }, 150);
            break;
          case 'error':
            // Длинная вибрация для ошибки
            audio.volume = 0.02;
            audio.play().catch(() => {});
            break;
        }
      } catch (error) {
        // Игнорируем ошибки
        console.debug('Audio haptic feedback not supported');
      }
    }
  }, []);

  return { trigger };
}
