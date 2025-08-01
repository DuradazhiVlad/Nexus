import { supabase } from './supabase';

export async function getAllPosts() {
  return supabase
    .from('posts')
    .select(`*, user_profiles!posts_user_id_fkey (id, name, last_name, avatar)`)
    .order('created_at', { ascending: false });
}

export async function createPost(post: { content: string, media_url?: string, media_type?: string }) {
  // Get the current user's profile ID
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('User not authenticated');
  }

  // Get user profile
  const { data: profile, error: profileError } = await supabase
    .from('user_profiles')
    .select('id')
    .eq('auth_user_id', user.id)
    .single();

  if (profileError || !profile) {
    throw new Error('User profile not found');
  }

  return supabase
    .from('posts')
    .insert([{ ...post, user_id: profile.id }]);
}

export async function likePost(post_id: string) {
  // Get the current user's profile ID
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('User not authenticated');
  }

  // Get user profile
  const { data: profile, error: profileError } = await supabase
    .from('user_profiles')
    .select('id')
    .eq('auth_user_id', user.id)
    .single();

  if (profileError || !profile) {
    throw new Error('User profile not found');
  }

  return supabase
    .from('post_likes')
    .insert([{ post_id, user_id: profile.id }]);
}

export async function unlikePost(post_id: string) {
  // Get the current user's profile ID
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('User not authenticated');
  }

  // Get user profile
  const { data: profile, error: profileError } = await supabase
    .from('user_profiles')
    .select('id')
    .eq('auth_user_id', user.id)
    .single();

  if (profileError || !profile) {
    throw new Error('User profile not found');
  }

  return supabase
    .from('post_likes')
    .delete()
    .eq('post_id', post_id)
    .eq('user_id', profile.id);
}

export async function getCommentsForPost(post_id: string) {
  return supabase
    .from('post_comments')
    .select(`*, user_profiles!post_comments_user_id_fkey (id, name, last_name, avatar)`)
    .eq('post_id', post_id)
    .order('created_at', { ascending: true });
}

export async function addCommentToPost(post_id: string, content: string) {
  // Get the current user's profile ID
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('User not authenticated');
  }

  // Get user profile
  const { data: profile, error: profileError } = await supabase
    .from('user_profiles')
    .select('id')
    .eq('auth_user_id', user.id)
    .single();

  if (profileError || !profile) {
    throw new Error('User profile not found');
  }

  return supabase
    .from('post_comments')
    .insert([{ post_id, user_id: profile.id, content }]);
}

export async function updatePost(post_id: string, updates: { content?: string; media_url?: string; media_type?: string }) {
  return supabase
    .from('posts')
    .update(updates)
    .eq('id', post_id);
}

export async function deletePost(post_id: string) {
  return supabase
    .from('posts')
    .delete()
    .eq('id', post_id);
} 