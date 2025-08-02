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
  education?: string;
  phone?: string;
  hobbies?: string[];
  relationship_status?: string;
  work?: string;
  website?: string;
  languages?: string[];
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
  static async getCurrentUserProfile(): Promise<UserProfile | null> {
    try {
      console.log('🔍 Getting current user profile...');
      const authUser = await this.ensureAuthenticated();
      console.log('✅ User authenticated:', authUser.email);
      
      // Look for user profile by auth_user_id
      const { data: profile, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('auth_user_id', authUser.id)
        .single();
      
      console.log('🔍 Raw profile data from database:', profile);
      
      if (error) {
        if (error.code === 'PGRST116') {
          console.log('📝 Profile not found, creating new one...');
          // Profile doesn't exist, create new profile
          return await this.createUserProfile(authUser);
        } else {
          console.error('❌ Error fetching user profile:', error);
          throw new Error(`Failed to fetch user profile: ${error.message}`);
        }
      }
      
      console.log('✅ User profile found:', profile.id);
      console.log('🔍 Hobbies from database:', profile.hobbies);
      console.log('🔍 Languages from database:', profile.languages);
      console.log('🔍 Hobbies type:', typeof profile.hobbies);
      console.log('🔍 Languages type:', typeof profile.languages);
      console.log('🔍 Hobbies length:', profile.hobbies?.length);
      console.log('🔍 Languages length:', profile.languages?.length);
      
      return profile;
    } catch (error) {
      console.error('❌ Error getting current user profile:', error);
      throw error;
    }
  }


  // Create new user profile
  private static async createUserProfile(authUser: any): Promise<UserProfile | null> {
    try {
      console.log('📝 Creating new user profile for:', authUser.email);
      
      const newProfileData = {
        auth_user_id: authUser.id,
        name: authUser.user_metadata?.name || authUser.user_metadata?.full_name?.split(' ')[0] || authUser.email?.split('@')[0] || 'User',
        last_name: authUser.user_metadata?.lastname || authUser.user_metadata?.full_name?.split(' ').slice(1).join(' ') || '',
        email: authUser.email,
        hobbies: [] as string[],
        languages: [] as string[],
        notifications: { email: true, messages: true, friendRequests: true },
        privacy: { profileVisibility: 'public', showBirthDate: true, showEmail: false }
      };
      
      console.log('📋 New profile data:', newProfileData);
      
      const { data: newProfile, error } = await supabase
        .from('user_profiles')
        .insert([newProfileData])
        .select()
        .single();
        
      if (error) {
        console.error('❌ Error creating user profile:', error);
        throw new Error(`Failed to create user profile: ${error.message}`);
      }
      
      console.log('✅ New profile created:', newProfile.id);
      console.log('🔍 New profile hobbies:', newProfile.hobbies);
      console.log('🔍 New profile languages:', newProfile.languages);
      return newProfile;
    } catch (error) {
      console.error('❌ Error creating user profile:', error);
      throw error;
    }
  }

  // Search users by name
  static async searchUsers(query: string): Promise<UserProfile[]> {
    try {
      if (query.length < 2) {
        return [];
      }
      await this.ensureAuthenticated();
      const { data, error } = await supabase
        .from('user_profiles')
        .select('auth_user_id, name, last_name, avatar, email')
        .or(`name.ilike.%${query}%,last_name.ilike.%${query}%`)
        .limit(10);
      if (error) {
        console.error('Error searching user_profiles:', error);
        throw new Error(`Search failed: ${error.message}`);
      }
      return data || [];
    } catch (error) {
      console.error('Error searching user_profiles:', error);
      return [];
    }
  }

  // Get all users (profiles)
  static async getAllUsers({ limit = 100, offset = 0 } = {}): Promise<UserProfile[]> {
    try {
      console.log('🔍 DatabaseService.getAllUsers called with:', { limit, offset });
      
      await this.ensureAuthenticated();
      
      console.log('📡 Executing Supabase query...');
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);
        
      console.log('📊 Supabase response:', { data, error });
      
      if (error) {
        console.error('❌ Error fetching all user_profiles:', error);
        throw new Error(`Failed to fetch user_profiles: ${error.message}`);
      }
      
      const validProfiles = (data || []).filter(profile => 
        profile && profile.auth_user_id && profile.name && profile.email && profile.name.trim() !== '' && profile.email.trim() !== ''
      );
      
      console.log('✅ Valid profiles found:', validProfiles.length);
      console.log('📋 Sample profile:', validProfiles[0]);
      
      return validProfiles;
    } catch (error) {
      console.error('❌ Error fetching all user_profiles:', error);
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
  static async updateUserProfile(updates: Partial<UserProfile>): Promise<UserProfile | null> {
    try {
      const authUser = await this.ensureAuthenticated();

      // Remove non-database fields
      const { id, ...safeUpdates } = updates;

      console.log('Updating user profile with:', safeUpdates);
      const { data, error } = await supabase
        .from('user_profiles')
        .update(safeUpdates)
        .eq('auth_user_id', authUser.id)
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
        user_id: currentUser.auth_user_id,
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
        .select('*')
        .or(`user1_id.eq.${userId},user2_id.eq.${userId}`);

      if (error) {
        throw error;
      }

      // Отримуємо ID друзів
      const friendIds = (data || []).map(f => 
        f.user1_id === userId ? f.user2_id : f.user1_id
      );

      if (friendIds.length === 0) {
        return [];
      }

      // Отримуємо профілі друзів
      const { data: profiles, error: profilesError } = await supabase
        .from('user_profiles')
        .select('id, name, lastname, avatar, email')
        .in('auth_user_id', friendIds);

      if (profilesError) {
        throw profilesError;
      }

      return profiles || [];
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
          sender_id: currentUser.auth_user_id,
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
          { user_id: currentUser.auth_user_id, friend_id: friendId }
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