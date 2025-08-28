import { supabase } from '../../../lib/supabase';
import { AuthUserService } from '../../../lib/authUserService';
import { User, FriendRequest } from '../types';

export class PeopleService {
  /**
   * Отримати всіх користувачів
   */
  static async getAllUsers(): Promise<User[]> {
    try {
      console.log('🔍 PeopleService: Fetching all users');
      
      // Отримуємо користувачів з user_profiles (як fallback, оскільки auth.users недоступна через RLS)
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ PeopleService: Error fetching users:', error);
        throw error;
      }

      // Конвертуємо дані в формат User
      const users: User[] = (data || []).map(profile => ({
        id: profile.id || profile.auth_user_id,
        auth_user_id: profile.auth_user_id,
        name: profile.name || '',
        last_name: profile.last_name || '',
        email: profile.email || '',
        avatar: profile.avatar,
        bio: profile.bio,
        city: profile.city,
        birth_date: profile.birth_date,
        education: profile.education,
        phone: profile.phone,
        work: profile.work,
        website: profile.website,
        relationship_status: profile.relationship_status,
        hobbies: profile.hobbies || [],
        languages: profile.languages || [],
        notifications: profile.notifications,
        privacy: profile.privacy,
        email_verified: false, // Поле тимчасово відключене через проблеми зі схемою кешу
        created_at: profile.created_at,
        updated_at: profile.updated_at,
        isOnline: false, // TODO: Implement online status
        lastSeen: profile.updated_at
      }));

      console.log('✅ PeopleService: Users fetched:', users.length);
      return users;
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

      // Отримуємо ID користувача з таблиці user_profiles
      const { data: userProfile, error: profileError } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('auth_user_id', user.id)
        .single();

      if (profileError) {
        console.error('❌ PeopleService: Error getting user profile:', profileError);
        return [];
      }

      const { data, error } = await supabase
        .from('friend_requests')
        .select('*')
        .or(`user_id.eq.${userProfile.id},friend_id.eq.${userProfile.id}`)
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

      // Отримуємо ID користувача з таблиці user_profiles
      const { data: userProfile, error: profileError } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('auth_user_id', user.id)
        .single();

      if (profileError) {
        console.error('❌ PeopleService: Error getting user profile:', profileError);
        throw profileError;
      }

      const { error } = await supabase
        .from('friend_requests')
        .insert([{
          user_id: userProfile.id,
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

      // Отримуємо ID користувача з таблиці user_profiles
      const { data: userProfile, error: profileError } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('auth_user_id', user.id)
        .single();

      if (profileError) {
        console.error('❌ PeopleService: Error getting user profile:', profileError);
        throw profileError;
      }
      
      // Видаляємо дружбу
      const { error } = await supabase
        .from('friendships')
        .delete()
        .or(`and(user1_id.eq.${userProfile.id},user2_id.eq.${friendId}),and(user1_id.eq.${friendId},user2_id.eq.${userProfile.id})`);

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