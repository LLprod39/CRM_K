'use client'

import React, { createContext, useContext, useState, useCallback } from 'react'

export interface Toast {
  id: string
  message: string
  type: 'success' | 'error' | 'warning' | 'info'
  duration?: number
}

interface ToastContextType {
  toasts: Toast[]
  addToast: (toast: Omit<Toast, 'id'>) => void
  removeToast: (id: string) => void
  clearToasts: () => void
  success: (title: string, description?: string) => void
  error: (title: string, description?: string) => void
  warning: (title: string, description?: string) => void
  info: (title: string, description?: string) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9)
    const newToast: Toast = {
      ...toast,
      id,
      duration: toast.duration || 5000,
    }

    setToasts(prev => [...prev, newToast])

    // Автоматически удаляем toast через указанное время
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, newToast.duration)
  }, [])

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }, [])

  const clearToasts = useCallback(() => {
    setToasts([])
  }, [])

  // Удобные методы для разных типов уведомлений
  const success = useCallback((title: string, description?: string) => {
    addToast({
      message: description ? `${title}: ${description}` : title,
      type: 'success'
    })
  }, [addToast])

  const error = useCallback((title: string, description?: string) => {
    addToast({
      message: description ? `${title}: ${description}` : title,
      type: 'error'
    })
  }, [addToast])

  const warning = useCallback((title: string, description?: string) => {
    addToast({
      message: description ? `${title}: ${description}` : title,
      type: 'warning'
    })
  }, [addToast])

  const info = useCallback((title: string, description?: string) => {
    addToast({
      message: description ? `${title}: ${description}` : title,
      type: 'info'
    })
  }, [addToast])

  return (
    <ToastContext.Provider value={{ 
      toasts, 
      addToast, 
      removeToast, 
      clearToasts, 
      success, 
      error, 
      warning, 
      info 
    }}>
      {children}
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (context === undefined) {
    throw new Error('useToast должен использоваться внутри ToastProvider')
  }
  return context
}

// Экспорт для обратной совместимости
export const useToastContext = useToast
