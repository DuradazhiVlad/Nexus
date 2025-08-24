import { supabase } from '../../../lib/supabase';

export interface Reel {
  id: string;
  user_id: string;
  title: string;
  description: string;
  video_url: string;
  thumbnail_url?: string;
  duration: number;
  views: number;
  likes_count: number;
  comments_count: number;
  shares_count: number;
  hashtags: string[];
  location?: string;
  category: 'trending' | 'music' | 'comedy' | 'dance' | 'food' | 'travel' | 'sports' | 'education' | 'pets' | 'art' | 'other';
  created_at: string;
  updated_at: string;
  user_profiles: {
    id: string;
    name: string;
    last_name: string;
    avatar?: string;
  };
  isLiked?: boolean;
  isBookmarked?: boolean;
}

export interface ReelComment {
  id: string;
  reel_id: string;
  user_id: string;
  content: string;
  created_at: string;
  user_profiles: {
    id: string;
    name: string;
    last_name: string;
    avatar?: string;
  };
}

export class ReelsService {
  static async getAllReels(category?: string, limit = 20, offset = 0): Promise<Reel[]> {
    try {
      let query = supabase
        .from('reels')
        .select(`
          *,
          user_profiles (
            id,
            name,
            last_name,
            avatar
          )
        `)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (category && category !== 'all') {
        query = query.eq('category', category);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching reels:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error in getAllReels:', error);
      throw error;
    }
  }

  static async getReelById(reelId: string): Promise<Reel | null> {
    try {
      const { data, error } = await supabase
        .from('reels')
        .select(`
          *,
          user_profiles (
            id,
            name,
            last_name,
            avatar
          )
        `)
        .eq('id', reelId)
        .single();

      if (error) {
        console.error('Error fetching reel:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error in getReelById:', error);
      throw error;
    }
  }

  static async createReel(reelData: {
    title: string;
    description: string;
    video_url: string;
    thumbnail_url?: string;
    duration: number;
    hashtags: string[];
    location?: string;
    category: string;
  }): Promise<Reel> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data: profile } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('auth_user_id', user.id)
        .single();

      if (!profile) throw new Error('User profile not found');

      const { data, error } = await supabase
        .from('reels')
        .insert({
          ...reelData,
          user_id: profile.id,
          views: 0,
          likes_count: 0,
          comments_count: 0,
          shares_count: 0
        })
        .select(`
          *,
          user_profiles (
            id,
            name,
            last_name,
            avatar
          )
        `)
        .single();

      if (error) {
        console.error('Error creating reel:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error in createReel:', error);
      throw error;
    }
  }

  static async likeReel(reelId: string): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data: profile } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('auth_user_id', user.id)
        .single();

      if (!profile) throw new Error('User profile not found');

      // Check if already liked
      const { data: existingLike } = await supabase
        .from('reel_likes')
        .select('id')
        .eq('reel_id', reelId)
        .eq('user_id', profile.id)
        .single();

      if (existingLike) {
        // Unlike
        await supabase
          .from('reel_likes')
          .delete()
          .eq('reel_id', reelId)
          .eq('user_id', profile.id);

        // Decrement likes count
        await supabase.rpc('decrement_reel_likes', { reel_id: reelId });
      } else {
        // Like
        await supabase
          .from('reel_likes')
          .insert({ reel_id: reelId, user_id: profile.id });

        // Increment likes count
        await supabase.rpc('increment_reel_likes', { reel_id: reelId });
      }
    } catch (error) {
      console.error('Error in likeReel:', error);
      throw error;
    }
  }

  static async incrementViews(reelId: string): Promise<void> {
    try {
      await supabase.rpc('increment_reel_views', { reel_id: reelId });
    } catch (error) {
      console.error('Error incrementing views:', error);
    }
  }

  static async getReelComments(reelId: string): Promise<ReelComment[]> {
    try {
      const { data, error } = await supabase
        .from('reel_comments')
        .select(`
          *,
          user_profiles (
            id,
            name,
            last_name,
            avatar
          )
        `)
        .eq('reel_id', reelId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching comments:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error in getReelComments:', error);
      throw error;
    }
  }

  static async addComment(reelId: string, content: string): Promise<ReelComment> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data: profile } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('auth_user_id', user.id)
        .single();

      if (!profile) throw new Error('User profile not found');

      const { data, error } = await supabase
        .from('reel_comments')
        .insert({
          reel_id: reelId,
          user_id: profile.id,
          content
        })
        .select(`
          *,
          user_profiles (
            id,
            name,
            last_name,
            avatar
          )
        `)
        .single();

      if (error) {
        console.error('Error adding comment:', error);
        throw error;
      }

      // Increment comments count
      await supabase.rpc('increment_reel_comments', { reel_id: reelId });

      return data;
    } catch (error) {
      console.error('Error in addComment:', error);
      throw error;
    }
  }

  static async uploadVideo(file: File): Promise<string> {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `reels/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('videos')
        .upload(filePath, file);

      if (uploadError) {
        console.error('Error uploading video:', uploadError);
        throw uploadError;
      }

      const { data } = supabase.storage
        .from('videos')
        .getPublicUrl(filePath);

      return data.publicUrl;
    } catch (error) {
      console.error('Error in uploadVideo:', error);
      throw error;
    }
  }

  static async generateThumbnail(videoFile: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      video.addEventListener('loadedmetadata', () => {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        video.currentTime = 1; // Capture frame at 1 second
      });

      video.addEventListener('seeked', () => {
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          canvas.toBlob((blob) => {
            if (blob) {
              const reader = new FileReader();
              reader.onload = () => resolve(reader.result as string);
              reader.readAsDataURL(blob);
            } else {
              reject(new Error('Failed to generate thumbnail'));
            }
          }, 'image/jpeg', 0.8);
        }
      });

      video.addEventListener('error', reject);
      video.src = URL.createObjectURL(videoFile);
    });
  }
}