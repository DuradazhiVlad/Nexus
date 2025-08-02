import { supabase } from './supabase';

export interface MediaUploadResult {
  url: string;
  filename: string;
  fileSize: number;
  type: 'image' | 'video';
}

export class MediaService {
  /**
   * Завантажити файл на Supabase Storage
   */
  static async uploadFile(
    file: File, 
    bucket: string = 'media',
    folder: string = 'uploads'
  ): Promise<MediaUploadResult> {
    try {
      console.log('🔍 Uploading file:', {
        name: file.name,
        size: file.size,
        type: file.type
      });

      // Перевіряємо тип файлу
      if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
        throw new Error('Підтримуються тільки зображення та відео файли');
      }

      // Генеруємо унікальне ім'я файлу
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(2, 15);
      const extension = file.name.split('.').pop();
      const filename = `${folder}/${timestamp}_${randomString}.${extension}`;

      // Завантажуємо файл
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(filename, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error('❌ Upload error:', error);
        throw new Error(`Помилка завантаження: ${error.message}`);
      }

      // Отримуємо публічний URL
      const { data: urlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(filename);

      console.log('✅ File uploaded successfully:', {
        filename: data.path,
        url: urlData.publicUrl,
        size: file.size
      });

      return {
        url: urlData.publicUrl,
        filename: data.path,
        fileSize: file.size,
        type: file.type.startsWith('image/') ? 'image' : 'video'
      };
    } catch (error) {
      console.error('❌ Media upload error:', error);
      throw error;
    }
  }

  /**
   * Завантажити зображення профілю
   */
  static async uploadProfileImage(file: File): Promise<string> {
    try {
      console.log('🔍 Uploading profile image:', file.name);

      if (!file.type.startsWith('image/')) {
        throw new Error('Підтримуються тільки зображення');
      }

      // Перевіряємо розмір файлу (максимум 5MB)
      if (file.size > 5 * 1024 * 1024) {
        throw new Error('Розмір файлу не може перевищувати 5MB');
      }

      const result = await this.uploadFile(file, 'avatars', 'profile');
      return result.url;
    } catch (error) {
      console.error('❌ Profile image upload error:', error);
      throw error;
    }
  }

  /**
   * Завантажити обкладинку профілю
   */
  static async uploadCoverImage(file: File): Promise<string> {
    try {
      console.log('🔍 Uploading cover image:', file.name);

      if (!file.type.startsWith('image/')) {
        throw new Error('Підтримуються тільки зображення');
      }

      // Перевіряємо розмір файлу (максимум 10MB)
      if (file.size > 10 * 1024 * 1024) {
        throw new Error('Розмір файлу не може перевищувати 10MB');
      }

      const result = await this.uploadFile(file, 'covers', 'profile');
      return result.url;
    } catch (error) {
      console.error('❌ Cover image upload error:', error);
      throw error;
    }
  }

  /**
   * Завантажити медіа для посту
   */
  static async uploadPostMedia(file: File): Promise<MediaUploadResult> {
    try {
      console.log('🔍 Uploading post media:', file.name);

      // Перевіряємо розмір файлу (максимум 50MB для відео, 10MB для зображень)
      const maxSize = file.type.startsWith('video/') ? 50 * 1024 * 1024 : 10 * 1024 * 1024;
      if (file.size > maxSize) {
        const maxSizeMB = maxSize / (1024 * 1024);
        throw new Error(`Розмір файлу не може перевищувати ${maxSizeMB}MB`);
      }

      return await this.uploadFile(file, 'posts', 'media');
    } catch (error) {
      console.error('❌ Post media upload error:', error);
      throw error;
    }
  }

  /**
   * Видалити файл з Storage
   */
  static async deleteFile(filename: string, bucket: string = 'media'): Promise<void> {
    try {
      console.log('🔍 Deleting file:', filename);

      const { error } = await supabase.storage
        .from(bucket)
        .remove([filename]);

      if (error) {
        console.error('❌ Delete error:', error);
        throw new Error(`Помилка видалення: ${error.message}`);
      }

      console.log('✅ File deleted successfully:', filename);
    } catch (error) {
      console.error('❌ File deletion error:', error);
      throw error;
    }
  }

  /**
   * Перевірити підтримувані типи файлів
   */
  static isSupportedFileType(file: File): boolean {
    const supportedImageTypes = [
      'image/jpeg',
      'image/jpg', 
      'image/png',
      'image/gif',
      'image/webp'
    ];
    
    const supportedVideoTypes = [
      'video/mp4',
      'video/webm',
      'video/ogg',
      'video/quicktime'
    ];

    return [...supportedImageTypes, ...supportedVideoTypes].includes(file.type);
  }

  /**
   * Отримати розмір файлу в читабельному форматі
   */
  static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

export async function getUserMedia(user_id: string, type?: 'photo' | 'video') {
  let query = supabase.from('media').select('*').eq('user_id', user_id);
  if (type) query = query.eq('type', type);
  const { data, error } = await query.order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

// Видалення медіа (з БД і з Supabase Storage)
export async function deleteMedia(mediaId: string, filePath: string) {
  // Видалити з Storage
  const { error: storageError } = await supabase.storage.from('media').remove([filePath]);
  if (storageError) throw storageError;
  // Видалити з БД
  const { error: dbError } = await supabase.from('media').delete().eq('id', mediaId);
  if (dbError) throw dbError;
  return true;
}

// Оновлення опису медіа
export async function updateMediaDescription(mediaId: string, description: string) {
  const { error } = await supabase.from('media').update({ description }).eq('id', mediaId);
  if (error) throw error;
  return true;
} 