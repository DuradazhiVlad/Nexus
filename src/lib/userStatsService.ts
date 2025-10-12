import { supabase } from './supabase';

export interface UserStats {
  friendsCount: number;
  photosCount: number;
  videosCount: number;
  postsCount: number;
}

export interface UserFriend {
  id: string;
  name: string;
  last_name?: string;
  avatar?: string;
  auth_user_id: string;
}

export interface UserPhoto {
  id: string;
  url: string;
  created_at: string;
}

export class UserStatsService {
  /**
   * Отримати статистику користувача
   */
  static async getUserStats(userId: string): Promise<UserStats> {
    try {
      // Отримуємо кількість друзів
      const friendsCount = await this.getFriendsCount(userId);
      
      // Отримуємо кількість фото
      const photosCount = await this.getPhotosCount(userId);
      
      // Отримуємо кількість відео
      const videosCount = await this.getVideosCount(userId);
      
      // Отримуємо кількість постів
      const postsCount = await this.getPostsCount(userId);
      
      const stats = {
        friendsCount,
        photosCount,
        videosCount,
        postsCount
      };
      
      return stats;
    } catch (error) {
      return {
        friendsCount: 0,
        photosCount: 0,
        videosCount: 0,
        postsCount: 0
      };
    }
  }
  
  /**
   * Отримати кількість друзів
   */
  static async getFriendsCount(userId: string): Promise<number> {
    try {
      // Отримуємо дружби де користувач є user1
      const { count: count1, error: error1 } = await supabase
        .from('friendships')
        .select('*', { count: 'exact', head: true })
        .eq('user1_id', userId);

      // Отримуємо дружби де користувач є user2
      const { count: count2, error: error2 } = await supabase
        .from('friendships')
        .select('*', { count: 'exact', head: true })
        .eq('user2_id', userId);

      if (error1 || error2) {
        return 0;
      }

      return (count1 || 0) + (count2 || 0);
    } catch (error) {
      return 0;
    }
  }
  
  /**
   * Отримати кількість фото
   */
  static async getPhotosCount(userId: string): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('media')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('type', 'photo');

      if (error) {
        return 0;
      }

      return count || 0;
    } catch (error) {
      return 0;
    }
  }
  
  /**
   * Отримати кількість відео
   */
  static async getVideosCount(userId: string): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('media')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('type', 'video');

      if (error) {
        return 0;
      }

      return count || 0;
    } catch (error) {
      return 0;
    }
  }
  
  /**
   * Отримати кількість постів
   */
  static async getPostsCount(userId: string): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('posts')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      if (error) {
        return 0;
      }

      return count || 0;
    } catch (error) {
      return 0;
    }
  }
  
  /**
   * Отримати список друзів користувача
   */
  static async getUserFriends(userId: string, limit: number = 6): Promise<UserFriend[]> {
    try {
      // Отримуємо дружби де користувач є user1
      const { data: friendships1, error: error1 } = await supabase
        .from('friendships')
        .select('user2_id')
        .eq('user1_id', userId)
        .limit(limit);

      // Отримуємо дружби де користувач є user2
      const { data: friendships2, error: error2 } = await supabase
        .from('friendships')
        .select('user1_id')
        .eq('user2_id', userId)
        .limit(limit);

      if (error1 || error2) {
        return [];
      }

      // Збираємо всіх друзів
      const friendIds = [
        ...(friendships1 || []).map(f => f.user2_id),
        ...(friendships2 || []).map(f => f.user1_id)
      ].slice(0, limit);

      if (friendIds.length === 0) {
        return [];
      }

      // Отримуємо інформацію про друзів
      const { data: friends, error: friendsError } = await supabase
        .from('user_profiles')
        .select('id, name, last_name, avatar, auth_user_id')
        .in('id', friendIds);

      if (friendsError) {
        return [];
      }

      return friends || [];
    } catch (error) {
      return [];
    }
  }
  
  /**
   * Отримати фото користувача
   */
  static async getUserPhotos(userId: string, limit: number = 6): Promise<UserPhoto[]> {
    try {
      const { data: photos, error } = await supabase
        .from('media')
        .select('id, url, created_at')
        .eq('user_id', userId)
        .eq('type', 'photo')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        return [];
      }

      return photos || [];
    } catch (error) {
      return [];
    }
  }
}