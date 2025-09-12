'use client';

import { useState } from 'react';
import { AlertTriangle, X, CheckCircle, Info } from 'lucide-react';
import Modal, { ModalFooter } from './Modal';

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

  const modalTitle = (
    <div className="flex items-center gap-3">
      {getIcon()}
      <span className="text-lg font-semibold text-gray-900">{title}</span>
    </div>
  );

  const getVariant = (): 'primary' | 'danger' | 'success' => {
    switch (type) {
      case 'danger':
        return 'danger';
      case 'info':
        return 'primary';
      default:
        return 'primary';
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={modalTitle}
      size="sm"
      footer={
        <ModalFooter
          onCancel={onClose}
          onConfirm={onConfirm}
          cancelText={cancelText}
          confirmText={confirmText}
          loading={loading}
          variant={getVariant()}
        />
      }
    >
      <div className="p-6">
        <p className="text-gray-700">{message}</p>
      </div>
    </Modal>
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
