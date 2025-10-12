import { supabase } from './supabase';

// Тип результату завантаження
export interface MediaUploadResult {
  url: string;
  filename: string;
  fileSize: number;
  type: 'image' | 'video' | 'audio';
}

export class MediaService {
  /**
   * Завантаження файлу у Supabase Storage
   */
  static async uploadFile(
    file: File,
    bucket: string = 'media',
    folder: string = 'uploads'
  ): Promise<MediaUploadResult> {
    if (!this.isSupportedFileType(file)) {
      throw new Error(
        'Непідтримуваний тип файлу. Підтримуються: JPG, PNG, GIF, WebP, MP4, WebM, OGG, MOV, MP3, WAV'
      );
    }

    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const extension = file.name.split('.').pop()?.toLowerCase() || 'bin';
    const filename = `${folder}/${timestamp}_${randomString}.${extension}`;

    console.log(`📤 Завантаження файлу в bucket "${bucket}" → ${filename}`);

    const { data, error } = await supabase.storage.from(bucket).upload(filename, file, {
      cacheControl: '3600',
      upsert: false,
    });

    if (error) {
      console.error('❌ Помилка завантаження у Storage:', error);
      throw new Error(error.message);
    }

    if (!data?.path) {
      throw new Error('Не вдалося отримати шлях до завантаженого файлу');
    }

    const { data: urlData, error: urlError } = supabase.storage
      .from(bucket)
      .getPublicUrl(data.path);

    if (urlError) {
      console.error('❌ Помилка отримання публічного URL:', urlError);
      throw new Error(urlError.message);
    }

    if (!urlData?.publicUrl) {
      throw new Error('Не вдалося отримати публічний URL файлу');
    }

    let type: 'image' | 'video' | 'audio' = 'video';
    if (file.type.startsWith('image/')) type = 'image';
    if (file.type.startsWith('audio/')) type = 'audio';

    console.log('✅ Завантаження завершено:', urlData.publicUrl);

    return {
      url: urlData.publicUrl,
      filename: data.path,
      fileSize: file.size,
      type,
    };
  }

  /**
   * Завантажити медіа для посту (відео, фото, аудіо)
   */
  static async uploadPostMedia(file: File): Promise<MediaUploadResult> {
    // ✅ Тепер завантажує у bucket 'media', папку 'posts'
    const result = await this.uploadFile(file, 'media', 'posts');

    // Отримати поточного користувача
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Користувач не аутентифікований');

    // Отримати профіль користувача
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('auth_user_id', user.id)
      .maybeSingle();

    if (profileError) throw new Error('Помилка отримання профілю користувача');
    if (!profile?.id) throw new Error('Профіль користувача не знайдено');

    // Додати запис у таблицю media
    await addMediaToDatabase({
      user_id: profile.id,
      type:
        result.type === 'image'
          ? 'photo'
          : result.type === 'video'
          ? 'video'
          : 'audio',
      url: result.url,
      original_name: file.name,
      size: file.size,
      is_public: true,
    });

    return result;
  }

  /** Перевірити підтримувані типи */
  static isSupportedFileType(file: File): boolean {
    const supportedImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    const supportedVideoTypes = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime'];
    const supportedAudioTypes = ['audio/mpeg', 'audio/ogg', 'audio/wav', 'audio/webm', 'audio/mp4'];
    return [...supportedImageTypes, ...supportedVideoTypes, ...supportedAudioTypes].includes(file.type);
  }

  /** Форматування розміру файлу */
  static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

// ===========================
// БАЗОВІ ОПЕРАЦІЇ З МЕДІА
// ===========================

export async function addMediaToDatabase(mediaData: {
  user_id: string;
  type: 'photo' | 'video' | 'audio';
  url: string;
  original_name?: string;
  size?: number;
  description?: string;
  thumbnail_url?: string;
  album_id?: string;
  is_public?: boolean;
}) {
  const { data, error } = await supabase.from('media').insert([mediaData]).select().maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

export async function getUserMedia(user_id: string, type?: 'photo' | 'video' | 'audio') {
  let query = supabase.from('media').select('*').eq('user_id', user_id);
  if (type) query = query.eq('type', type);
  const { data, error } = await query.order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return data;
}
