import React from 'react';
import { UserPost } from '../types';
import { 
  Heart, 
  MessageSquare, 
  Share2, 
  MoreHorizontal,
  Calendar,
  User
} from 'lucide-react';

interface UserPostsProps {
  posts: UserPost[];
  loading: boolean;
}

export function UserPosts({ posts, loading }: UserPostsProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 60) return `${minutes} хв тому`;
    if (hours < 24) return `${hours} год тому`;
    if (days < 7) return `${days} дн тому`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-white rounded-lg shadow-sm border p-6 animate-pulse">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded w-32 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-24"></div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
        <div className="text-gray-400 mb-4">
          <MessageSquare size={48} className="mx-auto" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Поки що немає постів
        </h3>
        <p className="text-gray-500">
          Користувач ще не створив жодного поста
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {posts.map((post) => (
        <div key={post.id} className="bg-white rounded-lg shadow-sm border p-6">
          {/* Post Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                <User size={20} className="text-gray-500" />
              </div>
              <div>
                <div className="font-medium text-gray-900">
                  Пост користувача
                </div>
                <div className="text-sm text-gray-500 flex items-center gap-1">
                  <Calendar size={12} />
                  {formatDate(post.created_at)}
                </div>
              </div>
            </div>
            <button className="p-1 hover:bg-gray-100 rounded-full transition-colors">
              <MoreHorizontal size={16} className="text-gray-500" />
            </button>
          </div>

          {/* Post Content */}
          <div className="mb-4">
            <p className="text-gray-900 whitespace-pre-wrap">{post.content}</p>
            {post.media_url && (
              <div className="mt-3">
                {post.media_type === 'video' ? (
                  <video 
                    src={post.media_url} 
                    controls 
                    className="w-full rounded-lg"
                  />
                ) : (
                  <img 
                    src={post.media_url} 
                    alt="Post media" 
                    className="w-full rounded-lg"
                  />
                )}
              </div>
            )}
          </div>

          {/* Post Actions */}
          <div className="flex items-center justify-between pt-4 border-t">
            <div className="flex items-center gap-6">
              <button className="flex items-center gap-2 text-gray-500 hover:text-red-500 transition-colors">
                <Heart size={16} />
                <span className="text-sm">{post.likes_count || 0}</span>
              </button>
              <button className="flex items-center gap-2 text-gray-500 hover:text-blue-500 transition-colors">
                <MessageSquare size={16} />
                <span className="text-sm">{post.comments_count || 0}</span>
              </button>
              <button className="flex items-center gap-2 text-gray-500 hover:text-green-500 transition-colors">
                <Share2 size={16} />
                <span className="text-sm">Поділитися</span>
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
} 