import { supabase } from './supabase';
import { MediaService, MediaUploadResult, getUserMedia, deleteMedia, addMediaToDatabase } from './mediaService';

export interface UserMedia {
  id: string;
  url: string;
  type: 'photo' | 'video';
  created_at: string;
  thumbnail_url?: string;
  original_name?: string;
  description?: string;
}

export class UserMediaService {
  private mediaService: MediaService;

  constructor() {
    this.mediaService = new MediaService();
  }

  async loadUserPhotos(userId: string, limit: number = 6): Promise<UserMedia[]> {
    try {
      const data = await getUserMedia(userId, 'photo');
      return data.slice(0, limit) as UserMedia[];
    } catch (error) {
      console.error('Error loading user photos:', error);
      throw error;
    }
  }

  async loadUserVideos(userId: string, limit: number = 6): Promise<UserMedia[]> {
    try {
      const data = await getUserMedia(userId, 'video');
      return data.slice(0, limit) as UserMedia[];
    } catch (error) {
      console.error('Error loading user videos:', error);
      throw error;
    }
  }

  async uploadPhoto(userId: string, photoFile: File): Promise<UserMedia> {
    try {
      const result = await MediaService.uploadFile(photoFile, 'user-photos', userId);
      const mediaData = {
        user_id: userId,
        type: 'photo',
        url: result.url,
        original_name: result.filename,
        size: result.fileSize,
        is_public: true,
      };
      const newMedia = await addMediaToDatabase(mediaData);
      return newMedia as UserMedia;
    } catch (error) {
      console.error('Error uploading photo:', error);
      throw error;
    }
  }

  async deletePhoto(mediaId: string, filePath: string): Promise<void> {
    try {
      await deleteMedia(mediaId, filePath, 'user-photos');
    } catch (error) {
      console.error('Error deleting photo:', error);
      throw error;
    }
  }

  async deleteVideo(mediaId: string, filePath: string): Promise<void> {
    try {
      await deleteMedia(mediaId, filePath, 'user-videos'); // Assuming a separate bucket for videos if needed
    } catch (error) {
      console.error('Error deleting video:', error);
      throw error;
    }
  }
}