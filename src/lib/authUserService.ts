import { supabase } from './supabase';

export interface AuthUserProfile {
  id: string;
  email: string;
  name?: string;
  last_name?: string;
  avatar?: string;
  phone?: string;
  email_confirmed_at?: string;
  phone_confirmed_at?: string;
  last_sign_in_at?: string;
  created_at: string;
  updated_at: string;
  raw_user_meta_data?: {
    name?: string;
    last_name?: string;
    avatar?: string;
    full_name?: string;
  };
  // Додаткові поля з user_profiles (якщо потрібні)
  bio?: string;
  city?: string;
  birth_date?: string;
  birthday?: string;
  gender?: string;
  education?: string;
  work?: string;
  website?: string;
  relationship_status?: string;
  hobbies?: string[];
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

export interface UserProfileExtension {
  id?: string;
  auth_user_id: string;
  name?: string;
  last_name?: string;
  avatar?: string;
  bio?: string;
  city?: string;
  birth_date?: string;
  gender?: string;
  education?: string;
  work?: string;
  website?: string;
  phone?: string;
  relationship_status?: string;
  hobbies?: string[];
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
  email_verified?: boolean;
  created_at?: string;
  updated_at?: string;
}

export class AuthUserService {
  /**
   * Створити новий профіль користувача в user_profiles
   */
  static async createUserProfile(profileData: any): Promise<any> {
    try {
      console.log('📝 Creating user profile:', profileData);
      
      // Видаляємо email_verified з даних, оскільки це поле може не існувати в схемі кешу
      const { email_verified, ...cleanProfileData } = profileData;
      
      console.log('📝 Clean profile data for insert:', cleanProfileData);
      
      const { data: newProfile, error } = await supabase
        .from('user_profiles')
        .insert([cleanProfileData])
        .select('id, auth_user_id, name, last_name, email, avatar, bio, city, birth_date, education, phone, work, website, relationship_status, hobbies, languages, notifications, privacy, created_at, updated_at')
        .single();
        
      if (error) {
        console.error('❌ Error creating user profile:', error);
        throw new Error(`Failed to create user profile: ${error.message}`);
      }
      
      console.log('✅ User profile created:', newProfile.id);
      return newProfile;
    } catch (error) {
      console.error('❌ Error creating user profile:', error);
      throw error;
    }
  }

  /**
   * Отримати поточного користувача з auth.users та додаткові дані з user_profiles
   */
  static async getCurrentUserProfile(): Promise<AuthUserProfile | null> {
    try {
      console.log('🔍 Getting current user profile from auth.users...');
      
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
      
      if (authError) {
        console.error('Auth error:', authError);
        throw new Error(`Помилка аутентифікації: ${authError.message}`);
      }
      
      if (!authUser) {
        console.log('No authenticated user');
        return null;
      }
      
      console.log('✅ Authenticated user:', authUser.email);
      
      // Отримуємо додаткові дані з user_profiles (якщо є)
      const { data: profileExtension, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('auth_user_id', authUser.id)
        .single();
      
      if (profileError && profileError.code !== 'PGRST116') {
        console.warn('Warning getting profile extension:', profileError);
      }
      
      // Перевіряємо, чи поля hobbies та languages є масивами
      const hobbies = profileExtension?.hobbies && Array.isArray(profileExtension.hobbies) 
        ? profileExtension.hobbies 
        : [];
      
      const languages = profileExtension?.languages && Array.isArray(profileExtension.languages) 
        ? profileExtension.languages 
        : [];
      
      // Комбінуємо дані з auth.users та user_profiles
      const combinedProfile: AuthUserProfile = {
        id: authUser.id,
        email: authUser.email || '',
        name: profileExtension?.name || authUser.user_metadata?.name || '',
        last_name: profileExtension?.last_name || authUser.user_metadata?.last_name || '',
        avatar: profileExtension?.avatar || authUser.user_metadata?.avatar,
        phone: authUser.phone,
        email_confirmed_at: authUser.email_confirmed_at,
        phone_confirmed_at: authUser.phone_confirmed_at,
        last_sign_in_at: authUser.last_sign_in_at,
        created_at: authUser.created_at,
        updated_at: authUser.updated_at || new Date().toISOString(),
        raw_user_meta_data: authUser.user_metadata,
        // Додаткові поля з user_profiles
        bio: profileExtension?.bio,
        city: profileExtension?.city,
        birth_date: profileExtension?.birth_date,
        gender: profileExtension?.gender,
        age: profileExtension?.age,
        education: profileExtension?.education,
        work: profileExtension?.work,
        website: profileExtension?.website,
        relationship_status: profileExtension?.relationship_status,
        hobbies: hobbies,
        languages: languages,
        notifications: profileExtension?.notifications || {
          email: true,
          messages: true,
          friendRequests: true
        },
        privacy: profileExtension?.privacy || {
          profileVisibility: 'public',
          showBirthDate: true,
          showEmail: false
        }
      };
      
      console.log('✅ Combined user profile loaded');
      return combinedProfile;
    } catch (error) {
      console.error('❌ Error getting current user profile:', error);
      throw error;
    }
  }
  
  /**
   * Оновити метадані користувача в auth.users
   */
  static async updateUserMetadata(metadata: {
    name?: string;
    last_name?: string;
    avatar?: string;
    full_name?: string;
  }): Promise<boolean> {
    try {
      console.log('📝 Updating user metadata...');
      
      const { error } = await supabase.auth.updateUser({
        data: metadata
      });
      
      if (error) {
        console.error('❌ Error updating user metadata:', error);
        throw error;
      }
      
      console.log('✅ User metadata updated');
      return true;
    } catch (error) {
      console.error('❌ Error updating user metadata:', error);
      throw error;
    }
  }
  
  /**
   * Оновити або створити розширення профілю в user_profiles
   */
  static async updateProfileExtension(extension: Partial<UserProfileExtension>): Promise<boolean> {
    try {
      console.log('📝 Updating profile extension...');
      
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !authUser) {
        throw new Error('User not authenticated');
      }
      
      // Переконуємося, що hobbies та languages є масивами
      const cleanExtension = { ...extension };
      
      if (cleanExtension.hobbies && !Array.isArray(cleanExtension.hobbies)) {
        cleanExtension.hobbies = [];
      }
      
      if (cleanExtension.languages && !Array.isArray(cleanExtension.languages)) {
        cleanExtension.languages = [];
      }
      
      console.log('📝 Clean extension data for update:', cleanExtension);
      
      // Перевіряємо чи існує запис
      const { data: existing, error: checkError } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('auth_user_id', authUser.id)
        .single();
      
      if (checkError && checkError.code !== 'PGRST116') {
        throw checkError;
      }
      
      if (existing) {
        // Оновлюємо існуючий запис
        const { error: updateError } = await supabase
          .from('user_profiles')
          .update(cleanExtension)
          .eq('auth_user_id', authUser.id);
          
        if (updateError) {
          throw updateError;
        }
      } else {
        // Створюємо новий запис
        const { error: insertError } = await supabase
          .from('user_profiles')
          .insert([{
            auth_user_id: authUser.id,
            ...cleanExtension
          }]);
          
        if (insertError) {
          throw insertError;
        }
      }
      
      console.log('✅ Profile extension updated');
      return true;
    } catch (error) {
      console.error('❌ Error updating profile extension:', error);
      throw error;
    }
  }
  
  /**
   * Оновити повний профіль (метадані + розширення)
   */
  static async updateFullProfile(updates: {
    name?: string;
    last_name?: string;
    avatar?: string;
    bio?: string;
    city?: string;
    birth_date?: string;
    gender?: string;
    age?: number | null;
    education?: string;
    work?: string;
    website?: string;
    phone?: string;
    relationship_status?: string;
    hobbies?: string[];
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
  }): Promise<boolean> {
    try {
      console.log('📝 Updating full profile...');
      
      // Оновлюємо метадані в auth.users
      const metadata: any = {};
      if (updates.name !== undefined) metadata.name = updates.name;
      if (updates.last_name !== undefined) metadata.last_name = updates.last_name;
      if (updates.avatar !== undefined) metadata.avatar = updates.avatar;
      if (updates.name || updates.last_name) {
        metadata.full_name = `${updates.name || ''} ${updates.last_name || ''}`.trim();
      }
      
      if (Object.keys(metadata).length > 0) {
        await this.updateUserMetadata(metadata);
      }
      
      // Оновлюємо розширення в user_profiles
      const extension: Partial<UserProfileExtension> = {};
      if (updates.name !== undefined) extension.name = updates.name;
      if (updates.last_name !== undefined) extension.last_name = updates.last_name;
      if (updates.avatar !== undefined) extension.avatar = updates.avatar;
      if (updates.bio !== undefined) extension.bio = updates.bio;
      if (updates.city !== undefined) extension.city = updates.city;
      if (updates.birth_date !== undefined) extension.birth_date = updates.birth_date;
      if (updates.gender !== undefined) extension.gender = updates.gender;
      if (updates.age !== undefined) extension.age = updates.age;
      if (updates.education !== undefined) extension.education = updates.education;
      if (updates.work !== undefined) extension.work = updates.work;
      if (updates.website !== undefined) extension.website = updates.website;
      if (updates.phone !== undefined) extension.phone = updates.phone;
      if (updates.relationship_status !== undefined) extension.relationship_status = updates.relationship_status;
      if (updates.hobbies !== undefined) extension.hobbies = updates.hobbies;
      if (updates.languages !== undefined) extension.languages = updates.languages;
      if (updates.notifications !== undefined) extension.notifications = updates.notifications;
      if (updates.privacy !== undefined) extension.privacy = updates.privacy;
      
      if (Object.keys(extension).length > 0) {
        await this.updateProfileExtension(extension);
      }
      
      console.log('✅ Full profile updated');
      return true;
    } catch (error) {
      console.error('❌ Error updating full profile:', error);
      throw error;
    }
  }
  
  /**
   * Пошук користувачів (використовуючи auth.users + user_profiles)
   */
  static async searchUsers(query: string): Promise<AuthUserProfile[]> {
    try {
      console.log('🔍 Searching users with query:', query);
      
      // Шукаємо в user_profiles, але потім отримуємо дані з auth.users
      const { data: profiles, error } = await supabase
        .from('user_profiles')
        .select('auth_user_id')
        .or(`bio.ilike.%${query}%,city.ilike.%${query}%`)
        .limit(20);
        
      if (error) {
        console.error('❌ Error searching users:', error);
        throw error;
      }
      
      if (!profiles || profiles.length === 0) {
        return [];
      }
      
      // Отримуємо повні профілі для знайдених користувачів
      const userProfiles: AuthUserProfile[] = [];
      
      for (const profile of profiles) {
        try {
          // Тут ми б отримали дані з auth.users, але це складно через RLS
          // Тому використовуємо user_profiles як fallback
          const { data: fullProfile, error: profileError } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('auth_user_id', profile.auth_user_id)
            .single();
            
          if (!profileError && fullProfile) {
            userProfiles.push({
              id: fullProfile.auth_user_id,
              email: fullProfile.email || '',
              created_at: fullProfile.created_at || '',
              updated_at: fullProfile.updated_at || '',
              raw_user_meta_data: {
                name: fullProfile.name,
                last_name: fullProfile.last_name
              },
              bio: fullProfile.bio,
              city: fullProfile.city,
              birth_date: fullProfile.birth_date,
              education: fullProfile.education,
              work: fullProfile.work,
              website: fullProfile.website,
              relationship_status: fullProfile.relationship_status,
              hobbies: fullProfile.hobbies || [],
              languages: fullProfile.languages || [],
              notifications: fullProfile.notifications,
              privacy: fullProfile.privacy
            });
          }
        } catch (err) {
          console.warn('Error loading profile for user:', profile.auth_user_id, err);
        }
      }
      
      console.log('✅ Users found:', userProfiles.length);
      return userProfiles;
    } catch (error) {
      console.error('❌ Error searching users:', error);
      return [];
    }
  }
}