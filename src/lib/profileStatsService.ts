
// src/lib/profileStatsService.ts
import { supabase } from './supabase';

export type MediaItem = {
  id: string;
  url: string;
  created_at: string;
};

export type ProfileStats = {
  friendsCount: number;
  photosCount: number;
  videosCount: number;
  musicCount: number;
  photos: MediaItem[];
  videos: MediaItem[];
  music: MediaItem[];
};

export const getProfileStats = async (profileId: string): Promise<ProfileStats> => {
  // 1️⃣ Друзі
  const { data: friendsData, error: friendsError } = await supabase
    .from('friends')
    .select('*')
    .eq('user_id', profileId);
  if (friendsError) console.error('Error fetching friends:', friendsError);
  const friendsCount = friendsData?.length || 0;

  // 2️⃣ Фото
  const { data: photosData, error: photosError } = await supabase
    .from('post_photos')
    .select('id,url,created_at,post:user_id')
    .eq('post.user_id', profileId)
    .order('created_at', { ascending: false });
  if (photosError) console.error('Error fetching photos:', photosError);
  const photosCount = photosData?.length || 0;

  // 3️⃣ Відео
  const { data: videosData, error: videosError } = await supabase
    .from('post_videos')
    .select('id,url,created_at,post:user_id')
    .eq('post.user_id', profileId)
    .order('created_at', { ascending: false });
  if (videosError) console.error('Error fetching videos:', videosError);
  const videosCount = videosData?.length || 0;

  // 4️⃣ Музика
  const { data: musicData, error: musicError } = await supabase
    .from('post_audio')
    .select('id,url,created_at,post:user_id')
    .eq('post.user_id', profileId)
    .order('created_at', { ascending: false });
  if (musicError) console.error('Error fetching music:', musicError);
  const musicCount = musicData?.length || 0;

  return {
    friendsCount,
    photosCount,
    videosCount,
    musicCount,
    photos: photosData || [],
    videos: videosData || [],
    music: musicData || [],
  };
};
