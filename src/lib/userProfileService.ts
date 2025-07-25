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