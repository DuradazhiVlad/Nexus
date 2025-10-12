import React from 'react';
import { Users, UserPlus } from 'lucide-react';
import { Link } from 'react-router-dom';

interface Friend {
  id: string;
  username: string;
  avatar_url?: string;
  mutual_friends_count?: number;
}

interface FriendsSectionProps {
  friends: Friend[];
  suggestedFriends: Friend[];
  loadingFriends: boolean;
  loadingSuggestedFriends: boolean;
  currentUserId: string;
  onSendFriendRequest: (friendId: string) => Promise<void>;
}

export const FriendsSection: React.FC<FriendsSectionProps> = ({
  friends,
  suggestedFriends,
  loadingFriends,
  loadingSuggestedFriends,
  currentUserId,
  onSendFriendRequest
}) => {
  const handleSendRequest = async (friendId: string) => {
    try {
      await onSendFriendRequest(friendId);
    } catch (error) {
      console.error('Error sending friend request:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Friends Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <Users className="mr-2" size={20} />
            Друзі ({friends.length})
          </h3>
          <Link
            to="/friends"
            className="text-blue-500 hover:text-blue-600 text-sm font-medium"
          >
            Переглянути всіх
          </Link>
        </div>

        {loadingFriends ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="bg-gray-300 rounded-lg h-24 mb-2"></div>
                <div className="bg-gray-300 h-4 rounded mb-1"></div>
              </div>
            ))}
          </div>
        ) : friends.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {friends.map((friend) => (
              <Link
                key={friend.id}
                to={`/profile/${friend.id}`}
                className="group block"
              >
                <div className="text-center">
                  <div className="relative mb-2">
                    <img
                      src={friend.avatar_url || '/default-avatar.png'}
                      alt={friend.username}
                      className="w-16 h-16 rounded-lg object-cover mx-auto group-hover:scale-105 transition-transform"
                    />
                  </div>
                  <p className="text-sm font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                    {friend.username}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-8">Поки що немає друзів</p>
        )}
      </div>

      {/* Suggested Friends Section */}
      {suggestedFriends.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <UserPlus className="mr-2" size={20} />
              Можливо, ви знаєте
            </h3>
          </div>

          {loadingSuggestedFriends ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center space-x-3 animate-pulse">
                  <div className="bg-gray-300 w-12 h-12 rounded-full"></div>
                  <div className="flex-1">
                    <div className="bg-gray-300 h-4 rounded mb-1"></div>
                    <div className="bg-gray-300 h-3 rounded w-2/3"></div>
                  </div>
                  <div className="bg-gray-300 h-8 w-20 rounded"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {suggestedFriends.map((friend) => (
                <div key={friend.id} className="flex items-center space-x-3">
                  <Link to={`/profile/${friend.id}`}>
                    <img
                      src={friend.avatar_url || '/default-avatar.png'}
                      alt={friend.username}
                      className="w-12 h-12 rounded-full object-cover hover:scale-105 transition-transform"
                    />
                  </Link>
                  <div className="flex-1">
                    <Link
                      to={`/profile/${friend.id}`}
                      className="font-medium text-gray-900 hover:text-blue-600 transition-colors"
                    >
                      {friend.username}
                    </Link>
                    {friend.mutual_friends_count && friend.mutual_friends_count > 0 && (
                      <p className="text-sm text-gray-500">
                        {friend.mutual_friends_count} спільних друзів
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => handleSendRequest(friend.id)}
                    className="bg-blue-500 text-white px-3 py-1 rounded-lg text-sm hover:bg-blue-600 transition-colors"
                  >
                    Додати
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};