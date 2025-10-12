import React, { useState, useEffect, useRef } from 'react';
import { Sidebar } from '../../components/Sidebar';
import { WallPostCard } from '../../components/WallPostCard';
import { getPostsByUser, createPost } from '../../lib/postService';
import { supabase } from '../../lib/supabase';
import type { User } from '@supabase/supabase-js';

interface Post {
  id: string;
  user_id: string;
  content: string;
  photos: string[];
  videos: string[];
  audio: string[];
  created_at: string;
  likes_count: number;
  comments_count: number;
  author: {
    id: string;
    name: string;
    last_name: string;
    avatar?: string;
    friends_count?: number;
  };
  isLiked?: boolean;
}

export function Wall() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [content, setContent] = useState('');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [photos, setPhotos] = useState<File[]>([]);
  const [videos, setVideos] = useState<File[]>([]);
  const [audios, setAudios] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);

  const photoInputRef = useRef<HTMLInputElement | null>(null);
  const videoInputRef = useRef<HTMLInputElement | null>(null);
  const audioInputRef = useRef<HTMLInputElement | null>(null);

  // Завантаження користувача
  useEffect(() => {
    const fetchCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);
    };
    fetchCurrentUser();
  }, []);

  // Завантаження постів після отримання користувача
  useEffect(() => {
    if (currentUser) fetchPosts();
  }, [currentUser]);

  const fetchPosts = async () => {
    if (!currentUser) return;
    setLoading(true);
    setError('');
    try {
      const data = await getPostsByUser(currentUser.id);
      setPosts(data);
    } catch (err) {
      console.error(err);
      setError('Не вдалося завантажити пости');
    } finally {
      setLoading(false);
    }
  };

  const uploadFile = async (file: File, userId: string, type: 'photo' | 'video' | 'audio') => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `posts/${userId}/${fileName}`;

    const { error: uploadError } = await supabase.storage.from('media').upload(filePath, file);
    if (uploadError) throw uploadError;

    const { data, error: urlError } = supabase.storage.from('media').getPublicUrl(filePath);
    if (urlError) throw urlError;
    if (!data?.publicUrl) throw new Error('Не вдалося отримати публічний URL файлу');

    return data.publicUrl;
  };

  const handleFilesChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'photo' | 'video' | 'audio') => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files);
    if (type === 'photo') setPhotos(files);
    if (type === 'video') setVideos(files);
    if (type === 'audio') setAudios(files);
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || !currentUser) return;

    setUploading(true);
    setError('');
    try {
      // Завантаження медіа паралельно
      const mediaUrls = {
        photos: await Promise.all(photos.map(f => uploadFile(f, currentUser.id, 'photo'))),
        videos: await Promise.all(videos.map(f => uploadFile(f, currentUser.id, 'video'))),
        audio: await Promise.all(audios.map(f => uploadFile(f, currentUser.id, 'audio'))),
      };

      const success = await createPost({
        user_id: currentUser.id,
        content,
        media: mediaUrls,
      });

      if (!success) throw new Error('Помилка створення поста');

      // Очищення форми
      setContent('');
      setPhotos([]);
      setVideos([]);
      setAudios([]);
      if (photoInputRef.current) photoInputRef.current.value = '';
      if (videoInputRef.current) videoInputRef.current.value = '';
      if (audioInputRef.current) audioInputRef.current.value = '';

      fetchPosts();
    } catch (err) {
      console.error(err);
      setError('Не вдалося створити пост');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 lg:ml-64 p-6">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Стрічка</h1>

          {error && <div className="mb-4 text-red-600">{error}</div>}

          <form onSubmit={handleCreatePost} className="bg-white p-4 rounded-lg shadow-md mb-6">
            <textarea
              placeholder="Що у вас нового?"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full border border-gray-300 rounded p-2 mb-2 resize-none"
              rows={3}
            />

            <div className="flex gap-2 mb-2">
              <input ref={photoInputRef} type="file" multiple accept="image/*" onChange={(e) => handleFilesChange(e, 'photo')} />
              <input ref={videoInputRef} type="file" multiple accept="video/*" onChange={(e) => handleFilesChange(e, 'video')} />
              <input ref={audioInputRef} type="file" multiple accept="audio/*" onChange={(e) => handleFilesChange(e, 'audio')} />
            </div>

            <button
              type="submit"
              disabled={uploading}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
            >
              {uploading ? 'Створюємо...' : 'Опублікувати'}
            </button>
          </form>

          {loading ? (
            <div>Завантаження...</div>
          ) : posts.length === 0 ? (
            <div className="text-center text-gray-500 py-10">Пости відсутні</div>
          ) : (
            posts.map((post) => (
              <WallPostCard key={post.id} post={post} />
            ))
          )}
        </div>
      </main>
    </div>
  );
}
