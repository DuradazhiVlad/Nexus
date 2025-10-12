import { useState, useCallback } from 'react';
import { supabase } from '../supabase';
import { useAuth } from './useAuth'; // Припустимо, що у вас є хук useAuth

export const useAvatarUpload = () => {
  const { user } = useAuth();
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>(undefined);
  const [uploadError, setUploadError] = useState<string | undefined>(undefined);

  const uploadAvatar = useCallback(async (file: File) => {
    if (!user) {
      setUploadError('Користувач не авторизований.');
      return null;
    }

    setAvatarUploading(true);
    setUploadError(undefined);

    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}-${Math.random()}.${fileExt}`;
    const filePath = `avatars/${fileName}`;

    try {
      const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

      if (uploadError) {
        if (uploadError.message.includes('Bucket not found')) {
          setUploadError('Помилка: сховище для аватарів не знайдено.');
        } else if (uploadError.message.includes('The resource already exists')) {
          setUploadError('Помилка: файл з таким ім\'ям вже існує.');
        }
        throw new Error(`Помилка завантаження: ${uploadError.message}`);
      }

      const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
      setAvatarUrl(data.publicUrl);
      return data.publicUrl;
    } catch (error: any) {
      console.error('Error uploading avatar:', error.message);
      setUploadError(error.message);
      return null;
    } finally {
      setAvatarUploading(false);
    }
  }, [user]);

  const deleteAvatar = useCallback(async (url: string) => {
    if (!user) {
      setUploadError('Користувач не авторизований.');
      return;
    }

    setAvatarUploading(true);
    setUploadError(undefined);

    try {
      const fileName = url.split('/').pop();
      if (!fileName) throw new Error('Недійсний URL аватара.');

      const filePath = `avatars/${fileName}`;
      const { error } = await supabase.storage.from('avatars').remove([filePath]);

      if (error) throw error;

      setAvatarUrl(undefined);
    } catch (error: any) {
      console.error('Error deleting avatar:', error.message);
      setUploadError(error.message);
    } finally {
      setAvatarUploading(false);
    }
  }, [user]);

  return {
    avatarUploading,
    avatarUrl,
    uploadError,
    uploadAvatar,
    deleteAvatar,
    setAvatarUrl, // Дозволити зовнішнє встановлення URL аватара, якщо він вже є
  };
};