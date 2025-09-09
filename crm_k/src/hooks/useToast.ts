'use client';

import { useState, useCallback } from 'react';
import { ToastProps } from '@/components/ui/Toast';

export function useToast() {
  const [toasts, setToasts] = useState<ToastProps[]>([]);

  const addToast = useCallback((toast: Omit<ToastProps, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newToast: ToastProps = {
      ...toast,
      id,
    };
    
    setToasts(prev => [...prev, newToast]);
    return id;
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const success = useCallback((title: string, description?: string, options?: Partial<ToastProps>) => {
    return addToast({
      type: 'success',
      title,
      description,
      ...options,
    });
  }, [addToast]);

  const error = useCallback((title: string, description?: string, options?: Partial<ToastProps>) => {
    return addToast({
      type: 'error',
      title,
      description,
      ...options,
    });
  }, [addToast]);

  const warning = useCallback((title: string, description?: string, options?: Partial<ToastProps>) => {
    return addToast({
      type: 'warning',
      title,
      description,
      ...options,
    });
  }, [addToast]);

  const info = useCallback((title: string, description?: string, options?: Partial<ToastProps>) => {
    return addToast({
      type: 'info',
      title,
      description,
      ...options,
    });
  }, [addToast]);

  const clear = useCallback(() => {
    setToasts([]);
  }, []);

  return {
    toasts,
    addToast,
    removeToast,
    success,
    error,
    warning,
    info,
    clear,
  };
}
