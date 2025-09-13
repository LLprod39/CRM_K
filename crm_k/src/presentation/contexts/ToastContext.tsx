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
      {/* Рендеринг тостов */}
      <div className="fixed top-4 right-4 z-50 space-y-2 pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start space-x-3 p-4 rounded-lg border shadow-lg max-w-md transition-all duration-300 animate-slide-in-right ${
              toast.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' :
              toast.type === 'error' ? 'bg-red-50 border-red-200 text-red-800' :
              toast.type === 'warning' ? 'bg-yellow-50 border-yellow-200 text-yellow-800' :
              'bg-blue-50 border-blue-200 text-blue-800'
            }`}
          >
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium">
                {toast.message}
              </div>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="flex-shrink-0 rounded-lg p-1 hover:bg-black/10 transition-colors"
              aria-label="Закрыть уведомление"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ))}
      </div>
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
