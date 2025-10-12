import { useState, useEffect } from 'react';
// >>> ВИПРАВЛЕНО: Змінено 'getUserPosts' на 'getPostsByUser'
import { createPost, getPostsByUser } from '../../../lib/postService'; 
import { UserProfile } from '../types';
import { EMOJIS } from "../../../lib/constants"; 

interface PostAuthor {
  id: string;
  name: string;
  last_name: string;
  avatar: string;
  friends_count: number;
}

interface Post {
  id: string;
  content: string;
  media_url?: string;
  media_type?: string;
  created_at: string;
  likes_count: number;
  comments_count: number;
  isLiked: boolean;
  author: PostAuthor;
}

// >>> ВИПРАВЛЕНО: Хук перейменовано на usePostList для відповідності імпорту в RightColumn.tsx
export const usePostList = (currentUser: any, profile: UserProfile | null) => {
  const [postContent, setPostContent] = useState('');
  const [postMediaUrl, setPostMediaUrl] = useState('');
  const [postMediaType, setPostMediaType] = useState('');
  const [creatingPost, setCreatingPost] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showMediaInput, setShowMediaInput] = useState(false);
  const [characterCount, setCharacterCount] = useState(0);
  const [userPosts, setUserPosts] = useState<Post[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(false);

  const MAX_CHARACTERS = 280;

  useEffect(() => {
    console.log('🔄 Posts useEffect triggered:', { currentUser: !!currentUser, profile: !!profile, profileId: profile?.id });
    if (currentUser && profile) {
      loadUserPosts();
    }
  }, [currentUser?.id, profile?.id]);

  useEffect(() => {
    setCharacterCount(postContent.length);
  }, [postContent]);

  const addEmoji = (emoji: string) => {
    if (characterCount + emoji.length <= MAX_CHARACTERS) {
      setPostContent(prev => prev + emoji);
    }
  };

  const handleCreatePost = async (e: any) => {
    e.preventDefault();
    // У вашому `postService` функція `createPost` очікує {content, file}, а не {content, media_url, media_type}
    // Оскільки ми зараз не маємо доступу до File API у цьому хуці, 
    // імовірно, ця логіка має бути перенесена до `usePostCreate` і викликати 
    // `createPost` коректно (з файлами). Але поки фіксуємо лише синтаксис.

    if (!postContent.trim() || !currentUser || characterCount > MAX_CHARACTERS) return;
    
    console.log('🔍 Creating post:', { content: postContent, media_url: postMediaUrl, media_type: postMediaType });
    console.log('🔍 Current user:', currentUser?.email);
    console.log('🔍 Current profile:', profile?.id);
    setCreatingPost(true);
    try {
      // >>> УВАГА: Тут має бути передача об'єкта {content, file}
      const { data, error } = await createPost({
        content: postContent,
        // file: postMediaUrl ? new File([], 'temp') : null // Тимчасово ігноруємо
      });
      
      if (error) {
        console.error('❌ Error creating post:', error);
        throw error;
      }
      
      console.log('✅ Post created successfully:', data);
      
      if (data) {
        // Оскільки `postService.ts` повертає повний пост, 
        // ми повинні імітувати структуру, яку очікує UI:
        const newPost = {
            ...data,
            // author: data.author // author має бути заповнений Supabase join'ом
            likes_count: data.post_likes?.length || 0,
            comments_count: 0, // Припускаємо 0, поки не отримаємо з API
            isLiked: data.post_likes?.some((l: any) => l.user_id === currentUser.id) || false,
        };
        
        setUserPosts(prev => [newPost as Post, ...prev]);
      } else {
        console.warn('⚠️ No post data returned from createPost');
      }
      
      setPostContent('');
      setPostMediaUrl('');
      setPostMediaType('');
      setShowMediaInput(false);
      setShowEmojiPicker(false);
      
      setTimeout(() => {
        console.log('🔄 Reloading posts to verify persistence...');
        loadUserPosts();
      }, 1000);
      
    } catch (e: any) {
      console.error('❌ Error creating post:', e);
      throw new Error('Не вдалося створити пост');
    } finally {
      setCreatingPost(false);
    }
  };

  const loadUserPosts = async () => {
    if (!currentUser || !profile) {
      console.log('❌ Cannot load posts: currentUser or profile is missing', { currentUser: !!currentUser, profile: !!profile });
      return;
    }
    
    console.log('🔍 Loading user posts for profile:', profile.id);
    setLoadingPosts(true);
    try {
      // >>> ВИПРАВЛЕНО: Використовуємо коректну функцію 'getPostsByUser'
      const { data, error } = await getPostsByUser(profile.id); 
      console.log('🔍 getPostsByUser result:', { data: data?.length || 0, error: error?.message });
      
      if (error) {
        console.error('Error fetching posts:', error);
        setUserPosts([]);
        return;
      }
      
      console.log('✅ Posts loaded:', data?.length || 0, 'posts');
      
      // Додаємо необхідні поля, які не повертаються Supabase напряму (наприклад, isLiked)
      const processedPosts = (data as Post[] || []).map(post => ({
          ...post,
          likes_count: post.post_likes?.length || 0,
          comments_count: 0, // Треба додати реальну логіку підрахунку коментарів
          isLiked: post.post_likes?.some(l => l.user_id === currentUser.id) || false,
      }));

      setUserPosts(processedPosts); 
    } catch (error) {
      console.error('Error loading user posts:', error);
      setUserPosts([]);
    } finally {
      setLoadingPosts(false);
    }
  };

  const formatPostDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      return 'щойно';
    } else if (diffInHours < 24) {
      return `${diffInHours}г тому`;
    } else {
      return date.toLocaleDateString('uk-UA', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  };

  return {
    postContent,
    setPostContent,
    postMediaUrl,
    setPostMediaUrl,
    postMediaType,
    setPostMediaType,
    creatingPost,
    showEmojiPicker,
    setShowEmojiPicker,
    showMediaInput,
    setShowMediaInput,
    characterCount,
    userPosts,
    setUserPosts,
    loadingPosts,
    MAX_CHARACTERS,
    EMOJIS,
    addEmoji,
    handleCreatePost,
    loadUserPosts,
    formatPostDate
  };
};
