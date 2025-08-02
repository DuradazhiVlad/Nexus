import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  UserPlus, 
  MessageCircle, 
  Check, 
  UserCheck, 
  UserX,
  MapPin,
  Calendar,
  Globe,
  Lock
} from 'lucide-react';
import { User, FriendRequest } from '../types';

interface UserCardProps {
  user: User;
  friendRequests: FriendRequest[];
  onAddFriend: (friendId: string) => void;
  onAcceptFriendRequest: (requestId: string) => void;
  onRejectFriendRequest: (requestId: string) => void;
  onRemoveFriend: (friendId: string) => void;
}

export function UserCard({
  user,
  friendRequests,
  onAddFriend,
  onAcceptFriendRequest,
  onRejectFriendRequest,
  onRemoveFriend
}: UserCardProps) {
  const navigate = useNavigate();

  const getInitials = (name: string, lastName?: string) => {
    const firstLetter = name[0].toUpperCase();
    const lastLetter = lastName ? lastName[0].toUpperCase() : '';
    return `${firstLetter}${lastLetter}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) return 'Сьогодні';
    if (days === 1) return 'Вчора';
    if (days < 7) return `${days} дн тому`;
    return date.toLocaleDateString();
  };

  const getFriendStatus = (userId: string) => {
    // Використовуємо id для порівняння
    const currentUser = friendRequests.find(req => req.user_id === userId);
    const receivedRequest = friendRequests.find(req => req.friend_id === userId);
    
    if (currentUser) return 'sent';
    if (receivedRequest) return 'received';
    return 'not_friends';
  };

  const canSendMessage = (user: User) => {
    return user.privacy?.profileVisibility === 'public';
  };

  const friendStatus = getFriendStatus(user.auth_user_id);

  return (
    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-center space-x-4">
        {/* Avatar */}
        <div className="flex-shrink-0">
          <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center">
            {user.avatar ? (
              <img 
                src={user.avatar} 
                alt={`${user.name} ${user.last_name}`} 
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              <div className="w-full h-full rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-semibold text-lg">
                {getInitials(user.name, user.last_name)}
              </div>
            )}
          </div>
        </div>
        
        {/* User Info */}
        <div className="flex-1 min-w-0">
          <div 
            className="cursor-pointer hover:text-blue-600 transition-colors"
            onClick={() => navigate(`/user/${user.id}`)}
          >
            <h3 className="text-lg font-semibold text-gray-900 truncate">
              {user.name} {user.last_name}
            </h3>
            <p className="text-sm text-gray-500 truncate">{user.email}</p>
          </div>
          
          {user.city && (
            <p className="text-sm text-gray-600 flex items-center mt-1">
              <MapPin className="w-4 h-4 mr-1" />
              {user.city}
            </p>
          )}
          
          {user.created_at && (
            <p className="text-xs text-gray-400 mt-1">
              Приєднався {formatDate(user.created_at || '')}
            </p>
          )}
          
          {/* Показуємо статус приватності */}
          {user.privacy?.profileVisibility && (
            <p className="text-xs text-gray-500 mt-1 flex items-center">
              {user.privacy.profileVisibility === 'public' ? (
                <>
                  <Globe className="w-3 h-3 mr-1" />
                  Публічний профіль
                </>
              ) : (
                <>
                  <Lock className="w-3 h-3 mr-1" />
                  Приватний профіль
                </>
              )}
            </p>
          )}
        </div>
        
        {/* Action Buttons */}
        <div className="flex flex-col space-y-2">
          {friendStatus === 'not_friends' && (
            <div className="flex space-x-2">
                             <button
                 onClick={() => onAddFriend(user.id)}
                 className="flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
               >
                <UserPlus className="w-4 h-4 mr-2" />
                Додати в друзі
              </button>
              
              {canSendMessage(user) && (
                                 <button
                   onClick={() => navigate(`/messages?user=${user.id}`)}
                   className="flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                 >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Повідомлення
                </button>
              )}
            </div>
          )}
          
          {friendStatus === 'sent' && (
            <div className="flex items-center justify-center px-4 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm">
              <Check className="w-4 h-4 mr-2" />
              Запит надіслано
            </div>
          )}
          
          {friendStatus === 'received' && (
            <div className="flex space-x-2">
                             <button
                 onClick={() => {
                   const request = friendRequests.find(req => req.user_id === user.id);
                   if (request) onAcceptFriendRequest(request.id);
                 }}
                 className="flex items-center justify-center px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
               >
                <UserCheck className="w-4 h-4 mr-1" />
                Прийняти
              </button>
                             <button
                 onClick={() => {
                   const request = friendRequests.find(req => req.user_id === user.id);
                   if (request) onRejectFriendRequest(request.id);
                 }}
                 className="flex items-center justify-center px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
               >
                <UserX className="w-4 h-4 mr-1" />
                Відхилити
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 