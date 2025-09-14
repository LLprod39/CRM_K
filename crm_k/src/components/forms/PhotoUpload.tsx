'use client';

import { useState, useRef } from 'react';
import { Camera, X, Upload, Trash2 } from 'lucide-react';
import { apiRequest } from '@/lib/api';

interface PhotoUploadProps {
  studentId?: number;
  currentPhotoUrl?: string | null;
  onPhotoChange: (photoUrl: string | null) => void;
  disabled?: boolean;
}

export default function PhotoUpload({ 
  studentId, 
  currentPhotoUrl, 
  onPhotoChange, 
  disabled = false 
}: PhotoUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentPhotoUrl || null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Проверяем тип файла
    if (!file.type.startsWith('image/')) {
      setError('Файл должен быть изображением');
      return;
    }

    // Проверяем размер файла (максимум 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Размер файла не должен превышать 5MB');
      return;
    }

    setError(null);
    
    // Создаем предварительный просмотр
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Если есть studentId, загружаем файл на сервер
    if (studentId) {
      uploadPhoto(file);
    } else {
      // Для новых учеников просто сохраняем файл для последующей загрузки
      onPhotoChange(file as any);
    }
  };

  const uploadPhoto = async (file: File) => {
    if (!studentId) return;

    setIsUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('photo', file);
      formData.append('studentId', studentId.toString());

      const token = localStorage.getItem('token');
      const response = await fetch('/api/students/upload-photo', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        setPreviewUrl(data.photoUrl);
        onPhotoChange(data.photoUrl);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Ошибка при загрузке фото');
      }
    } catch (error) {
      console.error('Ошибка при загрузке фото:', error);
      setError('Ошибка при загрузке фото');
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemovePhoto = async () => {
    if (!studentId || !currentPhotoUrl) {
      setPreviewUrl(null);
      onPhotoChange(null);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/students/upload-photo?studentId=${studentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setPreviewUrl(null);
        onPhotoChange(null);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Ошибка при удалении фото');
      }
    } catch (error) {
      console.error('Ошибка при удалении фото:', error);
      setError('Ошибка при удалении фото');
    }
  };

  const handleClick = () => {
    if (!disabled) {
      fileInputRef.current?.click();
    }
  };

  return (
    <div className="space-y-4">
      <label className="block text-sm font-medium text-gray-700">
        Фото ученика
      </label>
      
      <div className="flex items-center space-x-4">
        {/* Предварительный просмотр или аватар */}
        <div className="relative">
          {previewUrl ? (
            <div className="relative group">
              <img
                src={previewUrl}
                alt="Фото ученика"
                className="w-20 h-20 rounded-full object-cover border-2 border-gray-200"
              />
              {!disabled && (
                <button
                  type="button"
                  onClick={handleRemovePhoto}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          ) : (
            <div 
              className={`w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-semibold text-lg cursor-pointer hover:scale-105 transition-transform duration-200 ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
              onClick={handleClick}
            >
              <Camera className="w-8 h-8" />
            </div>
          )}
        </div>

        {/* Кнопки управления */}
        <div className="flex flex-col space-y-2">
          <button
            type="button"
            onClick={handleClick}
            disabled={disabled || isUploading}
            className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isUploading ? (
              <>
                <Upload className="w-4 h-4 mr-2 animate-spin" />
                Загрузка...
              </>
            ) : (
              <>
                <Camera className="w-4 h-4 mr-2" />
                {previewUrl ? 'Изменить фото' : 'Загрузить фото'}
              </>
            )}
          </button>
          
          {previewUrl && (
            <button
              type="button"
              onClick={handleRemovePhoto}
              disabled={disabled || isUploading}
              className="inline-flex items-center px-3 py-2 border border-red-300 rounded-md shadow-sm text-sm font-medium text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Удалить
            </button>
          )}
        </div>
      </div>

      {/* Скрытый input для выбора файла */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
        disabled={disabled}
      />

      {/* Сообщение об ошибке */}
      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-2">
          {error}
        </div>
      )}

      {/* Информация о поддерживаемых форматах */}
      <p className="text-xs text-gray-500">
        Поддерживаемые форматы: JPG, PNG, GIF. Максимальный размер: 5MB
      </p>
    </div>
  );
}
