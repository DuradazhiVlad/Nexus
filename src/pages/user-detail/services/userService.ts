import { supabase } from '../../../lib/supabase';
import { UserDetail, UserPost, FriendRequest, Friendship } from '../types';

export class UserService {
  /**
   * Отримати детальну інформацію про користувача
   */
  static async getUserDetail(userId: string): Promise<UserDetail | null> {
    try {
      console.log('🔍 UserService: Fetching user detail for:', userId);
      
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('auth_user_id', userId)
        .single();

      if (error) {
        console.error('❌ UserService: Error fetching user detail:', error);
        throw error;
      }

      console.log('✅ UserService: User detail fetched:', data);
      return data;
    } catch (error) {
      console.error('❌ UserService: Unexpected error:', error);
      throw error;
    }
  }

  /**
   * Отримати пости користувача
   */
  static async getUserPosts(userId: string): Promise<UserPost[]> {
    try {
      console.log('🔍 UserService: Fetching posts for user:', userId);
      
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ UserService: Error fetching user posts:', error);
        throw error;
      }

      console.log('✅ UserService: User posts fetched:', data);
      return data || [];
    } catch (error) {
      console.error('❌ UserService: Unexpected error:', error);
      return [];
    }
  }

  /**
   * Отримати друзів користувача
   */
  static async getUserFriends(userId: string): Promise<UserDetail[]> {
    try {
      console.log('🔍 UserService: Fetching friends for user:', userId);
      
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
        console.error('❌ UserService: Error fetching friendships:', error1 || error2);
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
        console.error('❌ UserService: Error fetching friends:', friendsError);
        throw friendsError;
      }

      console.log('✅ UserService: Friends fetched:', friends);
      return friends || [];
    } catch (error) {
      console.error('❌ UserService: Unexpected error:', error);
      return [];
    }
  }

  /**
   * Перевірити статус дружби
   */
  static async getFriendshipStatus(userId: string, friendId: string): Promise<'friends' | 'pending' | 'none'> {
    try {
      console.log('🔍 UserService: Checking friendship status between:', userId, 'and', friendId);
      
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
        console.log('✅ UserService: Friend request pending');
        return 'pending';
      }

      console.log('✅ UserService: No friendship or request');
      return 'none';
    } catch (error) {
      console.error('❌ UserService: Unexpected error:', error);
      return 'none';
    }
  }

  /**
   * Відправити запит на дружбу
   */
  static async sendFriendRequest(friendId: string): Promise<boolean> {
    try {
      console.log('🔍 UserService: Sending friend request to:', friendId);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Отримуємо ID користувача з таблиці user_profiles
      const { data: userProfile, error: profileError } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('auth_user_id', user.id)
        .single();

      if (profileError) {
        console.error('❌ UserService: Error getting user profile:', profileError);
        throw profileError;
      }

      // Перевіряємо чи вже існує запит на дружбу (в обох напрямках)
      const { data: existingRequests, error: checkError } = await supabase
        .from('friend_requests')
        .select('id, status, user_id, friend_id')
        .or(`and(user_id.eq.${userProfile.id},friend_id.eq.${friendId}),and(user_id.eq.${friendId},friend_id.eq.${userProfile.id})`);

      if (checkError) {
        console.error('❌ UserService: Error checking existing request:', checkError);
        throw checkError;
      }

      // Перевіряємо всі існуючі запити
      if (existingRequests && existingRequests.length > 0) {
        const pendingRequest = existingRequests.find(req => req.status === 'pending');
        const acceptedRequest = existingRequests.find(req => req.status === 'accepted');
        
        if (pendingRequest) {
          if (pendingRequest.user_id === userProfile.id) {
            throw new Error('Запит на дружбу вже відправлено');
          } else {
            throw new Error('Цей користувач вже надіслав вам запит на дружбу');
          }
        }
        
        if (acceptedRequest) {
          throw new Error('Ви вже друзі');
        }
      }

      // Перевіряємо чи вже є дружба
      const { data: existingFriendship, error: friendshipError } = await supabase
        .from('friendships')
        .select('*')
        .or(`and(user1_id.eq.${userProfile.id},user2_id.eq.${friendId}),and(user1_id.eq.${friendId},user2_id.eq.${userProfile.id})`)
        .maybeSingle();

      if (friendshipError && friendshipError.code !== 'PGRST116') {
        console.error('❌ UserService: Error checking existing friendship:', friendshipError);
        throw friendshipError;
      }

      if (existingFriendship) {
        console.log('⚠️ UserService: Users are already friends');
        throw new Error('Ви вже друзі з цим користувачем');
      }

      const { error } = await supabase
        .from('friend_requests')
        .insert([{
          user_id: userProfile.id,
          friend_id: friendId,
          status: 'pending'
        }]);

      if (error) {
        console.error('❌ UserService: Error sending friend request:', error);
        if (error.code === '23505') {
          throw new Error('Запит на дружбу вже існує');
        }
        throw error;
      }

      console.log('✅ UserService: Friend request sent successfully');
      return true;
    } catch (error) {
      console.error('❌ UserService: Unexpected error:', error);
      // Обробляємо помилку дублювання на верхньому рівні
      if (error instanceof Error && error.message.includes('duplicate key')) {
        throw new Error('Запит на дружбу вже надіслано');
      }
      throw error;
    }
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
        .single();

      if (getError) {
        console.error('❌ UserService: Error getting friend request:', getError);
        throw getError;
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