import { supabase } from './supabase';

export async function uploadMediaFile({
  file,
  type,
  description = '',
  is_public = false,
  album_id = null
}: {
  file: File,
  type: 'photo' | 'video',
  description?: string,
  is_public?: boolean,
  album_id?: string | null
}) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Не авторизовано');
  const fileExt = file.name.split('.').pop();
  const filePath = `${user.id}/${Date.now()}.${fileExt}`;
  const { error: uploadError } = await supabase.storage.from('media').upload(filePath, file, {
    upsert: true,
    contentType: file.type,
  });
  if (uploadError) throw uploadError;
  const { data } = supabase.storage.from('media').getPublicUrl(filePath);
  const url = data.publicUrl;
  const original_name = file.name;
  const size = file.size;
  // Для фото thumbnail_url = url, для відео можна додати окрему генерацію прев'ю
  const thumbnail_url = type === 'photo' ? url : null;
  const { data: inserted, error: dbError } = await supabase.from('media').insert([{
    user_id: user.id,
    url,
    type,
    description,
    original_name,
    size,
    is_public,
    album_id,
    thumbnail_url,
  }]).select().single();
  if (dbError) throw dbError;
  return inserted;
}

export async function getUserMedia(user_id: string, type?: 'photo' | 'video') {
  let query = supabase.from('media').select('*').eq('user_id', user_id);
  if (type) query = query.eq('type', type);
  const { data, error } = await query.order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

// Видалення медіа (з БД і з Supabase Storage)
export async function deleteMedia(mediaId: string, filePath: string) {
  // Видалити з Storage
  const { error: storageError } = await supabase.storage.from('media').remove([filePath]);
  if (storageError) throw storageError;
  // Видалити з БД
  const { error: dbError } = await supabase.from('media').delete().eq('id', mediaId);
  if (dbError) throw dbError;
  return true;
}

// Оновлення опису медіа
export async function updateMediaDescription(mediaId: string, description: string) {
  const { error } = await supabase.from('media').update({ description }).eq('id', mediaId);
  if (error) throw error;
  return true;
} 