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
  const [error, setError] = useState<string | null>(null);
  
  const showError = (message: string) => {
    setError(message);
    setTimeout(() => setError(null), 3000);
  };
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
    // Перевіряємо чи є користувач у списку друзів
    if (user.friends && user.friends.some(friend => friend.id === userId)) {
      return 'friends';
    }
    
    // Використовуємо id для порівняння запитів
    const currentUser = friendRequests.find(req => req.user_id === userId);
    const receivedRequest = friendRequests.find(req => req.friend_id === userId);
    
    if (currentUser) return 'sent';
    if (receivedRequest) return 'received';
    return 'not_friends';
  };

  const canSendMessage = (user: User) => {
    return user.privacy?.profileVisibility === 'public';
  };

  const friendStatus = getFriendStatus(user.id);

  return (
    <div className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow h-full flex flex-col">
      {error && (
        <ErrorNotification
          type="error"
          title="Помилка"
          message={error}
          autoClose={true}
          duration={3000}
          onClose={() => setError(null)}
        />
      )}
      {/* Avatar section */}
      <div className="flex flex-col items-center mb-4">
        {/* Clickable Avatar */}
        <div 
          className="flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
          onClick={() => navigate(`/user/${user.id}`)}
        >
          <div className="w-20 h-24 rounded-lg bg-gray-200 flex items-center justify-center overflow-hidden">
            {user.avatar ? (
              <img 
                src={user.avatar} 
                alt={`${user.name} ${user.last_name}`} 
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-semibold text-base">
                {getInitials(user.name, user.last_name)}
              </div>
            )}
          </div>
        </div>
        
        {/* User name below avatar */}
        <div className="text-center mt-2">
          <h3 className="text-base font-semibold text-gray-900">
            {user.last_name} {user.name}
          </h3>
          
          {user.city && (
            <p className="text-xs text-gray-600 flex items-center justify-center mt-1">
              <MapPin className="w-3 h-3 mr-1" />
              {user.city}
            </p>
          )}
        </div>
      </div>
      
      {/* Action Buttons at bottom */}
      <div className="mt-auto">
        {friendStatus === 'not_friends' && (
          <div className="flex flex-col space-y-2">
            <button
               onClick={() => {
                 try {
                   onAddFriend(user.id);
                 } catch (error) {
                   console.error('Error adding friend:', error);
                   showError('Помилка додавання друга');
                 }
               }}
               className="flex items-center justify-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-xs w-full"
             >
               <UserPlus className="w-3 h-3 mr-1" />
               Додати в друзі
             </button>
             
             {canSendMessage(user) && (
               <button
                 onClick={() => {
                   try {
                     navigate(`/messages?user=${user.id}`);
                   } catch (error) {
                     console.error('Error navigating to messages:', error);
                     showError('Помилка відкриття повідомлень');
                   }
                 }}
                 className="flex items-center justify-center px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-xs w-full"
               >
                 <MessageCircle className="w-3 h-3 mr-1" />
                 Повідомлення
               </button>
             )}
          </div>
        )}
          
        {friendStatus === 'sent' && (
          <div className="flex items-center justify-center px-3 py-2 bg-gray-100 text-gray-600 rounded-lg text-xs w-full">
            <Check className="w-3 h-3 mr-1" />
            Запит надіслано
          </div>
        )}
          
        {friendStatus === 'received' && (
          <div className="flex flex-col space-y-2">
            <button
              onClick={() => {
                try {
                  const request = friendRequests.find(req => req.friend_id === user.id);
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
              className="flex items-center justify-center px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-xs w-full"
            >
              <UserCheck className="w-3 h-3 mr-1" />
              Прийняти
            </button>
            <button
              onClick={() => {
                try {
                  const request = friendRequests.find(req => req.friend_id === user.id);
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
              className="flex items-center justify-center px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-xs w-full"
            >
              <UserX className="w-3 h-3 mr-1" />
              Відхилити
            </button>
          </div>
        )}
        
        {friendStatus === 'friends' && (
          <div className="flex flex-col space-y-2">
            {canSendMessage(user) && (
              <button
                onClick={() => {
                  try {
                    navigate(`/messages?user=${user.id}`);
                  } catch (error) {
                    console.error('Error navigating to messages:', error);
                    showError('Помилка відкриття повідомлень');
                  }
                }}
                className="flex items-center justify-center px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-xs w-full"
              >
                <MessageCircle className="w-3 h-3 mr-1" />
                Повідомлення
              </button>
            )}
            <button
              onClick={() => {
                try {
                  onRemoveFriend(user.id);
                } catch (error) {
                  console.error('Error removing friend:', error);
                  showError('Помилка видалення друга');
                }
              }}
              className="flex items-center justify-center px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-xs w-full"
            >
              <UserX className="w-3 h-3 mr-1" />
              Видалити з друзів
            </button>
          </div>
        )}
      </div>
    </div>
  );
}