// src/lib/userProfileService.ts
import { supabase } from './supabase';

export const UserProfileService = {
  getUserProfile: async (authUserId: string) => {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('auth_user_id', authUserId)
      .single();
    if (error) throw error;
    return data;
  },
  updateUserProfile: async (authUserId: string, updates: any) => {
    const { data, error } = await supabase
      .from('user_profiles')
      .update(updates)
      .eq('auth_user_id', authUserId)
      .select()
      .single();
    if (error) throw error;
    return data;
  },
  upsertUserProfile: async ({ auth_user_id, name, last_name, email, ...rest }: any) => {
    const profileData = {
      auth_user_id,
      name: name?.trim() || '',
      last_name: last_name?.trim() || '',
      email: email?.trim().toLowerCase() || '',
      ...rest,
    };

    const { data: existingProfile } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('auth_user_id', auth_user_id)
      .maybeSingle();

    if (!existingProfile) {
      const { data, error } = await supabase
        .from('user_profiles')
        .insert([profileData])
        .select()
        .single();
      if (error) throw error;
      return data;
    } else {
      const { data, error } = await supabase
        .from('user_profiles')
        .update(profileData)
        .eq('auth_user_id', auth_user_id)
        .select()
        .single();
      if (error) throw error;
      return data;
    }
  },
};
