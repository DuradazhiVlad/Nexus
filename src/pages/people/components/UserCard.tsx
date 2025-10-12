import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  UserPlus,
  MessageCircle,
  Check,
  UserCheck,
  UserX,
  MapPin,
  MoreHorizontal
} from 'lucide-react';
import { User, FriendRequest } from '../types';

interface UserCardProps {
  user: User;
  currentUserId: string | null;
  friendRequests: FriendRequest[];
  onAddFriend: (friendId: string) => void;
  onAcceptFriendRequest: (requestId: string) => void;
  onRejectFriendRequest: (requestId: string) => void;
  onRemoveFriend: (friendId: string) => void;
}

export function UserCard({
  user,
  currentUserId,
  friendRequests,
  onAddFriend,
  onAcceptFriendRequest,
  onRejectFriendRequest,
  onRemoveFriend
}: UserCardProps) {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  const showError = (message: string) => {
    setError(message);
    setTimeout(() => setError(null), 3000);
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
  };

  const getFriendStatus = (userId: string) => {
    if (!currentUserId || !friendRequests) return 'not_friends';

    const sentRequest = friendRequests.find(req =>
      req.user_id === currentUserId && req.friend_id === userId && req.status === 'pending'
    );

    const receivedRequest = friendRequests.find(req =>
      req.user_id === userId && req.friend_id === currentUserId && req.status === 'pending'
    );

    const acceptedRequest = friendRequests.find(req =>
      (req.user_id === currentUserId && req.friend_id === userId) ||
      (req.user_id === userId && req.friend_id === currentUserId) &&
      req.status === 'accepted'
    );

    if (acceptedRequest) return 'friends';
    if (sentRequest) return 'sent';
    if (receivedRequest) return 'received';
    return 'not_friends';
  };

  const friendStatus = getFriendStatus(user.id);
  const canSendMessage = friendStatus === 'friends' || user.privacy?.profileVisibility === 'public';

  const handleCardClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('button')) {
      return;
    }
    navigate(`/user/${user.id}`);
  };

  return (
    <div
      className="relative rounded-2xl overflow-hidden shadow-xl hover:shadow-2xl transition-shadow duration-300 bg-white cursor-pointer group"
      onClick={handleCardClick}
      style={{ aspectRatio: '4 / 5' }}
    >
      {error && (
        <div className="absolute top-2 left-2 right-2 z-20 p-2 bg-red-100 border border-red-300 rounded text-red-700 text-xs text-center animate-fade-in-down">
          {error}
        </div>
      )}

      {/* Background Image/Avatar */}
      <div className="relative w-full h-full">
        {user.avatar ? (
          <img
            src={user.avatar}
            alt={`${user.name} ${user.last_name}`}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-blue-400 via-indigo-500 to-purple-600 flex items-center justify-center">
            <span className="text-white font-bold text-5xl">
              {getInitials(user.name, user.last_name || '')}
            </span>
          </div>
        )}

        {/* Online Status Indicator */}
        <div className="absolute top-4 right-4 z-10">
          <div className={`w-3.5 h-3.5 rounded-full border-2 border-white ${
            user.isOnline ? 'bg-green-500' : 'bg-gray-400'
          }`}></div>
        </div>

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>

        {/* Content Overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-6 text-white transition-transform duration-300 transform group-hover:translate-y-0">
          {/* User Info */}
          <div className="mb-4">
            <h3 className="text-xl font-bold mb-1">
              {user.last_name} {user.name}
            </h3>

            {user.city && (
              <div className="flex items-center text-sm text-white/90 mb-1">
                <MapPin className="w-4 h-4 mr-1" />
                {user.city}
              </div>
            )}
            
            {user.bio && (
              <p className="text-sm text-white/70 truncate">{user.bio}</p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="space-y-2">
            {friendStatus === 'not_friends' && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onAddFriend(user.id);
                }}
                className="flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors duration-200 text-sm font-medium w-full shadow-lg"
              >
                <UserPlus className="w-4 h-4 mr-2" />
                Додати в друзі
              </button>
            )}

            {friendStatus === 'sent' && (
              <div className="flex items-center justify-center px-4 py-3 bg-white/20 backdrop-blur-sm text-white rounded-full text-sm font-medium w-full">
                <Check className="w-4 h-4 mr-2" />
                Запит надіслано
              </div>
            )}

            {friendStatus === 'received' && (
              <div className="flex space-x-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    const request = friendRequests.find(req => req.user_id === user.id && req.friend_id === currentUserId);
                    if (request) {
                      onAcceptFriendRequest(request.id);
                    } else {
                      showError('Запит в друзі не знайдено');
                    }
                  }}
                  className="flex-1 flex items-center justify-center p-3 bg-green-500 text-white rounded-full hover:bg-green-600 transition-colors duration-200 shadow-md"
                >
                  <UserCheck className="w-5 h-5" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    const request = friendRequests.find(req => req.user_id === user.id && req.friend_id === currentUserId);
                    if (request) {
                      onRejectFriendRequest(request.id);
                    } else {
                      showError('Запит в друзі не знайдено');
                    }
                  }}
                  className="flex-1 flex items-center justify-center p-3 bg-white/20 backdrop-blur-sm text-white rounded-full hover:bg-white/30 transition-colors duration-200 shadow-md"
                >
                  <UserX className="w-5 h-5" />
                </button>
              </div>
            )}

            {friendStatus === 'friends' && (
              <div className="flex space-x-2">
                {canSendMessage && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/messages?user=${user.id}`);
                    }}
                    className="flex-1 flex items-center justify-center p-3 bg-green-500 text-white rounded-full hover:bg-green-600 transition-colors duration-200 shadow-md"
                  >
                    <MessageCircle className="w-5 h-5" />
                  </button>
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemoveFriend(user.id);
                  }}
                  className="flex-1 flex items-center justify-center p-3 bg-white/20 backdrop-blur-sm text-white rounded-full hover:bg-white/30 transition-colors duration-200 shadow-md"
                >
                  <UserX className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}