'use client';

import { useState } from 'react';
import { AlertTriangle, X, CheckCircle, Info } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  type?: 'warning' | 'danger' | 'info';
  confirmText?: string;
  cancelText?: string;
  loading?: boolean;
}

export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  type = 'warning',
  confirmText = 'Подтвердить',
  cancelText = 'Отмена',
  loading = false
}: ConfirmDialogProps) {
  if (!isOpen) return null;

  const getIcon = () => {
    switch (type) {
      case 'danger':
        return <AlertTriangle className="w-6 h-6 text-red-500" />;
      case 'info':
        return <Info className="w-6 h-6 text-blue-500" />;
      default:
        return <AlertTriangle className="w-6 h-6 text-yellow-500" />;
    }
  };

  const getStyles = () => {
    switch (type) {
      case 'danger':
        return {
          container: 'border-red-200 bg-red-50',
          button: 'bg-red-600 hover:bg-red-700 text-white',
          icon: 'text-red-500'
        };
      case 'info':
        return {
          container: 'border-blue-200 bg-blue-50',
          button: 'bg-blue-600 hover:bg-blue-700 text-white',
          icon: 'text-blue-500'
        };
      default:
        return {
          container: 'border-yellow-200 bg-yellow-50',
          button: 'bg-yellow-600 hover:bg-yellow-700 text-white',
          icon: 'text-yellow-500'
        };
    }
  };

  const styles = getStyles();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4">
      <div className="bg-white rounded-lg shadow-xl border border-gray-200 w-full max-w-md">
        <div className={`p-6 border-b ${styles.container}`}>
          <div className="flex items-center space-x-3">
            {getIcon()}
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          </div>
        </div>
        
        <div className="p-6">
          <p className="text-gray-700 mb-6">{message}</p>
          
          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors duration-200 font-medium disabled:opacity-50"
            >
              {cancelText}
            </button>
            <button
              onClick={onConfirm}
              disabled={loading}
              className={`flex-1 px-4 py-2 rounded-lg transition-colors duration-200 font-medium disabled:opacity-50 flex items-center justify-center space-x-2 ${styles.button}`}
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Обработка...</span>
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  <span>{confirmText}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Hook для управления диалогами подтверждения
export function useConfirmDialog() {
  const [dialog, setDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: 'warning' | 'danger' | 'info';
    confirmText: string;
    cancelText: string;
    onConfirm: () => void;
    loading: boolean;
  }>({
    isOpen: false,
    title: '',
    message: '',
    type: 'warning',
    confirmText: 'Подтвердить',
    cancelText: 'Отмена',
    onConfirm: () => {},
    loading: false
  });

  const showConfirm = (options: {
    title: string;
    message: string;
    type?: 'warning' | 'danger' | 'info';
    confirmText?: string;
    cancelText?: string;
    onConfirm: () => void;
  }) => {
    setDialog({
      isOpen: true,
      title: options.title,
      message: options.message,
      type: options.type || 'warning',
      confirmText: options.confirmText || 'Подтвердить',
      cancelText: options.cancelText || 'Отмена',
      onConfirm: () => {
        options.onConfirm();
        setDialog(prev => ({ ...prev, isOpen: false }));
      },
      loading: false
    });
  };

  const closeDialog = () => {
    setDialog(prev => ({ ...prev, isOpen: false }));
  };

  const setLoading = (loading: boolean) => {
    setDialog(prev => ({ ...prev, loading }));
  };

  const ConfirmDialogComponent = () => (
    <ConfirmDialog
      isOpen={dialog.isOpen}
      onClose={closeDialog}
      onConfirm={dialog.onConfirm}
      title={dialog.title}
      message={dialog.message}
      type={dialog.type}
      confirmText={dialog.confirmText}
      cancelText={dialog.cancelText}
      loading={dialog.loading}
    />
  );

  return {
    showConfirm,
    closeDialog,
    setLoading,
    ConfirmDialogComponent
  };
}
