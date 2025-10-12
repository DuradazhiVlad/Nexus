import { supabase } from './supabase';

export interface ProfileStats {
  friendsCount: number;
  photosCount: number;
  videosCount: number;
  musicCount: number;
  postsCount: number;
}

export const getProfileStats = async (profileId: string): Promise<ProfileStats> => {
  try {
    // Отримуємо кількість постів
    const { count: postsCount, error: postsError } = await supabase
      .from('posts')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', profileId);

    if (postsError) {
      console.error('Error fetching posts count:', postsError);
    }

    // Отримуємо кількість фото з постів
    const { count: photosCount, error: photosError } = await supabase
      .from('posts')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', profileId)
      .eq('media_type', 'photo');

    if (photosError) {
      console.error('Error fetching photos count:', photosError);
    }

    // Отримуємо кількість відео з постів
    const { count: videosCount, error: videosError } = await supabase
      .from('posts')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', profileId)
      .eq('media_type', 'video');

    if (videosError) {
      console.error('Error fetching videos count:', videosError);
    }

    // Отримуємо кількість музики/документів з постів
    const { count: musicCount, error: musicError } = await supabase
      .from('posts')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', profileId)
      .eq('media_type', 'document');

    if (musicError) {
      console.error('Error fetching music count:', musicError);
    }

    // Підраховуємо кількість друзів
    const { count: friendsCount, error: friendsError } = await supabase
      .from('friendships')
      .select('*', { count: 'exact', head: true })
      .or(`user1_id.eq.${profileId},user2_id.eq.${profileId}`);

    if (friendsError) {
      console.error('Error fetching friends count:', friendsError);
    }

    return {
      friendsCount: friendsCount || 0,
      photosCount: photosCount || 0,
      videosCount: videosCount || 0,
      musicCount: musicCount || 0,
      postsCount: postsCount || 0,
    };
  } catch (error) {
    console.error('Error fetching profile stats:', error);
    return {
      friendsCount: 0,
      photosCount: 0,
      videosCount: 0,
      musicCount: 0,
      postsCount: 0,
    };
  }
};
