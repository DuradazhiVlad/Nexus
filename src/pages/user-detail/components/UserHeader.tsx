import React from 'react';
import { UserDetail } from '../types';
import { 
  UserPlus, 
  UserCheck, 
  UserX, 
  MessageCircle, 
  MoreHorizontal,
  MapPin,
  Calendar,
  Globe,
  Lock,
  CheckCircle,
  Clock
} from 'lucide-react';

interface UserHeaderProps {
  user: UserDetail;
  currentUserId: string;
  friendshipStatus: 'friends' | 'pending' | 'none';
  onSendFriendRequest: () => void;
  onAcceptFriendRequest: () => void;
  onRejectFriendRequest: () => void;
  onRemoveFriend: () => void;
  onSendMessage: () => void;
}

export function UserHeader({
  user,
  currentUserId,
  friendshipStatus,
  onSendFriendRequest,
  onAcceptFriendRequest,
  onRejectFriendRequest,
  onRemoveFriend,
  onSendMessage
}: UserHeaderProps) {
  const isOwnProfile = user.id === currentUserId;
  const isOnline = user.isOnline || false;
  const lastSeen = user.lastSeen;

  const getInitials = (name: string, lastName?: string) => {
    const first = name.charAt(0).toUpperCase();
    const last = lastName ? lastName.charAt(0).toUpperCase() : '';
    return `${first}${last}`;
  };

  const formatLastSeen = (lastSeen?: string) => {
    if (!lastSeen) return '';
    const date = new Date(lastSeen);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 60) return `${minutes} хв тому`;
    if (hours < 24) return `${hours} год тому`;
    return `${days} дн тому`;
  };

  const renderFriendshipButton = () => {
    if (isOwnProfile) return null;

    switch (friendshipStatus) {
      case 'friends':
        return (
          <div className="flex gap-2">
            <button
              onClick={onSendMessage}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <MessageCircle size={16} />
              Повідомлення
            </button>
            <button
              onClick={onRemoveFriend}
              className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              <UserX size={16} />
              Видалити друга
            </button>
          </div>
        );
      case 'pending':
        return (
          <div className="flex gap-2">
            <button
              onClick={onAcceptFriendRequest}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <UserCheck size={16} />
              Прийняти
            </button>
            <button
              onClick={onRejectFriendRequest}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              <UserX size={16} />
              Відхилити
            </button>
          </div>
        );
      default:
        return (
          <button
            onClick={onSendFriendRequest}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <UserPlus size={16} />
            Додати в друзі
          </button>
        );
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border">
      {/* Cover Image */}
      <div className="relative h-48 bg-gradient-to-r from-blue-500 to-purple-600 rounded-t-lg">
        {user.cover && (
          <img 
            src={user.cover} 
            alt="Cover" 
            className="w-full h-full object-cover rounded-t-lg"
          />
        )}
        <div className="absolute top-4 right-4">
          <button className="p-2 bg-white/20 backdrop-blur-sm rounded-full hover:bg-white/30 transition-colors">
            <MoreHorizontal size={20} className="text-white" />
          </button>
        </div>
      </div>

      {/* Profile Info */}
      <div className="relative px-6 pb-6">
        {/* Avatar */}
        <div className="relative -mt-20 mb-4">
          <div className="w-40 h-40 rounded-full border-4 border-white bg-gray-200 flex items-center justify-center text-3xl font-bold text-gray-600">
            {user.avatar ? (
              <img 
                src={user.avatar} 
                alt={user.name}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              getInitials(user.name, user.last_name)
            )}
          </div>
          {isOnline && (
            <div className="absolute bottom-2 right-2 w-6 h-6 bg-green-500 rounded-full border-2 border-white"></div>
          )}
        </div>
        {user.isverified && (
          <div className="absolute top-2 right-2">
            <CheckCircle size={20} className="text-blue-500" />
          </div>
        )}

        {/* User Info */}
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-2">
            <h1 className="text-2xl font-bold text-gray-900">
              {user.name} {user.last_name}
            </h1>
            {user.privacy?.profileVisibility === 'private' && (
              <Lock size={16} className="text-gray-500" />
            )}
          </div>
          
          {user.bio && (
            <p className="text-gray-600 mb-3">{user.bio}</p>
          )}

          <div className="flex items-center gap-6 text-sm text-gray-500">
            {user.city && (
              <div className="flex items-center gap-1">
                <MapPin size={14} />
                {user.city}
              </div>
            )}
            {user.created_at && (
              <div className="flex items-center gap-1">
                <Calendar size={14} />
                Приєднався {new Date(user.created_at).toLocaleDateString()}
              </div>
            )}
            {!isOnline && lastSeen && (
              <div className="flex items-center gap-1">
                <Clock size={14} />
                {formatLastSeen(lastSeen)}
              </div>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-6 mb-4 text-sm">
          <div className="text-center">
            <div className="font-semibold text-gray-900">{user.friendsCount || 0}</div>
            <div className="text-gray-500">Друзів</div>
          </div>
          <div className="text-center">
            <div className="font-semibold text-gray-900">{user.postsCount || 0}</div>
            <div className="text-gray-500">Постів</div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          {renderFriendshipButton()}
        </div>
      </div>
    </div>
  );
}