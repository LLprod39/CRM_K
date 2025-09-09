'use client';

import { useState, useEffect } from 'react';
import { AlertCircle, X } from 'lucide-react';

interface ErrorHandlerProps {
  error: string | null;
  onDismiss: () => void;
}

export default function ErrorHandler({ error, onDismiss }: ErrorHandlerProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (error) {
      setIsVisible(true);
      // Автоматически скрыть ошибку через 5 секунд
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(onDismiss, 300); // Дождаться завершения анимации
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [error, onDismiss]);

  if (!error || !isVisible) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50 animate-slide-in-right">
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 shadow-lg max-w-md">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <AlertCircle className="w-5 h-5 text-red-600" />
          </div>
          <div className="ml-3 flex-1">
            <h3 className="text-sm font-medium text-red-800">
              Ошибка
            </h3>
            <p className="mt-1 text-sm text-red-700">
              {error}
            </p>
          </div>
          <div className="ml-4 flex-shrink-0">
            <button
              onClick={() => {
                setIsVisible(false);
                setTimeout(onDismiss, 300);
              }}
              className="inline-flex text-red-400 hover:text-red-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Хук для обработки ошибок
export function useErrorHandler() {
  const [error, setError] = useState<string | null>(null);

  const handleError = (error: unknown) => {
    let errorMessage = 'Произошла неизвестная ошибка';
    
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === 'string') {
      errorMessage = error;
    } else if (error && typeof error === 'object' && 'message' in error) {
      errorMessage = String(error.message);
    }

    setError(errorMessage);
  };

  const clearError = () => {
    setError(null);
  };

  return {
    error,
    handleError,
    clearError
  };
}

// Утилита для обработки ошибок API
export async function handleApiError(response: Response): Promise<never> {
  let errorMessage = 'Произошла ошибка при выполнении запроса';
  
  try {
    const errorData = await response.json();
    if (errorData.error) {
      errorMessage = errorData.error;
    }
  } catch {
    // Если не удалось распарсить JSON, используем стандартное сообщение
    switch (response.status) {
      case 400:
        errorMessage = 'Неверные данные запроса';
        break;
      case 401:
        errorMessage = 'Необходима авторизация';
        break;
      case 403:
        errorMessage = 'Доступ запрещен';
        break;
      case 404:
        errorMessage = 'Ресурс не найден';
        break;
      case 500:
        errorMessage = 'Внутренняя ошибка сервера';
        break;
      default:
        errorMessage = `Ошибка ${response.status}: ${response.statusText}`;
    }
  }
  
  throw new Error(errorMessage);
}
