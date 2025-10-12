import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';

export const useUserPosts = (profileId: string | undefined) => {
  const [userPosts, setUserPosts] = useState<any[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [errorPosts, setErrorPosts] = useState<string | null>(null); // Додано стан для помилок

  const loadUserPosts = async () => {
    if (!profileId) return;
    setLoadingPosts(true);
    setErrorPosts(null); // Скидаємо помилки перед новим завантаженням
    try {
      const { data, error } = await supabase
        .from('posts')
        .select('*, user_profiles(name, last_name, avatar)')
        .eq('user_id', profileId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUserPosts(data || []);
    } catch (error: any) {
      console.error('Error loading user posts:', error.message);
      setErrorPosts(error.message); // Встановлюємо помилку
    } finally {
      setLoadingPosts(false);
    }
  };

  useEffect(() => {
    if (profileId) {
      loadUserPosts();
    }
  }, [profileId]);

  return { userPosts, loadingPosts, setUserPosts, loadUserPosts, errorPosts }; // Повертаємо errorPosts
};