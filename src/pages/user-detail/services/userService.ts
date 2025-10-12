import { supabase } from '../../../lib/supabase';
import { UserDetail, UserPost, FriendRequest, Friendship } from '../types';

export class UserService {
  /**
   * Отримати детальну інформацію про користувача
   */
  static async getUserDetail(userId: string): Promise<UserDetail | null> {
    try {
      // Try by profile id first
      let { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) throw error;

      // If not found, try by auth_user_id
      if (!data) {
        const res = await supabase
          .from('user_profiles')
          .select('*')
          .eq('auth_user_id', userId)
          .maybeSingle();
        if (res.error) throw res.error;
        data = res.data as any;
      }

      if (!data) return null;
      return data as any;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Отримати пости користувача
   */
  static async getUserPosts(userId: string): Promise<UserPost[]> {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      return data || [];
    } catch (error) {
      return [];
    }
  }

  /**
   * Отримати друзів користувача
   */
  static async getUserFriends(userId: string): Promise<UserDetail[]> {
    try {
      // Отримуємо дружби де користувач є user1
      const { data: friendships1, error: error1 } = await supabase
        .from('friendships')
        .select('user2_id')
        .eq('user1_id', userId);

      // Отримуємо дружби де користувач є user2
      const { data: friendships2, error: error2 } = await supabase
        .from('friendships')
        .select('user1_id')
        .eq('user2_id', userId);

      if (error1 || error2) {
        throw error1 || error2;
      }

      // Збираємо всіх друзів
      const friendIds = [
        ...(friendships1 || []).map(f => f.user2_id),
        ...(friendships2 || []).map(f => f.user1_id)
      ];

      if (friendIds.length === 0) {
        return [];
      }

      // Отримуємо інформацію про друзів
      const { data: friends, error: friendsError } = await supabase
        .from('user_profiles')
        .select('*')
        .in('auth_user_id', friendIds);

      if (friendsError) {
        throw friendsError;
      }

      return friends || [];
    } catch (error) {
      return [];
    }
  }

  /**
   * Перевірити статус дружби
   */
  static async getFriendshipStatus(userId: string, friendId: string): Promise<'friends' | 'pending' | 'none'> {
    try {
      // Перевіряємо чи є дружба
      const { data: friendship, error: friendshipError } = await supabase
        .from('friendships')
        .select('*')
        .or(`and(user1_id.eq.${userId},user2_id.eq.${friendId}),and(user1_id.eq.${friendId},user2_id.eq.${userId})`)
        .single();

      if (friendshipError && friendshipError.code !== 'PGRST116') {
        console.error('❌ UserService: Error checking friendship:', friendshipError);
        throw friendshipError;
      }

      if (friendship) {
        console.log('✅ UserService: Users are friends');
        return 'friends';
      }

      // Перевіряємо чи є запит на дружбу
      const { data: request, error: requestError } = await supabase
        .from('friend_requests')
        .select('*')
        .or(`and(user_id.eq.${userId},friend_id.eq.${friendId}),and(user_id.eq.${friendId},friend_id.eq.${userId})`)
        .eq('status', 'pending')
        .single();

      if (requestError && requestError.code !== 'PGRST116') {
        console.error('❌ UserService: Error checking friend request:', requestError);
        throw requestError;
      }

      if (request) {
        return 'pending';
      }

      return 'none';
    } catch (error) {
      return 'none';
    }
  }

  /**
   * Відправити запит на дружбу
   */
  // Використовуємо DatabaseService для надсилання запитів на дружбу
  static async sendFriendRequest(friendId: string): Promise<boolean> {
    const { DatabaseService } = await import('../../../lib/database');
    return DatabaseService.sendFriendRequest(friendId);
  }

  /**
   * Прийняти запит на дружбу
   */
  static async acceptFriendRequest(requestId: string): Promise<boolean> {
    try {
      console.log('🔍 UserService: Accepting friend request:', requestId);
      
      // Отримуємо запит
      const { data: request, error: getError } = await supabase
        .from('friend_requests')
        .select('*')
        .eq('id', requestId)
        .maybeSingle();

      if (getError) {
        console.error('❌ UserService: Error getting friend request:', getError);
        throw getError;
      }

      if (!request) {
        console.error('❌ UserService: Friend request not found:', requestId);
        throw new Error('Запит на дружбу не знайдено');
      }

      // Оновлюємо статус запиту
      const { error: updateError } = await supabase
        .from('friend_requests')
        .update({ status: 'accepted' })
        .eq('id', requestId);

      if (updateError) {
        console.error('❌ UserService: Error updating friend request:', updateError);
        throw updateError;
      }

      // Створюємо дружбу
      const { error: friendshipError } = await supabase
        .from('friendships')
        .insert([{
          user1_id: request.user_id,
          user2_id: request.friend_id
        }]);

      if (friendshipError) {
        console.error('❌ UserService: Error creating friendship:', friendshipError);
        throw friendshipError;
      }

      console.log('✅ UserService: Friend request accepted successfully');
      return true;
    } catch (error) {
      console.error('❌ UserService: Unexpected error:', error);
      throw error;
    }
  }

  /**
   * Відхилити запит на дружбу
   */
  static async rejectFriendRequest(requestId: string): Promise<boolean> {
    try {
      console.log('🔍 UserService: Rejecting friend request:', requestId);
      
      const { error } = await supabase
        .from('friend_requests')
        .update({ status: 'rejected' })
        .eq('id', requestId);

      if (error) {
        console.error('❌ UserService: Error rejecting friend request:', error);
        throw error;
      }

      console.log('✅ UserService: Friend request rejected successfully');
      return true;
    } catch (error) {
      console.error('❌ UserService: Unexpected error:', error);
      throw error;
    }
  }

  /**
   * Видалити друга
   */
  static async removeFriend(friendId: string): Promise<boolean> {
    try {
      console.log('🔍 UserService: Removing friend:', friendId);
      
      const currentUser = (await supabase.auth.getUser()).data.user?.id;
      
      // Видаляємо дружбу
      const { error } = await supabase
        .from('friendships')
        .delete()
        .or(`and(user1_id.eq.${currentUser},user2_id.eq.${friendId}),and(user1_id.eq.${friendId},user2_id.eq.${currentUser})`);

      if (error) {
        console.error('❌ UserService: Error removing friend:', error);
        throw error;
      }

      console.log('✅ UserService: Friend removed successfully');
      return true;
    } catch (error) {
      console.error('❌ UserService: Unexpected error:', error);
      throw error;
    }
  }
}