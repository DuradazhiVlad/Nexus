import React, { useState, useEffect } from 'react';
import { Sidebar } from '../../components/Sidebar';
import { useLocation } from 'react-router-dom';
import { getAllPosts, createPost, likePost, unlikePost, getCommentsForPost as getComments, addCommentToPost as addComment, updatePost, deletePost } from '../../lib/postService';
import { supabase } from '../../lib/supabase';

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
  const location = useLocation();

  useEffect(() => {
    fetchCurrentUser();
    fetchPosts();
  }, [location.key]);

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
    if (!content.trim() || !currentUser) return;
    setCreating(true);
    try {
      const { error } = await createPost({
        user_id: currentUser.id,
        content,
        media_url: mediaUrl || undefined,
        media_type: mediaType || undefined,
      });
      if (error) throw error;
      setContent('');
      setMediaUrl('');
      setMediaType('');
      fetchPosts();
    } catch (e: any) {
      setError('Не вдалося створити пост');
    } finally {
      setCreating(false);
    }
  };

  const handleLike = async (post: Post) => {
    if (!currentUser) return;
    try {
      if (post.isLiked) {
        await unlikePost(post.id, currentUser.id);
      } else {
        await likePost(post.id, currentUser.id);
      }
      fetchPosts();
    } catch (error) {
      console.error('Error fetching posts:', error);
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
      const { error } = await addComment(postId, currentUser.id, commentInputs[postId]);
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

  return (
    <div className="flex">
      <Sidebar />
      <main className="flex-1 max-w-2xl mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">Стрічка</h1>
        {/* Створення поста */}
        <form onSubmit={handleCreatePost} className="bg-white rounded-lg shadow p-4 mb-6">
          <textarea
            className="w-full border rounded p-2 mb-2"
            placeholder="Що нового?"
            value={content}
            onChange={e => setContent(e.target.value)}
            rows={3}
          />
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              className="flex-1 border rounded p-2"
              placeholder="Посилання на медіа (необов'язково)"
              value={mediaUrl}
              onChange={e => setMediaUrl(e.target.value)}
            />
            <select
              className="border rounded p-2"
              value={mediaType}
              onChange={e => setMediaType(e.target.value)}
            >
              <option value="">Тип медіа</option>
              <option value="photo">Фото</option>
              <option value="video">Відео</option>
              <option value="document">Документ</option>
            </select>
          </div>
          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            disabled={creating}
          >
            {creating ? 'Створення...' : 'Опублікувати'}
          </button>
        </form>
        {/* Відображення постів */}
        {loading ? (
          <div>Завантаження...</div>
        ) : error ? (
          <div className="text-red-600">{error}</div>
        ) : posts.length === 0 ? (
          <div>Постів ще немає</div>
        ) : (
          <div className="space-y-6">
            {posts.map(post => (
              <div key={post.id} className="bg-white rounded-lg shadow p-4">
                {/* Edit/Delete buttons for author */}
                {currentUser && post.author && post.author.id === currentUser.id && (
                  <div className="flex justify-end gap-2 mb-2">
                    <button
                      className="text-blue-600 hover:underline text-sm"
                      onClick={() => handleEditClick(post)}
                    >Редагувати</button>
                    <button
                      className="text-red-600 hover:underline text-sm"
                      onClick={() => handleDeleteClick(post.id)}
                    >Видалити</button>
                  </div>
                )}
                {/* Edit form */}
                {editingPostId === post.id ? (
                  <div className="mb-2">
                    <textarea
                      className="w-full border rounded p-2 mb-2"
                      value={editContent}
                      onChange={e => setEditContent(e.target.value)}
                      rows={3}
                    />
                    <div className="flex gap-2 mb-2">
                      <input
                        type="text"
                        className="flex-1 border rounded p-2"
                        placeholder="Посилання на медіа (необов'язково)"
                        value={editMediaUrl}
                        onChange={e => setEditMediaUrl(e.target.value)}
                      />
                      <select
                        className="border rounded p-2"
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
                        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                        onClick={() => handleEditSave(post.id)}
                      >Зберегти</button>
                      <button
                        className="bg-gray-300 text-gray-800 px-4 py-2 rounded hover:bg-gray-400"
                        onClick={handleEditCancel}
                      >Скасувати</button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center mb-2">
                      <img
                        src={post.author.avatar || '/default-avatar.png'}
                        alt="avatar"
                        className="w-10 h-10 rounded-full mr-3"
                      />
                      <div>
                        <div className="font-bold">{post.author.name} {post.author.last_name}</div>
                        <div className="text-xs text-gray-500">{new Date(post.created_at).toLocaleString()}</div>
                      </div>
                    </div>
                    <div className="mb-2 whitespace-pre-line">{post.content}</div>
                    {post.media_url && (
                      post.media_type === 'photo' ? (
                        <img src={post.media_url} alt="media" className="max-h-64 rounded mb-2" />
                      ) : post.media_type === 'video' ? (
                        <video src={post.media_url} controls className="max-h-64 rounded mb-2" />
                      ) : post.media_type === 'document' ? (
                        <a href={post.media_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline mb-2 block">Документ</a>
                      ) : null
                    )}
                    <div className="flex items-center gap-4 mt-2">
                      <button
                        className={`flex items-center gap-1 ${post.isLiked ? 'text-blue-600' : 'text-gray-600'} hover:underline`}
                        onClick={() => handleLike(post)}
                      >
                        <span>👍</span> {post.likes_count}
                      </button>
                      <button
                        className="flex items-center gap-1 text-gray-600 hover:underline"
                        onClick={() => handleShowComments(post.id)}
                      >
                        <span>💬</span> {post.comments_count}
                      </button>
                    </div>
                    {/* Коментарі */}
                    {comments[post.id] && (
                      <div className="mt-4 border-t pt-2">
                        <div className="mb-2 font-semibold">Коментарі</div>
                        {commentLoading[post.id] ? (
                          <div>Завантаження...</div>
                        ) : comments[post.id].length === 0 ? (
                          <div>Коментарів ще немає</div>
                        ) : (
                          <div className="space-y-2">
                            {comments[post.id].map(comment => (
                              <div key={comment.id} className="flex items-start gap-2">
                                <img
                                  src={comment.author.avatar || '/default-avatar.png'}
                                  alt="avatar"
                                  className="w-8 h-8 rounded-full"
                                />
                                <div>
                                  <div className="font-bold text-sm">{comment.author.name} {comment.author.last_name}</div>
                                  <div className="text-xs text-gray-500">{new Date(comment.created_at).toLocaleString()}</div>
                                  <div>{comment.content}</div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                        {/* Додавання коментаря */}
                        <div className="flex items-center gap-2 mt-2">
                          <input
                            type="text"
                            className="flex-1 border rounded p-2"
                            placeholder="Ваш коментар..."
                            value={commentInputs[post.id] || ''}
                            onChange={e => setCommentInputs(inputs => ({ ...inputs, [post.id]: e.target.value }))}
                            disabled={commentLoading[post.id]}
                          />
                          <button
                            className="bg-blue-600 text-white px-3 py-1 rounded"
                            onClick={() => handleAddComment(post.id)}
                            disabled={commentLoading[post.id]}
                          >
                            Додати
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
      {/* Delete confirmation dialog */}
      {deletingPostId && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-30 z-50">
          <div className="bg-white p-6 rounded shadow-lg">
            <div className="mb-4">Ви впевнені, що хочете видалити цей пост?</div>
            <div className="flex gap-2 justify-end">
              <button
                className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
                onClick={() => handleDeleteConfirm(deletingPostId)}
              >Видалити</button>
              <button
                className="bg-gray-300 text-gray-800 px-4 py-2 rounded hover:bg-gray-400"
                onClick={handleDeleteCancel}
              >Скасувати</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 