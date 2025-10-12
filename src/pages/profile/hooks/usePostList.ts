import { useState, useEffect, useCallback } from 'react';
import { getUserPosts } from '../../../lib/postService';
import { Post, PostAuthor } from '../types'; // Припускаємо, що Post та PostAuthor знаходяться у цьому файлі або імпортуються з types

// Оголошення типів (якщо вони не винесені в окремий файл types)
interface SimplifiedPostAuthor {
  id: string;
  name: string;
  last_name: string;
  avatar: string;
}

interface SimplifiedPost {
  id: string;
  content: string;
  media_url?: string;
  media_type?: string;
  created_at: string;
  likes_count: number;
  comments_count: number;
  isLiked: boolean;
  author: SimplifiedPostAuthor;
}
// Кінець оголошення типів

/**
 * Хук для завантаження списку постів певного користувача.
 * @param profileId ID профілю, для якого потрібно завантажити пости.
 */
export const usePostList = (profileId?: string) => {
  const [posts, setPosts] = useState<SimplifiedPost[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const loadUserPosts = useCallback(async () => {
    if (!profileId) {
      console.log('❌ Cannot load posts: profileId is missing');
      setPosts([]);
      return;
    }
    
    console.log('🔍 Loading user posts for profile:', profileId);
    setLoading(true);
    setError(null);

    try {
      // Припускаємо, що getUserPosts повертає { data: SimplifiedPost[], error: Error }
      const { data, error: fetchError } = await getUserPosts(profileId);
      
      if (fetchError) {
        console.error('Error fetching posts:', fetchError);
        setError(new Error(fetchError.message || 'Не вдалося завантажити пости'));
        setPosts([]);
        return;
      }
      
      console.log('✅ Posts loaded:', data?.length || 0, 'posts');
      setPosts(data as SimplifiedPost[] || []); 
    } catch (e) {
      const loadError = e instanceof Error ? e : new Error('Невідома помилка завантаження постів');
      console.error('Error loading user posts:', loadError);
      setError(loadError);
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }, [profileId]);

  useEffect(() => {
    // Автоматичне завантаження при зміні profileId
    if (profileId) {
      loadUserPosts();
    }
  }, [profileId, loadUserPosts]);

  const refreshPosts = () => {
    loadUserPosts();
  };

  return {
    posts,
    loading,
    error,
    refreshPosts,
  };
};
