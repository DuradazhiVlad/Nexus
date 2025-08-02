import { supabase } from '../../../lib/supabase';
import { User, FriendRequest } from '../types';

export class PeopleService {
  /**
   * Отримати всіх користувачів
   */
  static async getAllUsers(): Promise<User[]> {
    try {
      console.log('🔍 PeopleService: Fetching all users');
      
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ PeopleService: Error fetching users:', error);
        throw error;
      }

      console.log('✅ PeopleService: Users fetched:', data);
      return data || [];
    } catch (error) {
      console.error('❌ PeopleService: Unexpected error:', error);
      return [];
    }
  }

  /**
   * Отримати запити на дружбу
   */
  static async getFriendRequests(): Promise<FriendRequest[]> {
    try {
      console.log('🔍 PeopleService: Fetching friend requests');
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('friend_requests')
        .select('*')
        .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`)
        .eq('status', 'pending');

      if (error) {
        console.error('❌ PeopleService: Error fetching friend requests:', error);
        throw error;
      }

      console.log('✅ PeopleService: Friend requests fetched:', data);
      return data || [];
    } catch (error) {
      console.error('❌ PeopleService: Unexpected error:', error);
      return [];
    }
  }

  /**
   * Відправити запит на дружбу
   */
  static async sendFriendRequest(friendId: string): Promise<boolean> {
    try {
      console.log('🔍 PeopleService: Sending friend request to:', friendId);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('friend_requests')
        .insert([{
          user_id: user.id,
          friend_id: friendId,
          status: 'pending'
        }]);

      if (error) {
        console.error('❌ PeopleService: Error sending friend request:', error);
        throw error;
      }

      console.log('✅ PeopleService: Friend request sent successfully');
      return true;
    } catch (error) {
      console.error('❌ PeopleService: Unexpected error:', error);
      throw error;
    }
  }

  /**
   * Прийняти запит на дружбу
   */
  static async acceptFriendRequest(requestId: string): Promise<boolean> {
    try {
      console.log('🔍 PeopleService: Accepting friend request:', requestId);
      
      // Отримуємо запит
      const { data: request, error: getError } = await supabase
        .from('friend_requests')
        .select('*')
        .eq('id', requestId)
        .single();

      if (getError) {
        console.error('❌ PeopleService: Error getting friend request:', getError);
        throw getError;
      }

      // Оновлюємо статус запиту
      const { error: updateError } = await supabase
        .from('friend_requests')
        .update({ status: 'accepted' })
        .eq('id', requestId);

      if (updateError) {
        console.error('❌ PeopleService: Error updating friend request:', updateError);
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
        console.error('❌ PeopleService: Error creating friendship:', friendshipError);
        throw friendshipError;
      }

      console.log('✅ PeopleService: Friend request accepted successfully');
      return true;
    } catch (error) {
      console.error('❌ PeopleService: Unexpected error:', error);
      throw error;
    }
  }

  /**
   * Відхилити запит на дружбу
   */
  static async rejectFriendRequest(requestId: string): Promise<boolean> {
    try {
      console.log('🔍 PeopleService: Rejecting friend request:', requestId);
      
      const { error } = await supabase
        .from('friend_requests')
        .update({ status: 'rejected' })
        .eq('id', requestId);

      if (error) {
        console.error('❌ PeopleService: Error rejecting friend request:', error);
        throw error;
      }

      console.log('✅ PeopleService: Friend request rejected successfully');
      return true;
    } catch (error) {
      console.error('❌ PeopleService: Unexpected error:', error);
      throw error;
    }
  }

  /**
   * Видалити друга
   */
  static async removeFriend(friendId: string): Promise<boolean> {
    try {
      console.log('🔍 PeopleService: Removing friend:', friendId);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');
      
      // Видаляємо дружбу
      const { error } = await supabase
        .from('friendships')
        .delete()
        .or(`and(user1_id.eq.${user.id},user2_id.eq.${friendId}),and(user1_id.eq.${friendId},user2_id.eq.${user.id})`);

      if (error) {
        console.error('❌ PeopleService: Error removing friend:', error);
        throw error;
      }

      console.log('✅ PeopleService: Friend removed successfully');
      return true;
    } catch (error) {
      console.error('❌ PeopleService: Unexpected error:', error);
      throw error;
    }
  }
} 