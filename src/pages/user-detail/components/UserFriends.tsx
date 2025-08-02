import React from 'react';
import { UserDetail } from '../types';
import { 
  User, 
  MapPin, 
  Calendar,
  MessageCircle,
  UserPlus,
  CheckCircle
} from 'lucide-react';

interface UserFriendsProps {
  friends: UserDetail[];
  loading: boolean;
  onSendMessage: (userId: string) => void;
  onAddFriend: (userId: string) => void;
}

export function UserFriends({ 
  friends, 
  loading, 
  onSendMessage, 
  onAddFriend 
}: UserFriendsProps) {
  const getInitials = (name: string, lastName?: string) => {
    const first = name.charAt(0).toUpperCase();
    const last = lastName ? lastName.charAt(0).toUpperCase() : '';
    return `${first}${last}`;
  };

  const formatLastSeen = (lastSeen?: string, isOnline?: boolean) => {
    if (isOnline) return 'Онлайн';
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

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-white rounded-lg shadow-sm border p-4 animate-pulse">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-16"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (friends.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
        <div className="text-gray-400 mb-4">
          <User size={48} className="mx-auto" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Поки що немає друзів
        </h3>
        <p className="text-gray-500">
          Користувач ще не додав жодного друга
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {friends.map((friend) => (
        <div key={friend.id} className="bg-white rounded-lg shadow-sm border p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="relative">
              <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
                {friend.avatar ? (
                  <img 
                    src={friend.avatar} 
                    alt={friend.name}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <span className="text-sm font-medium text-gray-600">
                    {getInitials(friend.name, friend.last_name)}
                  </span>
                )}
              </div>
              {friend.isOnline && (
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
              )}
              {friend.isverified && (
                <div className="absolute -top-1 -right-1">
                  <CheckCircle size={16} className="text-blue-500" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-gray-900 truncate">
                {friend.name} {friend.last_name}
              </h3>
              <div className="flex items-center gap-1 text-xs text-gray-500">
                {friend.city && (
                  <>
                    <MapPin size={10} />
                    {friend.city}
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
            <span>{formatLastSeen(friend.lastSeen, friend.isOnline)}</span>
            {friend.created_at && (
              <span>Приєднався {new Date(friend.created_at).toLocaleDateString()}</span>
            )}
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => onSendMessage(friend.id)}
              className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              <MessageCircle size={12} />
              Повідомлення
            </button>
            <button
              onClick={() => onAddFriend(friend.id)}
              className="flex items-center justify-center px-2 py-1.5 text-xs bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
            >
              <UserPlus size={12} />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
} 