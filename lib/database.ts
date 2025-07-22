import { supabase } from './supabase';

export interface DatabaseUser {
  id: string;
  email: string;
  name: string;
  lastName?: string;
  avatar?: string;
  bio?: string;
  city?: string;
  birthDate?: string;
  date?: string;
  notifications?: {
    email: boolean;
    messages: boolean;
    friendRequests: boolean;
  };
  privacy?: {
    profileVisibility: 'public' | 'friends' | 'private';
    showBirthDate: boolean;
    showEmail: boolean;
  };
}

export class DatabaseService {
  // Get current user profile or create if doesn't exist
  static async getCurrentUserProfile(): Promise<DatabaseUser | null> {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      
      if (!authUser?.email) {
        console.log('No authenticated user found');
        return null;
      }

      // Try to get existing user profile
      const { data: existingUser, error: fetchError } = await supabase
        .from('users')
        .select('*')
        .eq('email', authUser.email)
        .single();

      if (fetchError) {
        if (fetchError.code === 'PGRST116') {
          // User doesn't exist, create new profile
          return await this.createUserProfile(authUser);
        }
        console.error('Error fetching user profile:', fetchError);
        return null;
      }

      return existingUser;
    } catch (error) {
      console.error('Error getting current user profile:', error);
      return null;
    }
  }

  // Create new user profile
  private static async createUserProfile(authUser: any): Promise<DatabaseUser | null> {
    try {
      const newUserData = {
        email: authUser.email,
        name: authUser.user_metadata?.name || 
              authUser.user_metadata?.full_name?.split(' ')[0] || 
              authUser.email.split('@')[0] || 
              'User',
        lastName: authUser.user_metadata?.lastName || 
                  authUser.user_metadata?.full_name?.split(' ').slice(1).join(' ') || 
                  '',
        date: new Date().toISOString(),
        notifications: {
          email: true,
          messages: true,
          friendRequests: true,
        },
        privacy: {
          profileVisibility: 'public' as const,
          showBirthDate: true,
          showEmail: false,
        },
      };

      const { data: newUser, error: insertError } = await supabase
        .from('users')
        .insert([newUserData])
        .select()
        .single();

      if (insertError) {
        console.error('Error creating user profile:', insertError);
        return null;
      }

      return newUser;
    } catch (error) {
      console.error('Error creating user profile:', error);
      return null;
    }
  }

  // Search users by name
  static async searchUsers(query: string): Promise<DatabaseUser[]> {
    try {
      if (query.length < 2) {
        return [];
      }

      const { data, error } = await supabase
        .from('users')
        .select('id, name, lastName, avatar, email')
        .or(`name.ilike.%${query}%, lastName.ilike.%${query}%`)
        .limit(10);

      if (error) {
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error searching users:', error);
      return [];
    }
  }

  // Get user friends
  static async getUserFriends(): Promise<DatabaseUser[]> {
    try {
      const currentUser = await this.getCurrentUserProfile();
      if (!currentUser) {
        return [];
      }

      const { data, error } = await supabase
        .from('friends')
        .select(`
          friend_id,
          friend:users!friend_id (
            id,
            name,
            lastName,
            avatar,
            email
          )
        `)
        .eq('user_id', currentUser.id);

      if (error) {
        throw error;
      }

      return data?.map(f => f.friend).filter(Boolean) || [];
    } catch (error) {
      console.error('Error fetching friends:', error);
      return [];
    }
  }

  // Add friend
  static async addFriend(friendId: string): Promise<boolean> {
    try {
      const currentUser = await this.getCurrentUserProfile();
      if (!currentUser) {
        return false;
      }

      const { error } = await supabase
        .from('friends')
        .insert([
          { user_id: currentUser.id, friend_id: friendId }
        ]);

      if (error) {
        throw error;
      }

      return true;
    } catch (error) {
      console.error('Error adding friend:', error);
      return false;
    }
  }

  // Update user profile
  static async updateUserProfile(updates: Partial<DatabaseUser>): Promise<boolean> {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      
      if (!authUser?.email) {
        return false;
      }

      const { error } = await supabase
        .from('users')
        .update(updates)
        .eq('email', authUser.email);

      if (error) {
        throw error;
      }

      return true;
    } catch (error) {
      console.error('Error updating user profile:', error);
      return false;
    }
  }

  // Get user media
  static async getUserMedia(): Promise<any[]> {
    try {
      const currentUser = await this.getCurrentUserProfile();
      if (!currentUser) {
        return [];
      }

      const { data, error } = await supabase
        .from('media')
        .select('*')
        .eq('user_id', currentUser.id)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error loading media:', error);
      return [];
    }
  }
}