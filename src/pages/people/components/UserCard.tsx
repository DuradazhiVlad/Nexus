import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  UserPlus, 
  MessageCircle, 
  Check, 
  UserCheck, 
  UserX,
  MapPin
} from 'lucide-react';
import { User, FriendRequest } from '../types';
import { ErrorNotification } from '../../../components/ErrorNotification';

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

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Невідомо';
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Щойно';
    if (diffInHours < 24) return `${diffInHours} год тому`;
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)} дн тому`;
    return date.toLocaleDateString('uk-UA');
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

  const canSendMessage = (user: User) => {
    const friendStatus = getFriendStatus(user.id);
    return user.privacy?.profileVisibility === 'public' || friendStatus === 'friends';
  };

  const friendStatus = getFriendStatus(user.id);

  const handleCardClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('button')) {
      return;
    }
    navigate(`/user/${user.id}`);
  };

  return (
    <div 
      className="relative bg-white rounded-2xl shadow-lg border overflow-hidden hover:shadow-xl hover:scale-105 transition-all duration-300 cursor-pointer group h-80 animate-fadeIn"
      onClick={handleCardClick}
    >
      {error && (
        <div className="absolute top-2 left-2 right-2 z-20 p-2 bg-red-100 border border-red-300 rounded text-red-700 text-xs">
          {error}
        </div>
      )}
      
      {/* Background Image/Avatar */}
      <div className="relative h-full">
        {user.avatar ? (
          <img
            src={user.avatar}
            alt={`${user.name} ${user.last_name}`}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-blue-500 via-purple-600 to-pink-500 flex items-center justify-center">
            <span className="text-white font-bold text-4xl">
              {getInitials(user.name, user.last_name)}
            </span>
          </div>
        )}
        
        {/* Online Status Indicator */}
        <div className="absolute top-3 right-3 z-10">
          <div className={`w-3 h-3 rounded-full border-2 border-white ${
            user.online_status === 'online' ? 'bg-green-500' : 'bg-gray-400'
          }`}></div>
        </div>
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
        
        {/* Content Overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
          {/* User Info */}
          <div className="mb-3">
            <h3 className="text-lg font-bold mb-1">
              {user.last_name} {user.name}
            </h3>
            
            {user.city && (
              <div className="flex items-center text-sm text-white/90 mb-1">
                <MapPin className="w-4 h-4 mr-1" />
                {user.city}
              </div>
            )}
            
            {user.bio && (
              <p className="text-sm text-white/80 line-clamp-2 mb-2">
                {user.bio} 🌍
              </p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="space-y-2">
            {friendStatus === 'not_friends' && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  try {
                    onAddFriend(user.id);
                  } catch (error) {
                    console.error('Error adding friend:', error);
                    showError('Помилка додавання в друзі');
                  }
                }}
                className="flex items-center justify-center px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-full hover:from-blue-600 hover:to-purple-700 transition-all duration-200 text-sm font-medium w-full shadow-lg"
              >
                <UserPlus className="w-4 h-4 mr-2" />
                Додати в друзі
              </button>
            )}
            
            {friendStatus === 'sent' && (
              <div className="flex items-center justify-center px-4 py-2 bg-white/20 backdrop-blur-sm text-white rounded-full text-sm font-medium w-full">
                <Check className="w-4 h-4 mr-2" />
                Запит надіслано
              </div>
            )}
            
            {friendStatus === 'received' && (
              <div className="flex flex-col space-y-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    try {
                      const request = friendRequests.find(req => 
                        req.user_id === user.id && req.friend_id === currentUserId && req.status === 'pending'
                      );
                      if (request) {
                        onAcceptFriendRequest(request.id);
                      } else {
                        showError('Запит в друзі не знайдено');
                      }
                    } catch (error) {
                      console.error('Error accepting friend request:', error);
                      showError('Помилка прийняття запиту в друзі');
                    }
                  }}
                  className="flex items-center justify-center px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-full hover:from-green-600 hover:to-emerald-700 transition-all duration-200 text-sm font-medium w-full shadow-lg"
                >
                  <UserCheck className="w-4 h-4 mr-2" />
                  Прийняти
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    try {
                      const request = friendRequests.find(req => 
                        req.user_id === user.id && req.friend_id === currentUserId && req.status === 'pending'
                      );
                      if (request) {
                        onRejectFriendRequest(request.id);
                      } else {
                        showError('Запит в друзі не знайдено');
                      }
                    } catch (error) {
                      console.error('Error rejecting friend request:', error);
                      showError('Помилка відхилення запиту в друзі');
                    }
                  }}
                  className="flex items-center justify-center px-4 py-2 bg-white/20 backdrop-blur-sm text-white rounded-full hover:bg-white/30 transition-all duration-200 text-sm font-medium w-full border border-white/30"
                >
                  <UserX className="w-4 h-4 mr-2" />
                  Відхилити
                </button>
              </div>
            )}
            
            {friendStatus === 'friends' && (
              <div className="flex flex-col space-y-2">
                {canSendMessage(user) && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      try {
                        navigate(`/messages?user=${user.id}`);
                      } catch (error) {
                        console.error('Error navigating to messages:', error);
                        showError('Помилка відкриття повідомлень');
                      }
                    }}
                    className="flex items-center justify-center px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-full hover:from-green-600 hover:to-emerald-700 transition-all duration-200 text-sm font-medium w-full shadow-lg"
                  >
                    <MessageCircle className="w-4 h-4 mr-2" />
                    💬 Повідомлення
                  </button>
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    try {
                      onRemoveFriend(user.id);
                    } catch (error) {
                      console.error('Error removing friend:', error);
                      showError('Помилка видалення друга');
                    }
                  }}
                  className="flex items-center justify-center px-4 py-2 bg-white/20 backdrop-blur-sm text-white rounded-full hover:bg-white/30 transition-all duration-200 text-sm font-medium w-full border border-white/30"
                >
                  <UserX className="w-4 h-4 mr-2" />
                  Видалити з друзів
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}