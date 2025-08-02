import { supabase } from './supabase';

export async function getAllPosts() {
  const { data: { user } } = await supabase.auth.getUser();
  
  // Отримуємо ID профілю поточного користувача для перевірки лайків
  let currentUserProfileId = null;
  if (user) {
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('auth_user_id', user.id)
      .single();
    currentUserProfileId = profile?.id;
  }
  
  let query = supabase
    .from('posts')
    .select(`
      *,
      user_profiles!posts_user_id_fkey (
        id, 
        name, 
        last_name, 
        avatar, 
        friends_count
      ),
      post_likes (id, user_id),
      post_comments (id)
    `)
    .order('created_at', { ascending: false });

  const { data, error } = await query;

  if (error) {
    return { data: null, error };
  }

  // Обробляємо дані щоб додати кількість лайків, коментарів та перевірку лайку
  const processedPosts = data?.map(post => ({
    ...post,
    likes_count: post.post_likes?.length || 0,
    comments_count: post.post_comments?.length || 0,
    isLiked: currentUserProfileId ? post.post_likes?.some((like: any) => like.user_id === currentUserProfileId) : false,
    author: {
      ...post.user_profiles,
      friends_count: post.user_profiles?.friends_count || 0
    }
  })) || [];

  return { data: processedPosts, error: null };
}

export async function createPost(post: { content: string, media_url?: string, media_type?: string }) {
  console.log('🔍 Creating post with data:', post);
  
  // Get the current user's profile ID
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('User not authenticated');
  }

  console.log('✅ User authenticated:', user.email);

  // Get user profile
  const { data: profile, error: profileError } = await supabase
    .from('user_profiles')
    .select('id')
    .eq('auth_user_id', user.id)
    .single();

  if (profileError || !profile) {
    console.error('❌ Profile error:', profileError);
    throw new Error('User profile not found');
  }

  console.log('✅ User profile found:', profile.id);

  const postData = { ...post, user_id: profile.id };
  console.log('📝 Inserting post data:', postData);

  const result = await supabase
    .from('posts')
    .insert([postData])
    .select('*');

  console.log('✅ Post creation result:', result);
  return result;
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

  // Перевіряємо, чи користувач вже лайкнув цей пост
  const { data: existingLike } = await supabase
    .from('post_likes')
    .select('id')
    .eq('post_id', post_id)
    .eq('user_id', profile.id)
    .single();

  if (existingLike) {
    return { data: existingLike, error: null }; // Вже лайкнуто
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

  // Перевіряємо, чи існує пост
  const { data: post, error: postError } = await supabase
    .from('posts')
    .select('id')
    .eq('id', post_id)
    .single();

  if (postError || !post) {
    throw new Error('Post not found');
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

  // Перевіряємо чи користувач є автором поста
  const { data: post, error: postError } = await supabase
    .from('posts')
    .select('user_id')
    .eq('id', post_id)
    .single();

  if (postError || !post) {
    throw new Error('Post not found');
  }

  if (post.user_id !== profile.id) {
    throw new Error('You can only delete your own posts');
  }

  // Спочатку видаляємо лайки та коментарі
  await supabase.from('post_likes').delete().eq('post_id', post_id);
  await supabase.from('post_comments').delete().eq('post_id', post_id);

  // Потім видаляємо сам пост
  return supabase
    .from('posts')
    .delete()
    .eq('id', post_id);
} 

export async function getUserPosts(userProfileId: string) {
  console.log('🔍 Getting user posts for profile ID:', userProfileId);
  
  if (!userProfileId) {
    console.error('❌ No userProfileId provided');
    return { data: [], error: new Error('No userProfileId provided') };
  }
  
  const { data: { user } } = await supabase.auth.getUser();
  
  // Отримуємо ID профілю поточного користувача для перевірки лайків
  let currentUserProfileId = null;
  if (user) {
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('auth_user_id', user.id)
      .single();
    currentUserProfileId = profile?.id;
    console.log('✅ Current user profile ID:', currentUserProfileId);
  }
  
  try {
    // First, let's check if the user profile exists
    const { data: profileCheck, error: profileError } = await supabase
      .from('user_profiles')
      .select('id, name, last_name, avatar')
      .eq('id', userProfileId)
      .single();
    
    if (profileError) {
      console.error('❌ Profile not found:', profileError);
      return { data: [], error: profileError };
    }
    
    console.log('✅ Profile found:', profileCheck);
    
    // Now fetch posts for this user
    const { data, error } = await supabase
      .from('posts')
      .select(`
        *,
        user_profiles!posts_user_id_fkey (
          id, 
          name, 
          last_name, 
          avatar, 
          friends_count
        ),
        post_likes (id, user_id),
        post_comments (id)
      `)
      .eq('user_id', userProfileId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error fetching posts:', error);
      return { data: [], error };
    }

    console.log('✅ Raw posts data:', data);

    // Обробляємо дані щоб додати кількість лайків, коментарів та перевірку лайку
    const processedPosts = data?.map(post => ({
      ...post,
      likes_count: post.post_likes?.length || 0,
      comments_count: post.post_comments?.length || 0,
      isLiked: currentUserProfileId ? post.post_likes?.some((like: any) => like.user_id === currentUserProfileId) : false,
      author: {
        ...post.user_profiles,
        friends_count: post.user_profiles?.friends_count || 0
      }
    })) || [];

    console.log('✅ Processed posts:', processedPosts);
    return { data: processedPosts, error: null };
  } catch (error) {
    console.error('❌ Unexpected error in getUserPosts:', error);
    return { data: [], error: error instanceof Error ? error : new Error('Unknown error') };
  }
} 