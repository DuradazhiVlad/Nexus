import { supabase } from './supabase';

export interface DatabaseUser {
  id: string;
  email: string;
  name: string;
  lastname?: string;
  avatar?: string;
  bio?: string;
  city?: string;
  birthdate?: string;
  created_at?: string;
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

export interface UserProfile {
  id: string;
  auth_user_id: string;
  name: string;
  last_name: string;
  email: string;
  avatar?: string;
  bio?: string;
  city?: string;
  birth_date?: string;
  email_verified?: boolean;
  created_at?: string;
  updated_at?: string;
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

export interface Post {
  id: string;
  user_id: string;
  content: string;
  media_url?: string;
  media_type?: 'photo' | 'video' | 'document';
  created_at: string;
  updated_at: string;
  likes_count: number;
  comments_count: number;
}

export interface Media {
  id: string;
  user_id: string;
  type: 'photo' | 'video';
  url: string;
  created_at: string;
}

export interface Group {
  id: string;
  name: string;
  description?: string;
  avatar?: string;
  is_private: boolean;
  created_by: string;
  created_at: string;
  member_count: number;
}

export interface Friendship {
  id: string;
  user1_id: string;
  user2_id: string;
  created_at: string;
}

export interface FriendRequest {
  id: string;
  sender_id: string;
  receiver_id: string;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
  updated_at: string;
}

export interface Conversation {
  id: string;
  participant1_id: string;
  participant2_id: string;
  created_at: string;
  updated_at: string;
}

export class DatabaseService {
  // Перевірка чи користувач аутентифікований
  private static async ensureAuthenticated() {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error) {
        console.error('Auth check failed:', error.message);
        throw new Error(`Authentication failed: ${error.message}`);
      }
      
      if (!user) {
        throw new Error('User not authenticated');
      }
      
      return user;
    } catch (error) {
      console.error('Authentication error:', error);
      throw error;
    }
  }

  // Get current user profile or create if doesn't exist
  static async getCurrentUserProfile(): Promise<DatabaseUser | null> {
    try {
      const authUser = await this.ensureAuthenticated();
      
      console.log('Getting profile for user:', authUser.email);

      // Look for user by ID (since users.id = auth.users.id in the new structure)
      const { data: existingUser, error: fetchError } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single();

      if (fetchError) {
        if (fetchError.code === 'PGRST116') {
          // User doesn't exist, create new profile
          console.log('Creating new user profile for:', authUser.email);
          return await this.createUserProfile(authUser);
        } else {
          console.error('Error fetching user profile:', fetchError);
          throw new Error(`Failed to fetch user profile: ${fetchError.message}`);
        }
      }

      console.log('Found existing user profile:', existingUser);
      return existingUser;
    } catch (error) {
      console.error('Error getting current user profile:', error);
      throw error;
    }
  }


  // Create new user profile
  private static async createUserProfile(authUser: any): Promise<DatabaseUser | null> {
    try {
      const newUserData = {
        id: authUser.id, // Use auth user ID directly
        email: authUser.email,
        name: authUser.user_metadata?.name || 
              authUser.user_metadata?.full_name?.split(' ')[0] || 
              authUser.email?.split('@')[0] || 
              'User',
        lastname: authUser.user_metadata?.lastname || 
                  authUser.user_metadata?.full_name?.split(' ').slice(1).join(' ') || 
                  '',
        notifications: {
          email: true,
          messages: true,
          friendRequests: true
        },
        privacy: {
          profileVisibility: 'public' as const,
          showBirthDate: true,
          showEmail: false
        }
      };

      console.log('Creating user with data:', newUserData);

      const { data: newUser, error: insertError } = await supabase
        .from('users')
        .insert([newUserData])
        .select()
        .single();

      if (insertError) {
        console.error('Error creating user profile:', insertError);
        throw new Error(`Failed to create user profile: ${insertError.message}`);
      }

      console.log('Successfully created user profile:', newUser);
      return newUser;
    } catch (error) {
      console.error('Error creating user profile:', error);
      throw error;
    }
  }

  // Search users by name
  static async searchUsers(query: string): Promise<DatabaseUser[]> {
    try {
      if (query.length < 2) {
        return [];
      }

      // Перевіряємо аутентифікацію перед пошуком
      await this.ensureAuthenticated();

      const { data, error } = await supabase
        .from('users')
        .select('id, name, lastname, avatar, email')
        .or(`name.ilike.%${query}%, lastname.ilike.%${query}%`)
        .limit(10);

      if (error) {
        console.error('Error searching users:', error);
        throw new Error(`Search failed: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error('Error searching users:', error);
      return [];
    }
  }

  // Get all users with proper error handling
  static async getAllUsers(): Promise<DatabaseUser[]> {
    try {
      // Перевіряємо аутентифікацію
      const authUser = await this.ensureAuthenticated();
      console.log('Fetching all users for authenticated user:', authUser.email);

      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching all users:', error);
        throw new Error(`Failed to fetch users: ${error.message}`);
      }

      // Filter out invalid users and ensure required fields
      const validUsers = (data || []).filter(user => 
        user && 
        user.id && 
        user.name && 
        user.email &&
        user.name.trim() !== '' &&
        user.email.trim() !== ''
      );

      console.log(`Fetched ${validUsers.length} valid users out of ${data?.length || 0} total`);
      return validUsers;
    } catch (error) {
      console.error('Error fetching all users:', error);
      // Повертаємо порожній масив замість викидання помилки для UI
      return [];
    }
  }

  // Get user posts
  static async getUserPosts(userId: string): Promise<Post[]> {
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
      console.error('Error fetching user posts:', error);
      return [];
    }
  }

  // Get user media
  static async getUserMedia(userId: string): Promise<Media[]> {
    try {
      const { data, error } = await supabase
        .from('media')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching user media:', error);
      return [];
    }
  }

  // Update user profile
  static async updateUserProfile(updates: Partial<DatabaseUser>): Promise<DatabaseUser | null> {
    try {
      const authUser = await this.ensureAuthenticated();

      // Remove non-database fields
      const { id, ...safeUpdates } = updates;

      console.log('Updating user profile with:', safeUpdates);
      const { data, error } = await supabase
        .from('users')
        .update(safeUpdates)
        .eq('id', authUser.id) // Use direct ID match
        .select()
        .single();

      if (error) {
        console.error('Error updating user profile:', error);
        throw new Error(`Failed to update profile: ${error.message}`);
      }

      console.log('Successfully updated user profile:', data);
      return data;
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw error;
    }
  }

  // Create new post
  static async createPost(content: string, mediaUrl?: string, mediaType?: 'photo' | 'video' | 'document'): Promise<Post | null> {
    try {
      const currentUser = await this.getCurrentUserProfile();
      if (!currentUser) {
        throw new Error('User not authenticated');
      }

      const postData = {
        user_id: currentUser.id,
        content,
        media_url: mediaUrl,
        media_type: mediaType,
      };

      const { data, error } = await supabase
        .from('posts')
        .insert([postData])
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error creating post:', error);
      return null;
    }
  }

  // Get user groups
  static async getUserGroups(userId: string): Promise<Group[]> {
    try {
      const { data, error } = await supabase
        .from('group_members')
        .select(`
          groups:group_id (
            id,
            name,
            description,
            avatar,
            is_private,
            created_by,
            created_at,
            member_count
          )
        `)
        .eq('user_id', userId);

      if (error) {
        throw error;
      }

      return data?.map(item => item.groups).filter(Boolean) || [];
    } catch (error) {
      console.error('Error fetching user groups:', error);
      return [];
    }
  }

  // Get user friends
  static async getUserFriends(userId: string): Promise<DatabaseUser[]> {
    try {
      const { data, error } = await supabase
        .from('friendships')
        .select(`
          user1:user1_id (id, name, lastname, avatar, email),
          user2:user2_id (id, name, lastname, avatar, email)
        `)
        .or(`user1_id.eq.${userId},user2_id.eq.${userId}`);

      if (error) {
        throw error;
      }

      // Extract friends (the other user in each friendship)
      const friends = data?.map(friendship => {
        return friendship.user1?.id === userId ? friendship.user2 : friendship.user1;
      }).filter(Boolean) || [];

      return friends;
    } catch (error) {
      console.error('Error fetching user friends:', error);
      return [];
    }
  }

  // Send friend request
  static async sendFriendRequest(receiverId: string): Promise<boolean> {
    try {
      const currentUser = await this.getCurrentUserProfile();
      if (!currentUser) {
        throw new Error('User not authenticated');
      }

      const { error } = await supabase
        .from('friend_requests')
        .insert([{
          sender_id: currentUser.id,
          receiver_id: receiverId,
          status: 'pending'
        }]);

      if (error) {
        throw error;
      }

      return true;
    } catch (error) {
      console.error('Error sending friend request:', error);
      return false;
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






}