import React, { useState, useRef } from 'react';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface FileUploadProps {
  onUploadSuccess: (url: string) => void;
  onUploadError: (error: string) => void;
  accept?: string;
  maxSize?: number; // в MB
  className?: string;
  buttonText?: string;
  showPreview?: boolean;
}

export function FileUpload({
  onUploadSuccess,
  onUploadError,
  accept = 'image/*',
  maxSize = 5, // 5MB за замовчуванням
  className = '',
  buttonText = 'Завантажити файл',
  showPreview = true
}: FileUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Перевірка розміру файлу
    if (file.size > maxSize * 1024 * 1024) {
      onUploadError(`Файл занадто великий. Максимальний розмір: ${maxSize}MB`);
      return;
    }

    // Перевірка типу файлу
    if (!file.type.startsWith('image/')) {
      onUploadError('Будь ласка, виберіть зображення');
      return;
    }

    // Показуємо превью
    if (showPreview) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }

    await uploadFile(file);
  };

  const uploadFile = async (file: File) => {
    try {
      setUploading(true);

      // Генеруємо унікальне ім'я файлу
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      // Завантажуємо файл в Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      // Отримуємо публічний URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      onUploadSuccess(publicUrl);
    } catch (error) {
      console.error('Error uploading file:', error);
      onUploadError(error instanceof Error ? error.message : 'Помилка завантаження файлу');
    } finally {
      setUploading(false);
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const removePreview = () => {
    setPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className={className}>
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileSelect}
        className="hidden"
      />
      
      {showPreview && preview ? (
        <div className="relative">
          <img
            src={preview}
            alt="Preview"
            className="w-16 h-16 rounded-full object-cover"
          />
          <button
            onClick={removePreview}
            className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
          >
            <X size={12} />
          </button>
        </div>
      ) : (
        <button
          onClick={handleButtonClick}
          disabled={uploading}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
        >
          {uploading ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
          ) : (
            <Upload size={16} className="mr-2" />
          )}
          {uploading ? 'Завантаження...' : buttonText}
        </button>
      )}
    </div>
  );
} 