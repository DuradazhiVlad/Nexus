import React, { useState } from 'react';
import { 
  Heart, 
  MessageCircle, 
  Share2, 
  MoreHorizontal, 
  Edit3, 
  Trash2,
  User,
  Clock,
  FileText,
  Send,
  X
} from 'lucide-react';
import { likePost, unlikePost, deletePost, getCommentsForPost, addCommentToPost, updatePost } from '../lib/postService';

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

interface WallPostCardProps {
  post: {
    id: string;
    content: string;
    media_url?: string;
    media_type?: string;
    created_at: string;
    likes_count: number;
    comments_count: number;
    isLiked: boolean;
    author: {
      id: string;
      name: string;
      last_name?: string;
      avatar?: string;
      friends_count: number;
    };
  };
  currentUserId: string;
  currentUserProfileId?: string;
  onDelete?: (postId: string) => void;
  onLike?: (postId: string, isLiked: boolean) => void;
  onUpdate?: (postId: string, updates: any) => void;
}

export function WallPostCard({ 
  post, 
  currentUserId, 
  currentUserProfileId,
  onDelete, 
  onLike,
  onUpdate
}: WallPostCardProps) {
  const [isLiked, setIsLiked] = useState(post.isLiked);
  const [likesCount, setLikesCount] = useState(post.likes_count);
  const [showMenu, setShowMenu] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(post.content);
  const [editMediaUrl, setEditMediaUrl] = useState(post.media_url || '');
  const [editMediaType, setEditMediaType] = useState(post.media_type || '');
  const [isSaving, setIsSaving] = useState(false);
  
  // Comments state
  const [comments, setComments] = useState<Comment[]>([]);
  const [showCommentsSection, setShowCommentsSection] = useState(false);
  const [commentInput, setCommentInput] = useState('');
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [isAddingComment, setIsAddingComment] = useState(false);

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

  const getInitials = (name?: string, lastname?: string) => {
    const first = name ? name[0].toUpperCase() : '';
    const last = lastname ? lastname[0].toUpperCase() : '';
    return `${first}${last}`;
  };

  const handleLike = async () => {
    try {
      if (isLiked) {
        await unlikePost(post.id);
        setLikesCount(prev => prev - 1);
      } else {
        await likePost(post.id);
        setLikesCount(prev => prev + 1);
      }
      setIsLiked(!isLiked);
      onLike?.(post.id, !isLiked);
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await deletePost(post.id);
      onDelete?.(post.id);
    } catch (error) {
      console.error('Error deleting post:', error);
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleEdit = async () => {
    try {
      setIsSaving(true);
      await updatePost(post.id, {
        content: editContent,
        media_url: editMediaUrl || undefined,
        media_type: editMediaType || undefined
      });
      setIsEditing(false);
      onUpdate?.(post.id, {
        content: editContent,
        media_url: editMediaUrl,
        media_type: editMediaType
      });
    } catch (error) {
      console.error('Error updating post:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditContent(post.content);
    setEditMediaUrl(post.media_url || '');
    setEditMediaType(post.media_type || '');
  };

  const handleShowComments = async () => {
    if (!showCommentsSection) {
      setIsLoadingComments(true);
      try {
        const { data, error } = await getCommentsForPost(post.id);
        if (error) throw error;
        setComments(data || []);
      } catch (error) {
        console.error('Error loading comments:', error);
      } finally {
        setIsLoadingComments(false);
      }
    }
    setShowCommentsSection(!showCommentsSection);
  };

  const handleAddComment = async () => {
    if (!commentInput.trim()) return;
    
    try {
      setIsAddingComment(true);
      const { data, error } = await addCommentToPost(post.id, commentInput);
      if (error) throw error;
      
      // Add new comment to the list
      if (data && data[0]) {
        const newComment = {
          ...data[0],
          author: data[0].user_profiles || {
            id: data[0].user_id,
            name: 'Користувач',
            last_name: '',
            avatar: null
          }
        };
        setComments(prev => [...prev, newComment]);
      }
      setCommentInput('');
    } catch (error) {
      console.error('Error adding comment:', error);
    } finally {
      setIsAddingComment(false);
    }
  };

  const handleShare = () => {
    // Тут можна додати логіку для пересилання в чат
    console.log('Share post:', post.id);
  };

  const renderMedia = () => {
    if (!post.media_url) return null;

    switch (post.media_type) {
      case 'photo':
        return (
          <div className="mt-3">
            <img 
              src={post.media_url} 
              alt="Post media" 
              className="w-full max-h-96 object-cover rounded-lg"
            />
          </div>
        );
      case 'video':
        return (
          <div className="mt-3">
            <video 
              src={post.media_url} 
              controls 
              className="w-full max-h-96 rounded-lg"
            />
          </div>
        );
      case 'document':
        return (
          <div className="mt-3">
            <a 
              href={post.media_url} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <FileText size={16} className="mr-2" />
              Переглянути документ
            </a>
          </div>
        );
      default:
        return null;
    }
  };

  const canEdit = currentUserProfileId === post.author.id;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="p-6 pb-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
              {getInitials(post.author.name, post.author.last_name)}
            </div>
            <div>
              <div className="font-semibold text-gray-900">
                {post.author.name} {post.author.last_name}
              </div>
              <div className="text-sm text-gray-500 flex items-center space-x-2">
                <Clock size={14} className="mr-1" />
                {formatDate(post.created_at)}
                {post.author.friends_count > 0 && (
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
          {canEdit && (
            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
              >
                <MoreHorizontal size={16} />
              </button>
              
              {showMenu && (
                <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-[120px]">
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      setIsEditing(true);
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center"
                  >
                    <Edit3 size={14} className="mr-2" />
                    Редагувати
                  </button>
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      setShowDeleteConfirm(true);
                    }}
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

      {/* Content */}
      <div className="px-6 pb-4">
        {isEditing ? (
          <div className="space-y-3">
            <textarea
              className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={editContent}
              onChange={e => setEditContent(e.target.value)}
              rows={3}
              placeholder="Що нового?"
            />
            <div className="flex gap-2">
              <input
                type="text"
                className="flex-1 border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                placeholder="Посилання на медіа (необов'язково)"
                value={editMediaUrl}
                onChange={e => setEditMediaUrl(e.target.value)}
              />
              <select
                className="border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
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
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center"
                onClick={handleEdit}
                disabled={isSaving}
              >
                {isSaving ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                ) : null}
                {isSaving ? 'Збереження...' : 'Зберегти'}
              </button>
              <button
                className="px-4 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400 transition-colors flex items-center"
                onClick={handleCancelEdit}
                disabled={isSaving}
              >
                <X size={16} className="mr-2" />
                Скасувати
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="text-gray-900 text-lg leading-relaxed whitespace-pre-line mb-4">
              {post.content}
            </div>
            
            {/* Media */}
            {renderMedia()}
          </>
        )}
      </div>

      {/* Post actions */}
      <div className="px-6 py-4 border-t border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <button
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                isLiked 
                  ? 'text-red-500 bg-red-50 hover:bg-red-100' 
                  : 'text-gray-500 hover:text-red-500 hover:bg-red-50'
              }`}
              onClick={handleLike}
            >
              <Heart size={18} className={isLiked ? 'fill-current' : ''} />
              <span className="text-sm font-medium">{likesCount}</span>
            </button>
            
            <button
              className="flex items-center space-x-2 px-3 py-2 rounded-lg text-gray-500 hover:text-blue-500 hover:bg-blue-50 transition-colors"
              onClick={handleShowComments}
            >
              <MessageCircle size={18} />
              <span className="text-sm font-medium">{post.comments_count}</span>
            </button>
            
            <button 
              className="flex items-center space-x-2 px-3 py-2 rounded-lg text-gray-500 hover:text-green-500 hover:bg-green-50 transition-colors"
              onClick={handleShare}
            >
              <Share2 size={18} />
              <span className="text-sm font-medium">Поділитися</span>
            </button>
          </div>
        </div>
      </div>

      {/* Comments section */}
      {showCommentsSection && (
        <div className="border-t border-gray-100 bg-gray-50">
          <div className="p-4">
            <div className="mb-4 font-semibold text-gray-900">Коментарі</div>
            
            {isLoadingComments ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
              </div>
            ) : comments.length === 0 ? (
              <div className="text-center py-4 text-gray-500">Коментарів ще немає</div>
            ) : (
              <div className="space-y-3 mb-4">
                {comments.map(comment => (
                  <div key={comment.id} className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                      {getInitials(comment.author.name, comment.author.last_name)}
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
            
            {/* Add comment */}
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                U
              </div>
              <div className="flex-1 flex items-center space-x-2">
                <input
                  type="text"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ваш коментар..."
                  value={commentInput}
                  onChange={e => setCommentInput(e.target.value)}
                  disabled={isAddingComment}
                />
                <button
                  className="px-4 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
                  onClick={handleAddComment}
                  disabled={isAddingComment || !commentInput.trim()}
                >
                  {isAddingComment ? (
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

      {/* Delete confirmation modal */}
      {showDeleteConfirm && (
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
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={isDeleting}
                >
                  Скасувати
                </button>
                <button
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
                  onClick={handleDelete}
                  disabled={isDeleting}
                >
                  {isDeleting ? 'Видалення...' : 'Видалити'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}