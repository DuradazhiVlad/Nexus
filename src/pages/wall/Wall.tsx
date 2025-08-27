import React, { useState, useEffect, useRef } from 'react';
import { Sidebar } from '../../components/Sidebar';
import { WallPostCard } from '../../components/WallPostCard';
import { useLocation } from 'react-router-dom';
import { getAllPosts, createPost, likePost, unlikePost } from '../../lib/postService';
import { supabase } from '../../lib/supabase';
import { 
  Image as ImageIcon, 
  Video, 
  FileText, 
  Smile, 
  Send,
  Upload
} from 'lucide-react';

interface Post {
  id: string;
  user_id: string;
  content: string;
  media_url?: string;
  media_type?: string;
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



const EMOJIS = ['😊', '😂', '❤️', '👍', '🎉', '🔥', '😍', '🤔', '😭', '😎', '🥳', '💪', '✨', '🌟', '💯'];

export function Wall() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [content, setContent] = useState('');
  const [mediaUrl, setMediaUrl] = useState('');
  const [mediaType, setMediaType] = useState('');
  const [creating, setCreating] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showMediaInput, setShowMediaInput] = useState(false);
  const [characterCount, setCharacterCount] = useState(0);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const fileInputRef = useRef(null);
  const location = useLocation();

  const MAX_CHARACTERS = 280; // Twitter-style character limit

  useEffect(() => {
    fetchCurrentUser();
    fetchPosts();
  }, []);

  useEffect(() => {
    setCharacterCount(content.length);
  }, [content]);

  const fetchCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setCurrentUser(user);
  };

  const fetchPosts = async () => {
    setLoading(true);
    setError('');
    try {
      const { data, error } = await getAllPosts();
      if (error) throw error;
      setPosts(data || []);
    } catch (e: any) {
      setError('Не вдалося завантажити пости');
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || !currentUser || characterCount > MAX_CHARACTERS) return;
    setCreating(true);
    try {
      const { error } = await createPost({
        content,
        media_url: mediaUrl || undefined,
        media_type: mediaType || undefined,
      });
      if (error) throw error;
      setContent('');
      setMediaUrl('');
      setMediaType('');
      setMediaPreview(null);
      setShowMediaInput(false);
      setShowEmojiPicker(false);
      fetchPosts();
    } catch (e: any) {
      setError('Не вдалося створити пост');
    } finally {
      setCreating(false);
    }
  };

  const addEmoji = (emoji: string) => {
    if (characterCount + emoji.length <= MAX_CHARACTERS) {
      setContent(prev => prev + emoji);
    }
  };





  const formatDate = (dateString: string) => {
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

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Перевірка розміру файлу (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Файл занадто великий. Максимальний розмір: 5MB');
      return;
    }

    // Перевірка типу файлу
    if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
      setError('Будь ласка, виберіть зображення або відео');
      return;
    }

    setUploadingMedia(true);
    setError('');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Не авторизовано');

      // Генеруємо унікальне ім'я файлу
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `posts/${user.id}/${fileName}`;

      // Завантажуємо файл в Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('media')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Отримуємо публічний URL
      const { data: { publicUrl } } = supabase.storage
        .from('media')
        .getPublicUrl(filePath);

      // Встановлюємо тип медіа
      const mediaType = file.type.startsWith('video/') ? 'video' : 'photo';

      setMediaUrl(publicUrl);
      setMediaType(mediaType);
      setShowMediaInput(true);

      // Показуємо превью
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          setMediaPreview(e.target?.result as string);
        };
        reader.readAsDataURL(file);
      }

    } catch (error) {
      console.error('Error uploading file:', error);
      setError('Помилка завантаження файлу');
    } finally {
      setUploadingMedia(false);
    }
  };

  const removeMedia = () => {
    setMediaUrl('');
    setMediaType('');
    setMediaPreview(null);
    setShowMediaInput(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 ml-64 p-6">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Стрічка</h1>
          
          {/* Створення поста */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
            <div className="flex items-start space-x-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                {currentUser?.email?.charAt(0).toUpperCase() || 'U'}
              </div>
              
              <div className="flex-1">
                <form onSubmit={handleCreatePost}>
                  <textarea
                    className="w-full border-0 resize-none text-lg placeholder-gray-500 focus:outline-none focus:ring-0"
                    placeholder="Що нового?"
                    value={content}
                    onChange={e => setContent(e.target.value)}
                    rows={3}
                    maxLength={MAX_CHARACTERS}
                  />
                  
                  {/* Media preview */}
                  {mediaPreview && (
                    <div className="mt-3 relative">
                      <img 
                        src={mediaPreview} 
                        alt="Preview" 
                        className="max-h-48 rounded-lg object-cover"
                      />
                      <button
                        type="button"
                        onClick={removeMedia}
                        className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  )}
                  
                  {/* Character count */}
                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                        className="p-2 text-gray-500 hover:text-blue-500 hover:bg-blue-50 rounded-full transition-colors"
                      >
                        <Smile size={20} />
                      </button>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploadingMedia}
                        className="p-2 text-gray-500 hover:text-green-500 hover:bg-green-50 rounded-full transition-colors disabled:opacity-50"
                      >
                        {uploadingMedia ? (
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-green-500"></div>
                        ) : (
                          <Upload size={20} />
                        )}
                      </button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*,video/*"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <span className={`text-sm ${characterCount > MAX_CHARACTERS ? 'text-red-500' : 'text-gray-500'}`}>
                        {characterCount}/{MAX_CHARACTERS}
                      </span>
                      <button
                        type="submit"
                        disabled={creating || !content.trim() || characterCount > MAX_CHARACTERS}
                        className="px-6 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
                      >
                        {creating ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        ) : (
                          <Send size={16} className="mr-2" />
                        )}
                        {creating ? 'Створення...' : 'Опублікувати'}
                      </button>
                    </div>
                  </div>
                </form>
                
                {/* Emoji picker */}
                {showEmojiPicker && (
                  <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                    <div className="grid grid-cols-8 gap-2">
                      {EMOJIS.map((emoji, index) => (
                        <button
                          key={index}
                          onClick={() => addEmoji(emoji)}
                          className="text-2xl hover:bg-white rounded p-1 transition-colors"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Media input */}
                {showMediaInput && !mediaPreview && (
                  <div className="mt-3 space-y-3">
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Посилання на медіа (необов'язково)"
                      value={mediaUrl}
                      onChange={e => setMediaUrl(e.target.value)}
                    />
                    <select
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={mediaType}
                      onChange={e => setMediaType(e.target.value)}
                    >
                      <option value="">Тип медіа</option>
                      <option value="photo">Фото</option>
                      <option value="video">Відео</option>
                      <option value="document">Документ</option>
                    </select>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Error message */}
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Відображення постів */}
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Завантаження постів...</p>
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageCircle className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Поки що немає постів</h3>
              <p className="text-gray-600">Будьте першим, хто поділиться своїми думками!</p>
            </div>
          ) : (
            <div className="space-y-6">
              {posts.map(post => {
                const wallPostCardProps = {
                  post: {
                    id: post.id,
                    content: post.content,
                    media_url: post.media_url,
                    media_type: post.media_type,
                    created_at: post.created_at,
                    likes_count: post.likes_count || 0,
                    comments_count: post.comments_count || 0,
                    isLiked: post.isLiked || false,
                    author: {
                      id: post.author?.id || '',
                      name: post.author?.name || '',
                      last_name: post.author?.last_name || '',
                      avatar: post.author?.avatar || '',
                      friends_count: post.author?.friends_count || 0
                    }
                  },
                  currentUserId: currentUser?.id || '',
                  currentUserProfileId: currentUser?.id, // Тут потрібно передати profile ID
                  onDelete: (postId: string) => {
                    setPosts(prev => prev.filter(p => p.id !== postId));
                  },
                  onLike: (postId: string, isLiked: boolean) => {
                    setPosts(prev => prev.map(p => 
                      p.id === postId 
                        ? { ...p, isLiked, likes_count: isLiked ? p.likes_count + 1 : p.likes_count - 1 }
                        : p
                    ));
                  },
                  onUpdate: (postId: string, updates: any) => {
                    setPosts(prev => prev.map(p => 
                      p.id === postId 
                        ? { ...p, ...updates }
                        : p
                    ));
                  }
                };
                
                return <WallPostCard key={post.id} {...wallPostCardProps} />;
              })}
            </div>
          )}
        </div>
      </main>


    </div>
  );
}