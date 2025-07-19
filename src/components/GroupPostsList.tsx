import React, { useEffect, useState } from 'react';
import { Heart, MessageCircle, Share, MoreHorizontal, Calendar, Image, Video } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface User {
  id: string;
  name: string;
  lastname: string;
  avatar: string | null;
}

interface PostMedia {
  id: string;
  type: 'image' | 'video';
  url: string;
  filename: string | null;
}

interface GroupPost {
  id: string;
  content: string;
  created_at: string;
  updated_at: string;
  author: User;
  media: PostMedia[];
}

interface GroupPostsListProps {
  groupId: string;
  currentUser: User;
  refreshTrigger: number;
}

export function GroupPostsList({ groupId, currentUser, refreshTrigger }: GroupPostsListProps) {
  const [posts, setPosts] = useState<GroupPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPosts();
  }, [groupId, refreshTrigger]);

  async function loadPosts() {
    try {
      const { data: postsData, error: postsError } = await supabase
        .from('group_posts')
        .select(`
          *,
          author:users!group_posts_author_id_fkey(*)
        `)
        .eq('group_id', groupId)
        .order('created_at', { ascending: false });

      if (postsError) throw postsError;

      // Завантажити медіафайли для кожного посту
      const postsWithMedia = await Promise.all(
        (postsData || []).map(async (post) => {
          const { data: mediaData } = await supabase
            .from('group_post_media')
            .select('*')
            .eq('post_id', post.id)
            .order('created_at', { ascending: true });

          return {
            ...post,
            media: mediaData || []
          };
        })
      );

      setPosts(postsWithMedia);
    } catch (error) {
      console.error('Error loading posts:', error);
    } finally {
      setLoading(false);
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      return 'Щойно';
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)} год тому`;
    } else if (diffInHours < 48) {
      return 'Вчора';
    } else {
      return date.toLocaleDateString('uk-UA', {
        day: 'numeric',
        month: 'short',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
      });
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="animate-pulse">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-gray-300 rounded-full"></div>
                <div className="space-y-2">
                  <div className="h-4 bg-gray-300 rounded w-32"></div>
                  <div className="h-3 bg-gray-300 rounded w-20"></div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-300 rounded"></div>
                <div className="h-4 bg-gray-300 rounded w-3/4"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
        <MessageCircle size={48} className="mx-auto mb-4 text-gray-300" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Поки що немає постів</h3>
        <p className="text-gray-500">Станьте першим, хто поділиться чимось цікавим!</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {posts.map((post) => (
        <div key={post.id} className="bg-white rounded-lg shadow-sm border border-gray-200">
          {/* Заголовок посту */}
          <div className="p-6 pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                  {post.author.avatar ? (
                    <img 
                      src={post.author.avatar} 
                      alt={post.author.name} 
                      className="w-full h-full rounded-full object-cover" 
                    />
                  ) : (
                    <span className="text-sm font-medium text-gray-600">
                      {post.author.name[0]?.toUpperCase()}
                    </span>
                  )}
                </div>
                <div>
                  <p className="font-medium text-gray-900">
                    {post.author.name} {post.author.lastname}
                  </p>
                  <div className="flex items-center text-sm text-gray-500">
                    <Calendar size={12} className="mr-1" />
                    <span>{formatDate(post.created_at)}</span>
                    {post.updated_at !== post.created_at && (
                      <span className="ml-2">(редаговано)</span>
                    )}
                  </div>
                </div>
              </div>
              
              {post.author.id === currentUser.id && (
                <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full">
                  <MoreHorizontal size={16} />
                </button>
              )}
            </div>
          </div>

          {/* Контент посту */}
          {post.content && (
            <div className="px-6 pb-4">
              <p className="text-gray-900 leading-relaxed whitespace-pre-wrap">
                {post.content}
              </p>
            </div>
          )}

          {/* Медіафайли */}
          {post.media.length > 0 && (
            <div className="px-6 pb-4">
              <div className={`grid gap-2 ${
                post.media.length === 1 ? 'grid-cols-1' :
                post.media.length === 2 ? 'grid-cols-2' :
                'grid-cols-2 md:grid-cols-3'
              }`}>
                {post.media.map((media) => (
                  <div key={media.id} className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden">
                    {media.type === 'image' ? (
                      <img 
                        src={media.url} 
                        alt={media.filename || 'Post image'} 
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-200 cursor-pointer" 
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-200">
                        <Video size={32} className="text-gray-500" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Дії з постом */}
          <div className="px-6 py-4 border-t border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-6">
                <button className="flex items-center space-x-2 text-gray-500 hover:text-red-500 transition-colors">
                  <Heart size={18} />
                  <span className="text-sm">Подобається</span>
                </button>
                
                <button className="flex items-center space-x-2 text-gray-500 hover:text-blue-500 transition-colors">
                  <MessageCircle size={18} />
                  <span className="text-sm">Коментувати</span>
                </button>
                
                <button className="flex items-center space-x-2 text-gray-500 hover:text-green-500 transition-colors">
                  <Share size={18} />
                  <span className="text-sm">Поділитися</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}