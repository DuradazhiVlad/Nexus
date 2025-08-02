import { supabase } from './supabase';

export async function getAllPosts() {
  const { data: { user } } = await supabase.auth.getUser();
  
  let query = supabase
    .from('posts')
    .select(`
      *,
      post_likes (id, user_id),
      post_comments (id)
    `)
    .order('created_at', { ascending: false });

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching posts:', error);
    return { data: null, error };
  }

  // Обробляємо дані щоб додати кількість лайків, коментарів та перевірку лайку
  const processedPosts = await Promise.all(
    data?.map(async (post) => {
      // Отримуємо інформацію про користувача
      const { data: userProfile } = await supabase
        .from('user_profiles')
        .select('id, name, last_name, avatar')
        .eq('id', post.user_id)
        .single();

      return {
        ...post,
        likes_count: post.post_likes?.length || 0,
        comments_count: post.post_comments?.length || 0,
        isLiked: user ? post.post_likes?.some((like: any) => {
          // Перевіряємо чи лайк належить поточному користувачу
          return like.user_id === userProfile?.id;
        }) : false,
        author: {
          id: post.user_id,
          name: userProfile?.name || 'Користувач',
          last_name: userProfile?.last_name || '',
          avatar: userProfile?.avatar || null,
          friends_count: 0
        }
      };
    }) || []
  );

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
  console.log('🔍 Getting comments for post:', post_id);
  
  const { data, error } = await supabase
    .from('post_comments')
    .select('*')
    .eq('post_id', post_id)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('❌ Error fetching comments:', error);
    return { data: null, error };
  }

  // Додаємо інформацію про користувачів для кожного коментаря
  const commentsWithUsers = await Promise.all(
    data?.map(async (comment) => {
      const { data: userProfile } = await supabase
        .from('user_profiles')
        .select('id, name, last_name, avatar')
        .eq('id', comment.user_id)
        .single();

      return {
        ...comment,
        user_profiles: userProfile || {
          id: comment.user_id,
          name: 'Користувач',
          last_name: '',
          avatar: null
        }
      };
    }) || []
  );

  console.log('✅ Comments fetched:', commentsWithUsers);
  return { data: commentsWithUsers, error: null };
}

export async function addCommentToPost(post_id: string, content: string) {
  console.log('🔍 Adding comment to post:', post_id, 'Content:', content);
  
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
    console.error('❌ Profile error:', profileError);
    throw new Error('User profile not found');
  }

  console.log('✅ User profile found:', profile.id);

  // Перевіряємо, чи існує пост
  const { data: post, error: postError } = await supabase
    .from('posts')
    .select('id')
    .eq('id', post_id)
    .single();

  if (postError || !post) {
    console.error('❌ Post not found:', postError);
    throw new Error('Post not found');
  }

  console.log('✅ Post found:', post.id);

  const commentData = {
    post_id,
    user_id: profile.id,
    content: content.trim()
  };

  console.log('📝 Inserting comment data:', commentData);

  const result = await supabase
    .from('post_comments')
    .insert([commentData])
    .select('*');

  console.log('✅ Comment creation result:', result);
  return result;
}

export async function updatePost(post_id: string, updates: { content?: string; media_url?: string; media_type?: string }) {
  return supabase
    .from('posts')
    .update(updates)
    .eq('id', post_id);
}

export async function deletePost(post_id: string) {
  console.log('🔍 Deleting post:', post_id);
  
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
    console.error('❌ Profile error:', profileError);
    throw new Error('User profile not found');
  }

  console.log('✅ User profile found:', profile.id);

  // Перевіряємо чи користувач є автором поста
  const { data: post, error: postError } = await supabase
    .from('posts')
    .select('user_id')
    .eq('id', post_id)
    .single();

  if (postError || !post) {
    console.error('❌ Post not found:', postError);
    throw new Error('Post not found');
  }

  if (post.user_id !== profile.id) {
    console.error('❌ User not authorized to delete this post');
    throw new Error('You can only delete your own posts');
  }

  console.log('✅ User authorized to delete post');

  // Спочатку видаляємо лайки та коментарі
  console.log('🗑️ Deleting likes and comments...');
  await supabase.from('post_likes').delete().eq('post_id', post_id);
  await supabase.from('post_comments').delete().eq('post_id', post_id);

  // Потім видаляємо сам пост
  const result = await supabase
    .from('posts')
    .delete()
    .eq('id', post_id);

  console.log('✅ Post deletion result:', result);
  return result;
}

// New function for sharing posts
export async function sharePostToChat(post_id: string, targetUserId: string) {
  console.log('🔍 Sharing post:', post_id, 'to user:', targetUserId);
  
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

  // Get the post data
  const { data: post, error: postError } = await supabase
    .from('posts')
    .select('*')
    .eq('id', post_id)
    .single();

  if (postError || !post) {
    throw new Error('Post not found');
  }

  // Find or create conversation between current user and target user
  let conversationId: string;
  
  // First, try to find existing conversation
  const { data: existingConversation, error: convError } = await supabase
    .from('conversations')
    .select('id')
    .or(`and(participant1_id.eq.${profile.id},participant2_id.eq.${targetUserId}),and(participant1_id.eq.${targetUserId},participant2_id.eq.${profile.id})`)
    .single();

  if (existingConversation) {
    conversationId = existingConversation.id;
  } else {
    // Create new conversation
    const { data: newConversation, error: createError } = await supabase
      .from('conversations')
      .insert([{
        participant1_id: profile.id,
        participant2_id: targetUserId
      }])
      .select('id')
      .single();

    if (createError || !newConversation) {
      throw new Error('Failed to create conversation');
    }
    
    conversationId = newConversation.id;
  }

  // Create a message with the shared post
  const messageData = {
    conversation_id: conversationId,
    sender_id: profile.id,
    content: `Переслано: ${post.content}`,
    is_read: false
  };

  // Insert into messages table
  const result = await supabase
    .from('messages')
    .insert([messageData])
    .select('*');

  console.log('✅ Share result:', result);
  return result;
}

export async function getUserPosts(userProfileId: string) {
  console.log('🔍 Getting user posts for profile ID:', userProfileId);
  
  if (!userProfileId) {
    console.error('❌ No userProfileId provided');
    return { data: [], error: new Error('No userProfileId provided') };
  }
  
  const { data: { user } } = await supabase.auth.getUser();
  
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
    
    // Get the auth_user_id for this profile
    const authUserId = profileCheck.auth_user_id;
    
    // Now fetch posts for this user using profile ID
    const { data, error } = await supabase
      .from('posts')
      .select(`
        *,
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
    console.log('✅ Number of posts found:', data?.length || 0);

    // Обробляємо дані щоб додати кількість лайків, коментарів та перевірку лайку
    const processedPosts = data?.map(post => ({
      ...post,
      likes_count: post.post_likes?.length || 0,
      comments_count: post.post_comments?.length || 0,
      isLiked: user ? post.post_likes?.some((like: any) => like.user_id === user.id) : false,
      author: {
        id: post.user_id,
        name: profileCheck.name || 'Користувач',
        last_name: profileCheck.last_name || '',
        avatar: profileCheck.avatar,
        friends_count: 0
      }
    })) || [];

    console.log('✅ Processed posts:', processedPosts);
    console.log('✅ Number of processed posts:', processedPosts.length);
    
    return { data: processedPosts, error: null };
  } catch (error) {
    console.error('❌ Unexpected error in getUserPosts:', error);
    return { data: [], error: error instanceof Error ? error : new Error('Unknown error') };
  }
} 