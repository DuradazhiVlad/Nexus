import React from 'react';
import { MessageCircle } from 'lucide-react';
import { PostCard } from '../../../components/PostCard';
import { UserProfile } from '../types';

interface PostsSectionProps {
  loadingPosts: boolean;
  userPosts: any[];
  currentUser: any;
  profile: UserProfile;
  setUserPosts: (posts: any[]) => void;
}

export const PostsSection: React.FC<PostsSectionProps> = ({
  loadingPosts,
  userPosts,
  currentUser,
  profile,
  setUserPosts
}) => {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8 px-6">
          <button className="py-4 px-1 border-b-2 border-blue-500 text-blue-600 font-medium text-sm">
            Пости
          </button>
          <button className="py-4 px-1 border-b-2 border-transparent text-gray-500 hover:text-gray-700 font-medium text-sm">
            Фото
          </button>
          <button className="py-4 px-1 border-b-2 border-transparent text-gray-500 hover:text-gray-700 font-medium text-sm">
            Друзі
          </button>
        </nav>
      </div>

      <div className="p-6">
        {loadingPosts ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <p className="text-gray-600 text-sm">Завантаження постів...</p>
          </div>
        ) : userPosts.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <MessageCircle className="h-6 w-6 text-gray-400" />
            </div>
            <h3 className="text-base font-medium text-gray-900 mb-1">Поки що немає постів</h3>
            <p className="text-gray-600 text-sm">Створіть свій перший пост вище!</p>
          </div>
        ) : (
          <div className="space-y-6">
            {console.log('📝 Rendering posts:', userPosts.length, 'posts')}
            {userPosts.map((post: any, index: number) => {
              console.log(`📄 Rendering post ${index + 1}:`, post.id, post.content?.substring(0, 50));
              
              // Validate post data
              if (!post.id || !post.content) {
                console.error('❌ Invalid post data:', post);
                return null;
              }
              
              const postCardProps = {
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
                currentUserProfileId: profile?.id,
                onDelete: (postId: string) => {
                  setUserPosts(prev => prev.filter((p: any) => p.id !== postId));
                },
                onLike: (postId: string, isLiked: boolean) => {
                  setUserPosts(prev => prev.map((p: any) => 
                    p.id === postId 
                      ? { ...p, isLiked, likes_count: isLiked ? p.likes_count + 1 : p.likes_count - 1 }
                      : p
                  ));
                },
                onUpdate: (postId: string, updates: any) => {
                  setUserPosts(prev => prev.map((p: any) => 
                    p.id === postId 
                      ? { ...p, ...updates }
                      : p
                  ));
                }
              };
              
              return <PostCard {...postCardProps} />;
            })}
          </div>
        )}
      </div>
    </div>
  );
}; 