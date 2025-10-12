import React, { useState, useRef, useCallback } from 'react';
import type { ChangeEvent } from 'react';
import { Camera, X, AlertCircle, CheckCircle, Upload } from 'lucide-react';
import { MediaService } from '../lib/mediaService';

interface ProfileImageUploadProps {
  currentAvatarUrl: string;
  onAvatarChange: (file: File) => Promise<void>;
  isEditing: boolean;
}

export const ProfileImageUpload: React.FC<ProfileImageUploadProps> = ({
  currentAvatarUrl,
  onAvatarChange,
  isEditing,
}) => {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback(async (file: File) => {
    try {
      setError(null);
      setUploading(true);

      if (!file.type.startsWith('image/')) {
        throw new Error('Підтримуються тільки зображення (JPG, PNG, GIF, WebP)');
      }

      if (file.size > 5 * 1024 * 1024) {
        throw new Error('Розмір файлу не може перевищувати 5MB');
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewUrl(e.target?.result as string);
      };
      reader.readAsDataURL(file);

      console.log('🔍 Uploading profile image:', {
        name: file.name,
        size: file.size,
        type: file.type
      });

      await onAvatarChange(file);
      
    } catch (err: any) {
      console.error('❌ Profile image upload error:', err instanceof Error ? err.message : String(err));
      setError(err.message || 'Помилка завантаження зображення');
    } finally {
      setUploading(false);
    }
  }, [onAvatarChange]);

  const handleFileInputChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, [handleFileSelect]);

  const handleClick = useCallback(() => {
    if (isEditing) {
      fileInputRef.current?.click();
    }
  }, [isEditing]);

  const handleCancelPreview = useCallback(() => {
    setPreviewUrl(null);
    setError(null);
  }, []);

  return (
    <div className="profile-image-upload-container">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileInputChange}
        className="hidden"
      />

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-red-500" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}

      {previewUrl && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <div>
                <p className="text-sm font-medium text-green-800">
                  Зображення завантажено успішно
                </p>
                <p className="text-xs text-green-600">
                  Клікніть "Зберегти" щоб застосувати зміни
                </p>
              </div>
            </div>
            <button
              onClick={handleCancelPreview}
              className="p-1 text-green-600 hover:text-green-800 transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      <div className="relative">
        <div className="w-32 h-32 bg-white rounded-full p-2 shadow-lg mx-auto">
          {previewUrl ? (
            <img
              src={previewUrl}
              alt="Preview"
              className="w-full h-full rounded-full object-cover"
            />
          ) : currentAvatarUrl ? (
            <img
              src={currentAvatarUrl}
              alt="Profile"
              className="w-full h-full rounded-full object-cover"
            />
          ) : (
            <div className="w-full h-full rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold">
              U
            </div>
          )}
        </div>

        {isEditing && (
          <button
            onClick={handleClick}
            disabled={uploading}
            className={`
              absolute bottom-2 right-2 w-8 h-8 rounded-full flex items-center justify-center transition-colors
              ${uploading 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-blue-600 hover:bg-blue-700 cursor-pointer'
              }
              text-white
            `}
            title="Змінити фото профілю"
          >
            {uploading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <Camera size={16} />
            )}
          </button>
        )}
      </div>

      <div className="mt-4 text-center">
        <p className="text-sm text-gray-600 mb-2">
          Клікніть на камеру щоб змінити фото профілю
        </p>
        <p className="text-xs text-gray-500">
          Підтримуються: JPG, PNG, GIF, WebP • Максимум 5MB
        </p>
      </div>
    </div>
  );
};