import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Sidebar } from '../components/Sidebar';

interface MediaItem {
  type: 'image' | 'video' | 'audio';
  url: string;
}

interface Post {
  id: string;
  user_id: string;
  content: string;
  media: MediaItem[];
  created_at: string;
  user?: {
    name: string;
    lastname?: string;
    avatar?: string;
  };
}

export default function Wall() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [content, setContent] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    const { data, error } = await supabase
      .from('posts')
      .select('*, user:users(id, name, lastname, avatar)')
      .order('created_at', { ascending: false });
    if (error) setError('Помилка завантаження постів');
    else setPosts(data || []);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  };

  const removeFile = (idx: number) => {
    setFiles(files.filter((_, i) => i !== idx));
  };

  const handlePublish = async () => {
    if (!content.trim() && files.length === 0) return;
    setUploading(true);
    setError(null);
    try {
      // Upload files to storage and collect media info
      const media: MediaItem[] = [];
      for (const file of files) {
        const ext = file.name.split('.').pop();
        let type: MediaItem['type'] = 'image';
        if (file.type.startsWith('video')) type = 'video';
        if (file.type.startsWith('audio')) type = 'audio';
        const fileName = `post_${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
        const { error: uploadError } = await supabase.storage.from('post-media').upload(fileName, file);
        if (uploadError) throw uploadError;
        const { data: publicUrlData } = supabase.storage.from('post-media').getPublicUrl(fileName);
        media.push({ type, url: publicUrlData.publicUrl });
      }
      // Insert post
      const { error: postError } = await supabase.from('posts').insert([
        {
          content,
          media,
          created_at: new Date().toISOString(),
        },
      ]);
      if (postError) throw postError;
      setContent('');
      setFiles([]);
      fetchPosts();
    } catch (e: any) {
      setError('Помилка публікації поста');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <div style={{zIndex: 50, background: '#fff', borderRight: '1px solid #e5e7eb', minHeight: '100vh', width: '16rem', position: 'fixed', left: 0, top: 0}}>
        <Sidebar />
      </div>
      <div className="flex-1 ml-64 p-8">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold mb-4">Стіна</h2>
          <div className="bg-white rounded-lg shadow p-4 mb-8">
            <textarea
              className="w-full border rounded p-2 mb-2"
              rows={2}
              placeholder="Що нового?"
              value={content}
              onChange={e => setContent(e.target.value)}
              disabled={uploading}
            />
            <input
              type="file"
              multiple
              accept="image/*,video/*,audio/*"
              onChange={handleFileChange}
              disabled={uploading}
              className="mb-2"
            />
            <div className="flex flex-wrap gap-2 mb-2">
              {files.map((file, idx) => (
                <div key={idx} className="relative">
                  {file.type.startsWith('image') && (
                    <img src={URL.createObjectURL(file)} alt="preview" className="w-20 h-20 object-cover rounded" />
                  )}
                  {file.type.startsWith('video') && (
                    <video src={URL.createObjectURL(file)} className="w-20 h-20 object-cover rounded" controls />
                  )}
                  {file.type.startsWith('audio') && (
                    <audio src={URL.createObjectURL(file)} controls className="w-20" />
                  )}
                  <button type="button" onClick={() => removeFile(idx)} className="absolute top-0 right-0 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center">×</button>
                </div>
              ))}
            </div>
            <button
              className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
              onClick={handlePublish}
              disabled={uploading}
            >
              {uploading ? 'Публікуємо...' : 'Опублікувати'}
            </button>
            {error && <div className="text-red-500 mt-2">{error}</div>}
          </div>
          <div>
            {posts.length === 0 ? (
              <div className="text-center text-gray-500">Постів ще немає</div>
            ) : (
              posts.map(post => (
                <div key={post.id} className="bg-white rounded-lg shadow p-4 mb-6">
                  <div className="flex items-center mb-2">
                    <div className="w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold mr-3 overflow-hidden">
                      {post.user?.avatar ? (
                        <img src={post.user.avatar} alt="avatar" className="w-full h-full object-cover" />
                      ) : (
                        <span>{post.user?.name?.[0]?.toUpperCase()}</span>
                      )}
                    </div>
                    <div>
                      <div className="font-semibold">{post.user?.name} {post.user?.lastname}</div>
                      <div className="text-xs text-gray-400">{new Date(post.created_at).toLocaleDateString('uk-UA', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
                    </div>
                  </div>
                  <div className="mb-2 whitespace-pre-line">{post.content}</div>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {post.media?.map((media, idx) => (
                      <div key={idx}>
                        {media.type === 'image' && <img src={media.url} alt="media" className="max-w-xs max-h-60 rounded" />}
                        {media.type === 'video' && <video src={media.url} controls className="max-w-xs max-h-60 rounded" />}
                        {media.type === 'audio' && <audio src={media.url} controls className="w-60" />}
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 