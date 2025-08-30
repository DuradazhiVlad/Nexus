import React, { useState, useRef, useCallback } from 'react';
import { Upload, X, Image as ImageIcon, Video, File, AlertCircle, CheckCircle } from 'lucide-react';
import { MediaService, MediaUploadResult } from '../lib/mediaService';

interface MediaUploadProps {
  onUpload: (result: MediaUploadResult) => void;
  onCancel?: () => void;
  accept?: 'image' | 'video' | 'both';
  maxSize?: number; // в MB
  className?: string;
  placeholder?: string;
}

export const MediaUpload: React.FC<MediaUploadProps> = ({
  onUpload,
  onCancel,
  accept = 'both',
  maxSize = 500,
  className = '',
  placeholder = 'Перетягніть файл сюди або клікніть для вибору'
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<MediaUploadResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback(async (file: File) => {
    try {
      setError(null);
      setUploading(true);

      // Перевіряємо тип файлу
      if (!MediaService.isSupportedFileType(file)) {
        throw new Error('Непідтримуваний тип файлу. Підтримуються: JPG, PNG, GIF, WebP, MP4, WebM, OGG');
      }

      // Перевіряємо розмір файлу
      const maxSizeBytes = maxSize * 1024 * 1024;
      if (file.size > maxSizeBytes) {
        throw new Error(`Розмір файлу не може перевищувати ${maxSize}MB`);
      }

      // Перевіряємо тип файлу відповідно до accept
      if (accept === 'image' && !file.type.startsWith('image/')) {
        throw new Error('Підтримуються тільки зображення');
      }
      if (accept === 'video' && !file.type.startsWith('video/')) {
        throw new Error('Підтримуються тільки відео файли');
      }

      console.log('🔍 Processing file:', {
        name: file.name,
        size: file.size,
        type: file.type
      });

      // Завантажуємо файл
      const result = await MediaService.uploadPostMedia(file);
      
      console.log('✅ File uploaded successfully:', result);
      setUploadedFile(result);
      onUpload(result);
      
    } catch (err: any) {
      console.error('❌ Upload error:', err instanceof Error ? err.message : String(err));
      setError(err.message || 'Помилка завантаження файлу');
    } finally {
      setUploading(false);
    }
  }, [accept, maxSize, onUpload]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, [handleFileSelect]);

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, [handleFileSelect]);

  const handleClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleCancel = useCallback(() => {
    setUploadedFile(null);
    setError(null);
    onCancel?.();
  }, [onCancel]);

  const getAcceptTypes = () => {
    switch (accept) {
      case 'image':
        return 'image/*';
      case 'video':
        return 'video/*';
      default:
        return 'image/*,video/*';
    }
  };

  const getIcon = () => {
    if (uploadedFile) {
      return uploadedFile.type === 'image' ? <ImageIcon size={24} /> : <Video size={24} />;
    }
    return accept === 'image' ? <ImageIcon size={24} /> : 
           accept === 'video' ? <Video size={24} /> : <File size={24} />;
  };

  const getStatusColor = () => {
    if (error) return 'text-red-500';
    if (uploadedFile) return 'text-green-500';
    if (uploading) return 'text-blue-500';
    return 'text-gray-400';
  };

  return (
    <div className={`${className}`}>
      {/* Прихований input для вибору файлу */}
      <input
        ref={fileInputRef}
        type="file"
        accept={getAcceptTypes()}
        onChange={handleFileInputChange}
        className="hidden"
      />

      {/* Завантажений файл */}
      {uploadedFile && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <div>
                <p className="text-sm font-medium text-green-800">
                  Файл завантажено успішно
                </p>
                <p className="text-xs text-green-600">
                  {uploadedFile.filename.split('/').pop()} • {MediaService.formatFileSize(uploadedFile.fileSize)}
                </p>
              </div>
            </div>
            <button
              onClick={handleCancel}
              className="p-1 text-green-600 hover:text-green-800 transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Помилка */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center space-x-3">
            <AlertCircle className="w-5 h-5 text-red-500" />
            <div>
              <p className="text-sm font-medium text-red-800">Помилка завантаження</p>
              <p className="text-xs text-red-600">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Область завантаження */}
      {!uploadedFile && (
        <div
          className={`
            relative border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all
            ${isDragOver 
              ? 'border-blue-500 bg-blue-50' 
              : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
            }
            ${uploading ? 'opacity-50 cursor-not-allowed' : ''}
          `}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={uploading ? undefined : handleClick}
        >
          <div className={`${getStatusColor()} mb-3`}>
            {uploading ? (
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            ) : (
              getIcon()
            )}
          </div>
          
          <p className="text-sm font-medium text-gray-900 mb-1">
            {uploading ? 'Завантаження...' : placeholder}
          </p>
          
          <p className="text-xs text-gray-500">
            {accept === 'image' && 'Підтримуються: JPG, PNG, GIF, WebP'}
            {accept === 'video' && 'Підтримуються: MP4, WebM, OGG'}
            {accept === 'both' && 'Підтримуються: зображення та відео'}
            {` • Максимум ${maxSize}MB`}
          </p>
        </div>
      )}
    </div>
  );
};