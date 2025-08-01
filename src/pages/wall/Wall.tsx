import React, { useState, useEffect, useRef } from 'react';
import { Sidebar } from '../../components/Sidebar';
import { useLocation } from 'react-router-dom';
import { getAllPosts, createPost, likePost, unlikePost, getCommentsForPost as getComments, addCommentToPost as addComment, updatePost, deletePost } from '../../lib/postService';
import { supabase } from '../../lib/supabase';
import { 
  Heart, 
  MessageCircle, 
  Share2, 
  Image as ImageIcon, 
  Video, 
  FileText, 
  Smile, 
  X, 
  Edit3, 
  Trash2,
  Send,
  MoreHorizontal,
  User,
  Calendar,
  MapPin,
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

interface Comment {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  created_at: string;
  author: {
    id: string;
    name: string;
    last_name: string;
    avatar?: string;
  };
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
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [comments, setComments] = useState<{ [postId: string]: Comment[] }>({});
  const [commentInputs, setCommentInputs] = useState<{ [postId: string]: string }>({});
  const [commentLoading, setCommentLoading] = useState<{ [postId: string]: boolean }>({});
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [editMediaUrl, setEditMediaUrl] = useState('');
  const [editMediaType, setEditMediaType] = useState('');
  const [deletingPostId, setDeletingPostId] = useState<string | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showMediaInput, setShowMediaInput] = useState(false);
  const [characterCount, setCharacterCount] = useState(0);
  const [showPostMenu, setShowPostMenu] = useState<string | null>(null);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const location = useLocation();

  const MAX_CHARACTERS = 280; // Twitter-style character limit

  useEffect(() => {
    fetchCurrentUser();
    fetchPosts();
  }, [location.key]);

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

  const handleLike = async (post: Post) => {
    if (!currentUser) return;
    try {
      if (post.isLiked) {
        await unlikePost(post.id);
      } else {
        await likePost(post.id);
      }
      fetchPosts();
    } catch (error) {
      console.error('Error handling like:', error);
    }
  };

  const handleShowComments = async (postId: string) => {
    if (comments[postId]) return; // вже завантажено
    setCommentLoading(l => ({ ...l, [postId]: true }));
    try {
      const { data, error } = await getComments(postId);
      if (error) throw error;
      setComments(c => ({ ...c, [postId]: data || [] }));
    } catch (error) {
      console.error('Error loading comments:', error);
    }
    setCommentLoading(l => ({ ...l, [postId]: false }));
  };

  const handleAddComment = async (postId: string) => {
    if (!currentUser || !commentInputs[postId]?.trim()) return;
    setCommentLoading(l => ({ ...l, [postId]: true }));
    try {
      const { error } = await addComment(postId, commentInputs[postId]);
      if (error) throw error;
      setCommentInputs(inputs => ({ ...inputs, [postId]: '' }));
      // Оновити коментарі
      const { data } = await getComments(postId);
      setComments(c => ({ ...c, [postId]: data || [] }));
    } catch (error) {
      console.error('Error adding comment:', error);
    }
    setCommentLoading(l => ({ ...l, [postId]: false }));
  };

  const handleEditClick = (post: Post) => {
    setEditingPostId(post.id);
    setEditContent(post.content);
    setEditMediaUrl(post.media_url || '');
    setEditMediaType(post.media_type || '');
  };

  const handleEditSave = async (postId: string) => {
    try {
      const { error } = await updatePost(postId, {
        content: editContent,
        media_url: editMediaUrl || null,
        media_type: editMediaType || null,
      });
      if (error) throw error;
      setEditingPostId(null);
      fetchPosts();
    } catch (e) {
      setError('Не вдалося оновити пост');
    }
  };

  const handleEditCancel = () => {
    setEditingPostId(null);
  };

  const handleDeleteClick = (postId: string) => {
    setDeletingPostId(postId);
    setShowPostMenu(null);
  };

  const handleDeleteConfirm = async (postId: string) => {
    try {
      const { error } = await deletePost(postId);
      if (error) throw error;
      setDeletingPostId(null);
      fetchPosts();
    } catch (e) {
      setError('Не вдалося видалити пост');
    }
  };

  const handleDeleteCancel = () => {
    setDeletingPostId(null);
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
              {posts.map(post => (
                <div key={post.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                  {/* Post header */}
                  <div className="p-6 pb-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                          {post.author.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900">
                            {post.author.name} {post.author.last_name}
                          </div>
                          <div className="text-sm text-gray-500 flex items-center space-x-2">
                            <Calendar size={14} className="mr-1" />
                            {formatDate(post.created_at)}
                            {post.author.friends_count !== undefined && (
                              <>
                                <span className="mx-1">•</span>
                                <User size={14} className="mr-1" />
                                {post.author.friends_count} {post.author.friends_count === 1 ? 'друг' : post.author.friends_count < 5 ? 'друзі' : 'друзів'}
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {/* Post menu */}
                      {currentUser && post.author && post.author.id === currentUser.id && (
                        <div className="relative">
                          <button
                            onClick={() => setShowPostMenu(showPostMenu === post.id ? null : post.id)}
                            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
                          >
                            <MoreHorizontal size={16} />
                          </button>
                          
                          {showPostMenu === post.id && (
                            <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-[120px]">
                              <button
                                onClick={() => handleEditClick(post)}
                                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center"
                              >
                                <Edit3 size={14} className="mr-2" />
                                Редагувати
                              </button>
                              <button
                                onClick={() => handleDeleteClick(post.id)}
                                className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center"
                              >
                                <Trash2 size={14} className="mr-2" />
                                Видалити
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Edit form */}
                  {editingPostId === post.id ? (
                    <div className="px-6 pb-4">
                      <textarea
                        className="w-full border border-gray-300 rounded-lg p-3 mb-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        value={editContent}
                        onChange={e => setEditContent(e.target.value)}
                        rows={3}
                      />
                      <div className="flex gap-2 mb-3">
                        <input
                          type="text"
                          className="flex-1 border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Посилання на медіа (необов'язково)"
                          value={editMediaUrl}
                          onChange={e => setEditMediaUrl(e.target.value)}
                        />
                        <select
                          className="border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          value={editMediaType}
                          onChange={e => setEditMediaType(e.target.value)}
                        >
                          <option value="">Тип медіа</option>
                          <option value="photo">Фото</option>
                          <option value="video">Відео</option>
                          <option value="document">Документ</option>
                        </select>
                      </div>
                      <div className="flex gap-2">
                        <button
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                          onClick={() => handleEditSave(post.id)}
                        >
                          Зберегти
                        </button>
                        <button
                          className="px-4 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400 transition-colors"
                          onClick={handleEditCancel}
                        >
                          Скасувати
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      {/* Post content */}
                      <div className="px-6 pb-4">
                        <div className="text-gray-900 text-lg leading-relaxed whitespace-pre-line mb-4">
                          {post.content}
                        </div>
                        
                        {/* Media content */}
                        {post.media_url && (
                          <div className="mb-4">
                            {post.media_type === 'photo' ? (
                              <img 
                                src={post.media_url} 
                                alt="media" 
                                className="max-h-96 w-full object-cover rounded-lg" 
                              />
                            ) : post.media_type === 'video' ? (
                              <video 
                                src={post.media_url} 
                                controls 
                                className="max-h-96 w-full rounded-lg" 
                              />
                            ) : post.media_type === 'document' ? (
                              <a 
                                href={post.media_url} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                              >
                                <FileText size={16} className="mr-2" />
                                Переглянути документ
                              </a>
                            ) : null}
                          </div>
                        )}
                      </div>

                      {/* Post actions */}
                      <div className="px-6 py-4 border-t border-gray-100">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-6">
                            <button
                              className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                                post.isLiked 
                                  ? 'text-red-500 bg-red-50 hover:bg-red-100' 
                                  : 'text-gray-500 hover:text-red-500 hover:bg-red-50'
                              }`}
                              onClick={() => handleLike(post)}
                            >
                              <Heart size={18} className={post.isLiked ? 'fill-current' : ''} />
                              <span className="text-sm font-medium">{post.likes_count}</span>
                            </button>
                            
                            <button
                              className="flex items-center space-x-2 px-3 py-2 rounded-lg text-gray-500 hover:text-blue-500 hover:bg-blue-50 transition-colors"
                              onClick={() => handleShowComments(post.id)}
                            >
                              <MessageCircle size={18} />
                              <span className="text-sm font-medium">{post.comments_count}</span>
                            </button>
                            
                            <button className="flex items-center space-x-2 px-3 py-2 rounded-lg text-gray-500 hover:text-green-500 hover:bg-green-50 transition-colors">
                              <Share2 size={18} />
                              <span className="text-sm font-medium">Поділитися</span>
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Коментарі */}
                      {comments[post.id] && (
                        <div className="border-t border-gray-100 bg-gray-50">
                          <div className="p-4">
                            <div className="mb-4 font-semibold text-gray-900">Коментарі</div>
                            {commentLoading[post.id] ? (
                              <div className="text-center py-4">
                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                              </div>
                            ) : comments[post.id].length === 0 ? (
                              <div className="text-center py-4 text-gray-500">Коментарів ще немає</div>
                            ) : (
                              <div className="space-y-3 mb-4">
                                {comments[post.id].map(comment => (
                                  <div key={comment.id} className="flex items-start space-x-3">
                                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                                      {comment.author.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="flex-1">
                                      <div className="flex items-center space-x-2 mb-1">
                                        <span className="font-medium text-gray-900 text-sm">
                                          {comment.author.name} {comment.author.last_name}
                                        </span>
                                        <span className="text-xs text-gray-500">
                                          {formatDate(comment.created_at)}
                                        </span>
                                      </div>
                                      <div className="text-gray-700 text-sm">{comment.content}</div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                            
                            {/* Додавання коментаря */}
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                                {currentUser?.email?.charAt(0).toUpperCase() || 'U'}
                              </div>
                              <div className="flex-1 flex items-center space-x-2">
                                <input
                                  type="text"
                                  className="flex-1 px-3 py-2 border border-gray-300 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                  placeholder="Ваш коментар..."
                                  value={commentInputs[post.id] || ''}
                                  onChange={e => setCommentInputs(inputs => ({ ...inputs, [post.id]: e.target.value }))}
                                  disabled={commentLoading[post.id]}
                                />
                                <button
                                  className="px-4 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
                                  onClick={() => handleAddComment(post.id)}
                                  disabled={commentLoading[post.id] || !commentInputs[post.id]?.trim()}
                                >
                                  {commentLoading[post.id] ? (
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                  ) : (
                                    <Send size={14} />
                                  )}
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Delete confirmation dialog */}
      {deletingPostId && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 max-w-md w-full mx-4">
            <div className="text-center">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Видалити пост?</h3>
              <p className="text-gray-600 mb-6">Цю дію неможливо скасувати. Пост буде видалено назавжди.</p>
              <div className="flex space-x-3">
                <button
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  onClick={handleDeleteCancel}
                >
                  Скасувати
                </button>
                <button
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  onClick={() => handleDeleteConfirm(deletingPostId)}
                >
                  Видалити
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 