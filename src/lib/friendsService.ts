import { supabase } from './supabase';

export interface Friend {
  id: string;
  username: string;
  full_name?: string;
  name?: string;
  last_name?: string;
  avatar_url?: string;
  avatar?: string;
  city?: string;
  status?: string;
  mutual_friends_count?: number;
}

export interface FriendRequest {
  id: string;
  user_id: string;
  friend_id: string;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
  sender?: Friend;
  receiver?: Friend;
}

export class FriendsService {
  /**
   * Завантажує список друзів користувача
   */
  static async loadUserFriends(userId: string, limit?: number): Promise<Friend[]> {
    try {
      let query = supabase
        .from('friendships')
        .select(`
          friend:user_profiles!friendships_friend_id_fkey(
            id,
            username,
            full_name,
            name,
            last_name,
            avatar_url,
            avatar,
            city
          )
        `)
        .eq('user_id', userId)
        .eq('status', 'accepted');

      if (limit) {
        query = query.limit(limit);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error loading friends:', error);
        return [];
      }

      return data?.map(item => item.friend as Friend).filter(Boolean) || [];
    } catch (error) {
      console.error('Error loading friends:', error);
      return [];
    }
  }

  /**
   * Завантажує запити на дружбу
   */
  static async loadFriendRequests(userId: string): Promise<FriendRequest[]> {
    try {
      const { data, error } = await supabase
        .from('friendships')
        .select(`
          id,
          user_id,
          friend_id,
          status,
          created_at,
          sender:user_profiles!friendships_user_id_fkey(
            id,
            username,
            full_name,
            name,
            last_name,
            avatar_url,
            avatar
          )
        `)
        .eq('friend_id', userId)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading friend requests:', error);
        return [];
      }

      return data?.map(item => ({ ...item, sender: (item.sender as Friend[])[0] })) || [];
    } catch (error) {
      console.error('Error loading friend requests:', error);
      return [];
    }
  }

  /**
   * Відправляє запит на дружбу
   */
  static async sendFriendRequest(userId: string, friendId: string): Promise<boolean> {
    try {
      // Перевіряємо чи не існує вже запит
      const { data: existing } = await supabase
        .from('friendships')
        .select('id')
        .or(`and(user_id.eq.${userId},friend_id.eq.${friendId}),and(user_id.eq.${friendId},friend_id.eq.${userId})`)
        .single();

      if (existing) {
        console.log('Friendship already exists');
        return false;
      }

      const { error } = await supabase
        .from('friendships')
        .insert({
          user_id: userId,
          friend_id: friendId,
          status: 'pending'
        });

      if (error) {
        console.error('Error sending friend request:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error sending friend request:', error);
      return false;
    }
  }

  /**
   * Приймає запит на дружбу
   */
  static async acceptFriendRequest(requestId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('friendships')
        .update({ status: 'accepted' })
        .eq('id', requestId);

      if (error) {
        console.error('Error accepting friend request:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error accepting friend request:', error);
      return false;
    }
  }

  /**
   * Відхиляє запит на дружбу
   */
  static async rejectFriendRequest(requestId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('friendships')
        .update({ status: 'rejected' })
        .eq('id', requestId);

      if (error) {
        console.error('Error rejecting friend request:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error rejecting friend request:', error);
      return false;
    }
  }

  /**
   * Видаляє з друзів
   */
  static async removeFriend(userId: string, friendId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('friendships')
        .delete()
        .or(`and(user_id.eq.${userId},friend_id.eq.${friendId}),and(user_id.eq.${friendId},friend_id.eq.${userId})`);

      if (error) {
        console.error('Error removing friend:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error removing friend:', error);
      return false;
    }
  }

  /**
   * Перевіряє статус дружби між користувачами
   */
  static async getFriendshipStatus(userId: string, friendId: string): Promise<'none' | 'pending' | 'accepted' | 'sent'> {
    try {
      const { data, error } = await supabase
        .from('friendships')
        .select('user_id, friend_id, status')
        .or(`and(user_id.eq.${userId},friend_id.eq.${friendId}),and(user_id.eq.${friendId},friend_id.eq.${userId})`)
        .single();

      if (error || !data) {
        return 'none';
      }

      if (data.status === 'accepted') {
        return 'accepted';
      }

      if (data.user_id === userId) {
        return 'sent';
      }

      return 'pending';
    } catch (error) {
      console.error('Error checking friendship status:', error);
      return 'none';
    }
  }

  /**
   * Завантажує пропозиції друзів
   */
  static async loadSuggestedFriends(userId: string, limit: number = 5): Promise<Friend[]> {
    try {
      // Отримуємо поточних друзів для виключення
      const { data: currentFriends } = await supabase
        .from('friendships')
        .select('friend_id')
        .eq('user_id', userId)
        .eq('status', 'accepted');

      const friendIds = currentFriends?.map(f => f.friend_id) || [];

      // Отримуємо пропозиції на основі взаємних друзів та схожих інтересів
      let query = supabase
        .from('profiles')
        .select(`
          id,
          username,
          full_name,
          name,
          last_name,
          avatar_url,
          avatar,
          city,
          interests
        `)
        .neq('id', userId);

      if (friendIds.length > 0) {
        query = query.not('id', 'in', `(${friendIds.join(',')})`);
      }

      const { data, error } = await query.limit(limit);

      if (error) {
        console.error('Error loading suggested friends:', error);
        return [];
      }

      // Обчислюємо кількість взаємних друзів для кожної пропозиції
      const suggestionsWithMutuals = await Promise.all(
        (data || []).map(async (suggestion) => {
          const { data: mutualFriends } = await supabase
            .from('friendships')
            .select('friend_id')
            .eq('user_id', suggestion.id)
            .eq('status', 'accepted')
            .in('friend_id', friendIds);

          return {
            ...suggestion,
            mutual_friends_count: mutualFriends?.length || 0
          };
        })
      );

      return suggestionsWithMutuals;
    } catch (error) {
      return [];
    }
  }
}