import React from 'react';
import { Heart, MessageCircle, Users } from 'lucide-react';

interface ProfileStatsProps {
  userPosts: any[];
  friendsCount?: number;
}

export const ProfileStats: React.FC<ProfileStatsProps> = ({ userPosts, friendsCount = 0 }) => {
  const totalLikes = userPosts.reduce((total, post: any) => total + (post.likes_count || 0), 0);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
          <Heart className="h-6 w-6 text-blue-600" />
        </div>
        <div className="text-2xl font-bold text-gray-900">
          {totalLikes}
        </div>
        <div className="text-sm text-gray-600">Вподобань</div>
      </div>
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
          <MessageCircle className="h-6 w-6 text-green-600" />
        </div>
        <div className="text-2xl font-bold text-gray-900">{userPosts.length}</div>
        <div className="text-sm text-gray-600">Постів</div>
      </div>
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
        <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
          <Users className="h-6 w-6 text-purple-600" />
        </div>
        <div className="text-2xl font-bold text-gray-900">{friendsCount}</div>
        <div className="text-sm text-gray-600">Друзів</div>
      </div>
    </div>
  );
}; 