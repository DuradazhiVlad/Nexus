import { supabase } from '../../../lib/supabase';
import { DatingUser, DatingMatch, DatingLike, DatingPass } from '../types';

export class DatingService {
  /**
   * Get users available for dating (excluding current user and already interacted users)
   */
  static async getDatingUsers(): Promise<DatingUser[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Use the database function to get dating users
      const { data, error } = await supabase
        .rpc('get_dating_users', { current_user_id: user.id });

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Error fetching dating users:', error);
      throw error;
    }
  }

  /**
   * Like a user
   */
  static async likeUser(toUserId: string): Promise<{ isMatch: boolean; match?: DatingMatch }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Check if the other user already liked us
      const { data: existingLike } = await supabase
        .from('dating_likes')
        .select('*')
        .eq('from_user_id', toUserId)
        .eq('to_user_id', user.id)
        .single();

      // Add our like
      const { error: likeError } = await supabase
        .from('dating_likes')
        .insert({
          from_user_id: user.id,
          to_user_id: toUserId
        });

      if (likeError) throw likeError;

      // If it's a mutual like, create a match
      if (existingLike) {
        const { data: match, error: matchError } = await supabase
          .from('dating_matches')
          .insert({
            user1_id: user.id,
            user2_id: toUserId,
            is_mutual: true
          })
          .select()
          .single();

        if (matchError) throw matchError;

        return { isMatch: true, match };
      }

      return { isMatch: false };
    } catch (error) {
      console.error('Error liking user:', error);
      throw error;
    }
  }

  /**
   * Pass (reject) a user
   */
  static async passUser(toUserId: string): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('dating_passes')
        .insert({
          from_user_id: user.id,
          to_user_id: toUserId
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error passing user:', error);
      throw error;
    }
  }

  /**
   * Get user's matches
   */
  static async getMatches(): Promise<DatingMatch[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('dating_matches')
        .select(`
          *,
          user1:user_profiles!dating_matches_user1_id_fkey(
            id,
            auth_user_id,
            name,
            last_name,
            avatar,
            age,
            gender,
            city,
            bio
          ),
          user2:user_profiles!dating_matches_user2_id_fkey(
            id,
            auth_user_id,
            name,
            last_name,
            avatar,
            age,
            gender,
            city,
            bio
          )
        `)
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
        .eq('is_mutual', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Error fetching matches:', error);
      throw error;
    }
  }

  /**
   * Get users who liked the current user
   */
  static async getLikes(): Promise<DatingLike[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('dating_likes')
        .select(`
          *,
          from_user:user_profiles!dating_likes_from_user_id_fkey(
            id,
            auth_user_id,
            name,
            last_name,
            avatar,
            age,
            gender,
            city,
            bio
          )
        `)
        .eq('to_user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Error fetching likes:', error);
      throw error;
    }
  }

  /**
   * Update user's dating preferences
   */
  static async updateDatingPreferences(preferences: {
    looking_for_relationship?: boolean;
    age?: number;
  }): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('user_profiles')
        .update(preferences)
        .eq('auth_user_id', user.id);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating dating preferences:', error);
      throw error;
    }
  }

  /**
   * Check if user is looking for relationships
   */
  static async isUserLookingForRelationship(): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('user_profiles')
        .select('looking_for_relationship')
        .eq('auth_user_id', user.id)
        .single();

      if (error) throw error;

      return data?.looking_for_relationship || false;
    } catch (error) {
      console.error('Error checking dating status:', error);
      throw error;
    }
  }
}