import { supabase } from './supabase';

export interface DatabaseUser {
  id: string;
  email: string;
  name: string;
  last_name?: string;
  avatar?: string;
  bio?: string;
  city?: string;
  birth_date?: string;
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
  user_id: string;
  friend_id: string;
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
  /**
   * Перевірити авторизацію користувача
   */
  private static async ensureAuthenticated() {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) {
      throw new Error('User not authenticated');
    }
    return user;
  }

  /**
   * Отримати профіль поточного користувача
   */
  static async getCurrentUserProfile(): Promise<UserProfile | null> {
    try {
      console.log('🔍 Getting current user profile...');
      const authUser = await this.ensureAuthenticated();
      console.log('✅ User authenticated:', authUser.email);
      
      // Look for user in user_profiles table by auth_user_id
      const { data: profile, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('auth_user_id', authUser.id)
        .single();
      
      console.log('🔍 Raw profile data from database:', profile);
      
      if (error) {
        if (error.code === 'PGRST116') {
          console.log('📝 User profile not found, creating new one...');
          // User doesn't exist, create new profile
          return await this.createUserProfile(authUser);
        } else {
          console.error('❌ Error fetching user profile:', error);
          throw new Error(`Failed to fetch user profile: ${error.message}`);
        }
      }
      
      console.log('✅ User profile found:', profile.id);
      return profile;
    } catch (error) {
      console.error('❌ Error getting current user profile:', error);
      throw error;
    }
  }

  /**
   * Отримати поточного користувача з таблиці user_profiles
   */
  static async getCurrentUser(): Promise<DatabaseUser | null> {
    try {
      console.log('🔍 Getting current user from user_profiles table...');
      const authUser = await this.ensureAuthenticated();
      console.log('✅ User authenticated:', authUser.email);
      
      // Look for user in user_profiles table by auth_user_id
      const { data: user, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('auth_user_id', authUser.id)
        .single();
      
      console.log('🔍 Raw user data from database:', user);
      
      if (error) {
        if (error.code === 'PGRST116') {
          console.log('📝 User not found in user_profiles table, creating new one...');
          // User doesn't exist, create new user
          return await this.createUser(authUser);
        } else {
          console.error('❌ Error fetching user:', error);
          throw new Error(`Failed to fetch user: ${error.message}`);
        }
      }
      
      console.log('✅ User found:', user.id);
      return user;
    } catch (error) {
      console.error('❌ Error getting current user:', error);
      throw error;
    }
  }

  /**
   * Створити нового користувача в таблиці user_profiles
   */
  private static async createUser(authUser: any): Promise<DatabaseUser | null> {
    try {
      console.log('📝 Creating new user in user_profiles table for:', authUser.email);
      
      const newUserData = {
        auth_user_id: authUser.id,
        email: authUser.email,
        name: authUser.user_metadata?.name || authUser.email?.split('@')[0] || 'User',
        last_name: authUser.user_metadata?.last_name || '',
        avatar: authUser.user_metadata?.avatar || null,
        bio: '',
        city: '',
        birth_date: null,
        gender: null,
        age: null,
        education: '',
        phone: '',
        work: '',
        website: '',
        relationship_status: '',
        hobbies: [] as string[],
        languages: [] as string[],
        notifications: { email: true, messages: true, friendRequests: true },
        privacy: { profileVisibility: 'public', showBirthDate: true, showEmail: false }
      };
      
      console.log('📋 New user data:', newUserData);
      
      const { data: newUser, error } = await supabase
        .from('user_profiles')
        .insert([newUserData])
        .select()
        .single();
        
      if (error) {
        console.error('❌ Error creating user:', error);
        throw new Error(`Failed to create user: ${error.message}`);
      }
      
      console.log('✅ New user created:', newUser.id);
      return newUser;
    } catch (error) {
      console.error('❌ Error creating user:', error);
      throw error;
    }
  }

  // Create new user profile
  private static async createUserProfile(authUser: any): Promise<UserProfile | null> {
    try {
      console.log('📝 Creating new user profile for:', authUser.email);
      
      const newProfileData = {
        auth_user_id: authUser.id,
        name: authUser.user_metadata?.name || authUser.email?.split('@')[0] || 'User',
        last_name: authUser.user_metadata?.last_name || '',
        email: authUser.email,
        avatar: authUser.user_metadata?.avatar || null,
        bio: '',
        city: '',
        birth_date: null,
        gender: null,
        age: null,
        education: '',
        phone: '',
        work: '',
        website: '',
        relationship_status: '',
        hobbies: [] as string[],
        languages: [] as string[],
        notifications: { email: true, messages: true, friendRequests: true },
        privacy: { profileVisibility: 'public', showBirthDate: true, showEmail: false }
      };
      
      console.log('📋 New profile data:', newProfileData);
      
      const { data: newProfile, error } = await supabase
        .from('user_profiles')
        .insert([newProfileData])
        .select('id, auth_user_id, name, last_name, email, avatar, bio, city, birth_date, education, phone, work, website, relationship_status, hobbies, languages, notifications, privacy, created_at, updated_at')
        .single();
        
      if (error) {
        console.error('❌ Error creating user profile:', error);
        throw new Error(`Failed to create user profile: ${error.message}`);
      }
      
      console.log('✅ New user profile created:', newProfile.id);
      return newProfile;
    } catch (error) {
      console.error('❌ Error creating user profile:', error);
      throw error;
    }
  }

  /**
   * Пошук користувачів
   */
  static async searchUsers(query: string): Promise<UserProfile[]> {
    try {
      console.log('🔍 Searching users with query:', query);
      
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .or(`name.ilike.%${query}%,last_name.ilike.%${query}%`)
        .limit(20);
        
      if (error) {
        console.error('❌ Error searching users:', error);
        throw error;
      }
      
      console.log('✅ Users found:', data?.length || 0);
      return data || [];
    } catch (error) {
      console.error('❌ Error searching users:', error);
      return [];
    }
  }

  /**
   * Отримати всіх користувачів
   */
  static async getAllUsers({ limit = 100, offset = 0 } = {}): Promise<UserProfile[]> {
    try {
      console.log('🔍 Getting all users...');
      
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .range(offset, offset + limit - 1)
        .order('created_at', { ascending: false });
        
      if (error) {
        console.error('❌ Error getting all users:', error);
        throw error;
      }
      
      console.log('✅ All users fetched:', data?.length || 0);
      return data || [];
    } catch (error) {
      console.error('❌ Error getting all users:', error);
      return [];
    }
  }

  /**
   * Отримати пости користувача
   */
  static async getUserPosts(userId: string): Promise<Post[]> {
    try {
      console.log('🔍 Getting posts for user:', userId);
      
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
        
      if (error) {
        console.error('❌ Error getting user posts:', error);
        throw error;
      }
      
      console.log('✅ User posts fetched:', data?.length || 0);
      return data || [];
    } catch (error) {
      console.error('❌ Error getting user posts:', error);
      return [];
    }
  }

  /**
   * Отримати медіа користувача
   */
  static async getUserMedia(userId: string): Promise<Media[]> {
    try {
      console.log('🔍 Getting media for user:', userId);
      
      const { data, error } = await supabase
        .from('media')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
        
      if (error) {
        console.error('❌ Error getting user media:', error);
        throw error;
      }
      
      console.log('✅ User media fetched:', data?.length || 0);
      return data || [];
    } catch (error) {
      console.error('❌ Error getting user media:', error);
      return [];
    }
  }

  /**
   * Оновити профіль користувача
   */
  static async updateUserProfile(updates: Partial<UserProfile>): Promise<UserProfile | null> {
    try {
      console.log('🔍 Updating user profile...');
      const authUser = await this.ensureAuthenticated();
      
      const { data, error } = await supabase
        .from('user_profiles')
        .update(updates)
        .eq('auth_user_id', authUser.id)
        .select()
        .single();
        
      if (error) {
        console.error('❌ Error updating user profile:', error);
        throw error;
      }
      
      console.log('✅ User profile updated:', data.id);
      return data;
    } catch (error) {
      console.error('❌ Error updating user profile:', error);
      throw error;
    }
  }

  /**
   * Створити пост
   */
  static async createPost(content: string, mediaUrl?: string, mediaType?: 'photo' | 'video' | 'document'): Promise<Post | null> {
    try {
      console.log('🔍 Creating post...');
      const authUser = await this.ensureAuthenticated();
      
      // Get user profile ID
      const { data: userProfile, error: profileError } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('auth_user_id', authUser.id)
        .maybeSingle();
        
      if (profileError) {
        console.error('❌ Error getting user profile:', profileError);
        throw profileError;
      }
      
      if (!userProfile) {
        console.error('❌ User profile not found');
        throw new Error('Профіль користувача не знайдено');
      }
      
      // Перевіряємо чи вже існує запит на дружбу (в обох напрямках)
      const { data: existingRequests, error: checkError } = await supabase
        .from('friend_requests')
        .select('id, status, user_id, friend_id')
        .or(`and(user_id.eq.${userProfile.id},friend_id.eq.${receiverId}),and(user_id.eq.${receiverId},friend_id.eq.${userProfile.id})`);

      if (checkError) {
        console.error('❌ Error checking existing request:', checkError);
        throw checkError;
      }
      
      if (existingRequests && existingRequests.length > 0) {
        const existingRequest = existingRequests[0];
        if (existingRequest.status === 'pending') {
          console.log('⚠️ Friend request already exists');
          throw new Error('Запит на дружбу вже надіслано');
        } else if (existingRequest.status === 'accepted') {
          console.log('⚠️ Users are already friends');
          throw new Error('Ви вже друзі');
        }
       }
      
      const { data, error } = await supabase
        .from('posts')
        .insert([{
          user_id: userProfile.id,
          content,
          media_url: mediaUrl,
          media_type: mediaType,
          likes_count: 0,
          comments_count: 0
        }])
        .select()
        .single();
        
      if (error) {
        console.error('❌ Error creating post:', error);
        throw error;
      }
      
      console.log('✅ Post created:', data.id);
      return data;
    } catch (error) {
      console.error('❌ Error creating post:', error);
      throw error;
    }
  }

  /**
   * Отримати групи користувача
   */
  static async getUserGroups(userId: string): Promise<Group[]> {
    try {
      console.log('🔍 Getting groups for user:', userId);
      
      const { data, error } = await supabase
        .from('group_members')
        .select('group_id')
        .eq('user_id', userId);
        
      if (error) {
        console.error('❌ Error getting user groups:', error);
        throw error;
      }
      
      if (!data || data.length === 0) {
        return [];
      }
      
      const groupIds = data.map(member => member.group_id);
      
      const { data: groups, error: groupsError } = await supabase
        .from('groups')
        .select('*')
        .in('id', groupIds);
        
      if (groupsError) {
        console.error('❌ Error getting groups:', groupsError);
        throw groupsError;
      }
      
      console.log('✅ User groups fetched:', groups?.length || 0);
      return groups || [];
    } catch (error) {
      console.error('❌ Error getting user groups:', error);
      return [];
    }
  }

  /**
   * Отримати друзів користувача
   */
  static async getUserFriends(userId: string): Promise<DatabaseUser[]> {
    try {
      console.log('🔍 Getting friends for user:', userId);
      
      // Get friendships where user is user1
      const { data: friendships1, error: error1 } = await supabase
        .from('friendships')
        .select('user2_id')
        .eq('user1_id', userId);
        
      // Get friendships where user is user2
      const { data: friendships2, error: error2 } = await supabase
        .from('friendships')
        .select('user1_id')
        .eq('user2_id', userId);
        
      if (error1 || error2) {
        console.error('❌ Error getting friendships:', error1 || error2);
        throw error1 || error2;
      }
      
      // Collect all friend IDs
      const friendIds = [
        ...(friendships1 || []).map(f => f.user2_id),
        ...(friendships2 || []).map(f => f.user1_id)
      ];
      
      if (friendIds.length === 0) {
        return [];
      }
      
      // Get friend profiles
      const { data: friends, error: friendsError } = await supabase
        .from('user_profiles')
        .select('*')
        .in('id', friendIds);
        
      if (friendsError) {
        console.error('❌ Error getting friends:', friendsError);
        throw friendsError;
      }
      
      console.log('✅ User friends fetched:', friends?.length || 0);
      return friends || [];
    } catch (error) {
      console.error('❌ Error getting user friends:', error);
      return [];
    }
  }

  /**
   * Відправити запит на дружбу
   */
  static async sendFriendRequest(receiverId: string): Promise<boolean> {
    try {
      console.log('🔍 Sending friend request to:', receiverId);
      const authUser = await this.ensureAuthenticated();
      
      // Get user profile ID
      const { data: userProfile, error: profileError } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('auth_user_id', authUser.id)
        .single();
        
      if (profileError) {
        console.error('❌ Error getting user profile:', profileError);
        throw profileError;
      }
      
      // Перевіряємо чи вже існує запит на дружбу або дружба
      const { data: existingRequests, error: checkError } = await supabase
        .from('friend_requests')
        .select('*')
        .or(`and(user_id.eq.${userProfile.id},friend_id.eq.${receiverId}),and(user_id.eq.${receiverId},friend_id.eq.${userProfile.id})`);
        
      if (checkError) {
        console.error('❌ Error checking existing requests:', checkError);
        throw checkError;
      }
      
      if (existingRequests && existingRequests.length > 0) {
        const existingRequest = existingRequests[0];
        if (existingRequest.status === 'pending') {
          console.log('⚠️ Friend request already exists');
          throw new Error('Запит на дружбу вже надіслано');
        } else if (existingRequest.status === 'accepted') {
          console.log('⚠️ Users are already friends');
          throw new Error('Ви вже друзі');
        }
      }
      
      // Перевіряємо чи вже існує дружба
      const { data: existingFriendship, error: friendshipError } = await supabase
        .from('friendships')
        .select('*')
        .or(`and(user1_id.eq.${userProfile.id},user2_id.eq.${receiverId}),and(user1_id.eq.${receiverId},user2_id.eq.${userProfile.id})`);
        
      if (friendshipError) {
        console.error('❌ Error checking existing friendship:', friendshipError);
        throw friendshipError;
      }
      
      if (existingFriendship && existingFriendship.length > 0) {
        console.log('⚠️ Users are already friends');
        throw new Error('Ви вже друзі');
      }
      
      const { error } = await supabase
        .from('friend_requests')
        .insert([{
          user_id: userProfile.id,
          friend_id: receiverId,
          status: 'pending'
        }]);
        
      if (error) {
        console.error('❌ Error sending friend request:', error);
        throw error;
      }
      
      console.log('✅ Friend request sent successfully');
      return true;
    } catch (error) {
      console.error('❌ Error sending friend request:', error);
      throw error;
    }
  }

  /**
   * Додати друга
   */
  static async addFriend(friendId: string): Promise<boolean> {
    try {
      console.log('🔍 Adding friend:', friendId);
      const authUser = await this.ensureAuthenticated();
      
      // Get user profile ID
      const { data: userProfile, error: profileError } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('auth_user_id', authUser.id)
        .single();
        
      if (profileError) {
        console.error('❌ Error getting user profile:', profileError);
        throw profileError;
      }
      
      const { error } = await supabase
        .from('friendships')
        .insert([{
          user1_id: userProfile.id,
          user2_id: friendId
        }]);
        
      if (error) {
        console.error('❌ Error adding friend:', error);
        throw error;
      }
      
      console.log('✅ Friend added successfully');
      return true;
    } catch (error) {
      console.error('❌ Error adding friend:', error);
      throw error;
    }
  }
}