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
  // Очищення даних
  const profileData: any = {
    auth_user_id,
    name,
    last_name,
    email,
    ...rest,
  };
  // null для дат
  if (profileData.birth_date === "") profileData.birth_date = null;
  if (profileData.birthday === "") profileData.birthday = null;

  // Перевірити, чи існує профіль
  const { data: existingProfile, error: selectError } = await supabase
    .from('user_profiles')
    .select('id')
    .eq('auth_user_id', auth_user_id)
    .maybeSingle();
  if (selectError) return { error: selectError };

  if (!existingProfile) {
    // Створити профіль
    const { data, error } = await supabase.from('user_profiles').insert(profileData).select().maybeSingle();
    return { data, error };
  } else {
    // Оновити профіль
    const { data, error } = await supabase.from('user_profiles').update(profileData).eq('auth_user_id', auth_user_id).select().maybeSingle();
    return { data, error };
  }
} 