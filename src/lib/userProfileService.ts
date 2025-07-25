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