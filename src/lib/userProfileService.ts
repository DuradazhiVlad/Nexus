import { supabase } from './supabase';

export async function getUserProfile(authUserId: string) {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('auth_user_id', authUserId)
    .single();
  if (error) throw error;
  return data;
}

export async function updateUserProfile(authUserId: string, updates: any) {
  const { data, error } = await supabase
    .from('user_profiles')
    .update(updates)
    .eq('auth_user_id', authUserId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function insertUserProfile(profile: { auth_user_id: string, name: string, last_name: string, email: string }) {
  const { data, error } = await supabase
    .from('user_profiles')
    .insert([profile]);
  return { data, error };
}

export async function upsertUserProfile({ auth_user_id, name, last_name, email, ...rest }: {
  auth_user_id: string;
  name: string;
  last_name: string;
  email: string;
  [key: string]: any;
}) {
  console.log('📝 upsertUserProfile called with:', { auth_user_id, name, last_name, email });

  // Підготовка даних профілю з значеннями за замовчуванням
  const profileData: any = {
    auth_user_id,
    name: name.trim(),
    last_name: last_name.trim(),
    email: email.trim().toLowerCase(),
    hobbies: [] as string[],
    languages: [] as string[],
    notifications: {
      email: true,
      messages: true,
      friendRequests: true
    },
    privacy: {
      profileVisibility: 'public',
      showBirthDate: true,
      showEmail: false
    },
    ...rest,
  };

  // Очищення даних
  if (profileData.birth_date === "") profileData.birth_date = null;
  if (profileData.birthday === "") profileData.birthday = null;

  console.log('📋 Prepared profile data:', profileData);

  try {
    // Перевірити, чи існує профіль
    const { data: existingProfile, error: selectError } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('auth_user_id', auth_user_id)
      .maybeSingle();

    if (selectError) {
      console.error('❌ Error checking existing profile:', selectError);
      return { error: selectError };
    }

    if (!existingProfile) {
      // Створити новий профіль
      console.log('🆕 Creating new user profile...');
      const { data, error } = await supabase
        .from('user_profiles')
        .insert([profileData])
        .select()
        .single();

      if (error) {
        console.error('❌ Error creating profile:', error);
        return { error };
      }

      console.log('✅ New profile created:', data);
      return { data, error: null };
    } else {
      // Оновити існуючий профіль
      console.log('🔄 Updating existing profile...');
      const { data, error } = await supabase
        .from('user_profiles')
        .update(profileData)
        .eq('auth_user_id', auth_user_id)
        .select()
        .single();

      if (error) {
        console.error('❌ Error updating profile:', error);
        return { error };
      }

      console.log('✅ Profile updated:', data);
      return { data, error: null };
    }
  } catch (error) {
    console.error('❌ Unexpected error in upsertUserProfile:', error);
    return { error };
  }
}

// Додаткова функція для створення профілю через RPC (якщо потрібно)
export async function createUserProfileRPC(profileData: any) {
  const { data, error } = await supabase.rpc('create_user_profile', profileData);
  return { data, error };
}

// Функція для отримання всіх профілів (для адміністраторів)
export async function getAllUserProfiles() {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data;
}

// Функція для пошуку профілів за іменем
export async function searchUserProfiles(searchTerm: string) {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .or(`name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%`)
    .order('name', { ascending: true });
  
  if (error) throw error;
  return data;
} 