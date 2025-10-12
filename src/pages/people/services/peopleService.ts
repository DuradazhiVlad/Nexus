import { supabase } from '../../../lib/supabase';
import { User, FriendRequest } from '../types';
import { DatabaseService } from '../../../lib/database';

export class PeopleService {
  /**
   * Fetch all users from the database.
   * @returns A promise that resolves to an array of User objects.
   */
  static async getAllUsers(): Promise<User[]> {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      return (data || []).map(profile => ({
        id: profile.id,
        auth_user_id: profile.auth_user_id,
        name: profile.name,
        last_name: profile.last_name,
        email: profile.email,
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
        created_at: profile.created_at,
        updated_at: profile.updated_at,
      })) as User[];
    } catch (error) {
      console.error('Error fetching users:', error);
      return [];
    }
  }

  /**
   * Fetch pending friend requests for the current user.
   * @returns A promise that resolves to an array of FriendRequest objects.
   */
  static async getFriendRequests(): Promise<FriendRequest[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data: userProfile, error: profileError } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('auth_user_id', user.id)
        .maybeSingle();

      if (profileError || !userProfile) {
        return [];
      }

      const { data, error } = await supabase
        .from('friend_requests')
        .select('*')
        .or(`user_id.eq.${userProfile.id},friend_id.eq.${userProfile.id}`);

      if (error) {
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching friend requests:', error);
      return [];
    }
  }

  /**
   * Send a friend request to a user.
   * @param friendId The ID of the user to send a request to.
   * @returns A promise that resolves to a boolean indicating success.
   */
  static async sendFriendRequest(friendId: string): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data: userProfile, error: profileError } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('auth_user_id', user.id)
        .maybeSingle();

      if (profileError || !userProfile) {
        throw new Error('User profile not found');
      }

      const { error } = await supabase
        .from('friend_requests')
        .insert({
          user_id: userProfile.id,
          friend_id: friendId,
          status: 'pending',
        });

      if (error) {
        throw error;
      }

      return true;
    } catch (error) {
      console.error('Error sending friend request:', error);
      throw error;
    }
  }

  /**
   * Accept a pending friend request.
   * @param requestId The ID of the request to accept.
   * @returns A promise that resolves to a boolean indicating success.
   */
  static async acceptFriendRequest(requestId: string): Promise<boolean> {
    try {
      const { data: request, error: getError } = await supabase
        .from('friend_requests')
        .select('*')
        .eq('id', requestId)
        .maybeSingle();

      if (!request || getError) {
        throw new Error('Friend request not found');
      }

      await supabase
        .from('friend_requests')
        .update({ status: 'accepted' })
        .eq('id', requestId);

      await supabase
        .from('friendships')
        .insert({
          user1_id: request.user_id,
          user2_id: request.friend_id,
        });

      return true;
    } catch (error) {
      console.error('Error accepting friend request:', error);
      throw error;
    }
  }

  /**
   * Reject a pending friend request.
   * @param requestId The ID of the request to reject.
   * @returns A promise that resolves to a boolean indicating success.
   */
  static async rejectFriendRequest(requestId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('friend_requests')
        .update({ status: 'rejected' })
        .eq('id', requestId);

      if (error) {
        throw error;
      }

      return true;
    } catch (error) {
      console.error('Error rejecting friend request:', error);
      throw error;
    }
  }

  /**
   * Remove a friend.
   * @param friendId The ID of the friend to remove.
   * @returns A promise that resolves to a boolean indicating success.
   */
  static async removeFriend(friendId: string): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data: userProfile, error: profileError } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('auth_user_id', user.id)
        .maybeSingle();

      if (profileError || !userProfile) {
        throw new Error('User profile not found');
      }

      const { error } = await supabase
        .from('friendships')
        .delete()
        .or(`and(user1_id.eq.${userProfile.id},user2_id.eq.${friendId}),and(user1_id.eq.${friendId},user2_id.eq.${userProfile.id})`);

      if (error) {
        throw error;
      }

      return true;
    } catch (error) {
      console.error('Error removing friend:', error);
      throw error;
    }
  }
}