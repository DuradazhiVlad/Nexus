import React, { useEffect, useState } from 'react';
import { Sidebar } from '../components/Sidebar';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { Search, MessageCircle, Users, UserPlus, UserCheck, UserX, Clock } from 'lucide-react';

interface User {
  id: string;
  name: string;
  lastname: string;
  email: string;
  avatar: string | null;
  bio: string | null;
  city: string | null;
}

interface FriendRequest {
  id: string;
  sender_id: string;
  receiver_id: string;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
}

interface UserWithFriendStatus extends User {
  friendship_status: 'none' | 'friend' | 'request_sent' | 'request_received';
  request_id?: string;
}

export function People() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<UserWithFriendStatus[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    getCurrentUser();
  }, []);

  useEffect(() => {
    if (currentUser) {
      searchUsers();
    }
  }, [currentUser, searchQuery]);

  async function getCurrentUser() {
    try {
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();

      if (authError || !authUser) {
        navigate('/login');
        return;
      }

      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('auth_user_id', authUser.id)
        .single();

      if (userError) {
        console.error('Error fetching user data:', userError);
        return;
      }

      setCurrentUser(userData);
    } catch (error) {
      console.error('Error getting current user:', error);
    } finally {
      setLoading(false);
    }
  }

  async function searchUsers() {
    if (!currentUser) return;

    try {
      let query = supabase
        .from('users')
        .select('*')
        .neq('id', currentUser.id);

      if (searchQuery.trim()) {
        query = query.or(`name.ilike.%${searchQuery}%,lastname.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`);
      }

      const { data: usersData, error } = await query.limit(50);

      if (error) throw error;

      // Отримати статуси дружби для кожного користувача
      const usersWithStatus = await Promise.all(
        (usersData || []).map(async (user) => {
          const status = await getFriendshipStatus(user.id);
          return {
            ...user,
            ...status
          };
        })
      );

      setUsers(usersWithStatus);
    } catch (error) {
      console.error('Error searching users:', error);
    }
  }

  async function getFriendshipStatus(userId: string) {
    if (!currentUser) return { friendship_status: 'none' as const };

    try {
      // Перевірити чи є дружба
      const { data: friendship } = await supabase
        .from('friendships')
        .select('*')
        .or(`and(user1_id.eq.${Math.min(currentUser.id, userId)},user2_id.eq.${Math.max(currentUser.id, userId)})`)
        .single();

      if (friendship) {
        return { friendship_status: 'friend' as const };
      }

      // Перевірити запити на дружбу
      const { data: sentRequest } = await supabase
        .from('friend_requests')
        .select('*')
        .eq('sender_id', currentUser.id)
        .eq('receiver_id', userId)
        .eq('status', 'pending')
        .single();

      if (sentRequest) {
        return { 
          friendship_status: 'request_sent' as const,
          request_id: sentRequest.id
        };
      }

      const { data: receivedRequest } = await supabase
        .from('friend_requests')
        .select('*')
        .eq('sender_id', userId)
        .eq('receiver_id', currentUser.id)
        .eq('status', 'pending')
        .single();

      if (receivedRequest) {
        return { 
          friendship_status: 'request_received' as const,
          request_id: receivedRequest.id
        };
      }

      return { friendship_status: 'none' as const };
    } catch (error) {
      console.error('Error getting friendship status:', error);
      return { friendship_status: 'none' as const };
    }
  }

  async function sendFriendRequest(userId: string) {
    if (!currentUser) return;

    setActionLoading(userId);
    try {
      const { error } = await supabase
        .from('friend_requests')
        .insert([
          {
            sender_id: currentUser.id,
            receiver_id: userId,
            status: 'pending'
          }
        ]);

      if (error) throw error;

      // Оновити список користувачів
      searchUsers();
    } catch (error) {
      console.error('Error sending friend request:', error);
    } finally {
      setActionLoading(null);
    }
  }

  async function acceptFriendRequest(requestId: string) {
    setActionLoading(requestId);
    try {
      const { error } = await supabase
        .from('friend_requests')
        .update({ status: 'accepted', updated_at: new Date().toISOString() })
        .eq('id', requestId);

      if (error) throw error;

      // Оновити список користувачів
      searchUsers();
    } catch (error) {
      console.error('Error accepting friend request:', error);
    } finally {
      setActionLoading(null);
    }
  }

  async function rejectFriendRequest(requestId: string) {
    setActionLoading(requestId);
    try {
      const { error } = await supabase
        .from('friend_requests')
        .update({ status: 'rejected', updated_at: new Date().toISOString() })
        .eq('id', requestId);

      if (error) throw error;

      // Оновити список користувачів
      searchUsers();
    } catch (error) {
      console.error('Error rejecting friend request:', error);
    } finally {
      setActionLoading(null);
    }
  }

  async function cancelFriendRequest(requestId: string) {
    setActionLoading(requestId);
    try {
      const { error } = await supabase
        .from('friend_requests')
        .delete()
        .eq('id', requestId);

      if (error) throw error;

      // Оновити список користувачів
      searchUsers();
    } catch (error) {
      console.error('Error canceling friend request:', error);
    } finally {
      setActionLoading(null);
    }
  }

  async function removeFriend(userId: string) {
    if (!currentUser) return;

    setActionLoading(userId);
    try {
      const { error } = await supabase
        .from('friendships')
        .delete()
        .or(`and(user1_id.eq.${Math.min(currentUser.id, userId)},user2_id.eq.${Math.max(currentUser.id, userId)})`);

      if (error) throw error;

      // Оновити список користувачів
      searchUsers();
    } catch (error) {
      console.error('Error removing friend:', error);
    } finally {
      setActionLoading(null);
    }
  }

  async function startConversation(user: User) {
    if (!currentUser) return;

    try {
      // Перевірити, чи існує вже розмова
      const { data: existingConv, error: searchError } = await supabase
        .from('conversations')
        .select('*')
        .or(`and(participant1_id.eq.${currentUser.id},participant2_id.eq.${user.id}),and(participant1_id.eq.${user.id},participant2_id.eq.${currentUser.id})`)
        .single();

      if (searchError && searchError.code !== 'PGRST116') {
        throw searchError;
      }

      if (!existingConv) {
        // Створити нову розмову
        const { error: createError } = await supabase
          .from('conversations')
          .insert([
            {
              participant1_id: currentUser.id,
              participant2_id: user.id
            }
          ]);

        if (createError) throw createError;
      }

      // Перейти до повідомлень
      navigate('/messages');
    } catch (error) {
      console.error('Error starting conversation:', error);
    }
  }

  const renderActionButton = (user: UserWithFriendStatus) => {
    const isLoading = actionLoading === user.id || actionLoading === user.request_id;

    switch (user.friendship_status) {
      case 'friend':
        return (
          <div className="flex space-x-2">
            <button
              onClick={() => startConversation(user)}
              className="flex items-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
            >
              <MessageCircle size={14} className="mr-1" />
              Написати
            </button>
            <button
              onClick={() => removeFriend(user.id)}
              disabled={isLoading}
              className="flex items-center px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors text-sm"
            >
              <UserX size={14} className="mr-1" />
              {isLoading ? '...' : 'Видалити'}
            </button>
          </div>
        );

      case 'request_sent':
        return (
          <button
            onClick={() => user.request_id && cancelFriendRequest(user.request_id)}
            disabled={isLoading}
            className="flex items-center px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 transition-colors text-sm"
          >
            <Clock size={14} className="mr-1" />
            {isLoading ? '...' : 'Скасувати запит'}
          </button>
        );

      case 'request_received':
        return (
          <div className="flex space-x-2">
            <button
              onClick={() => user.request_id && acceptFriendRequest(user.request_id)}
              disabled={isLoading}
              className="flex items-center px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors text-sm"
            >
              <UserCheck size={14} className="mr-1" />
              {isLoading ? '...' : 'Прийняти'}
            </button>
            <button
              onClick={() => user.request_id && rejectFriendRequest(user.request_id)}
              disabled={isLoading}
              className="flex items-center px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors text-sm"
            >
              <UserX size={14} className="mr-1" />
              {isLoading ? '...' : 'Відхилити'}
            </button>
          </div>
        );

      default:
        return (
          <button
            onClick={() => sendFriendRequest(user.id)}
            disabled={isLoading}
            className="flex items-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors text-sm"
          >
            <UserPlus size={14} className="mr-1" />
            {isLoading ? '...' : 'Додати в друзі'}
          </button>
        );
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="flex-1 ml-64 p-8">
          <div className="text-center">Завантаження...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 ml-64 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Люди</h1>
            <p className="text-gray-600">Знайдіть та додайте нових друзів</p>
          </div>

          {/* Пошук */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-3 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Пошук користувачів за ім'ям, прізвищем або email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Список користувачів */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            {users.length === 0 ? (
              <div className="p-8 text-center">
                <Users size={48} className="mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {searchQuery ? 'Користувачів не знайдено' : 'Немає користувачів'}
                </h3>
                <p className="text-gray-500">
                  {searchQuery 
                    ? 'Спробуйте змінити пошуковий запит' 
                    : 'Поки що немає інших користувачів у системі'
                  }
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {users.map((user) => (
                  <div key={user.id} className="p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="w-16 h-16 bg-gray-300 rounded-full flex items-center justify-center">
                          {user.avatar ? (
                            <img 
                              src={user.avatar} 
                              alt={user.name} 
                              className="w-full h-full rounded-full object-cover" 
                            />
                          ) : (
                            <span className="text-xl font-medium text-gray-600">
                              {user.name[0]?.toUpperCase()}
                            </span>
                          )}
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <h3 className="text-lg font-medium text-gray-900">
                              {user.name} {user.lastname}
                            </h3>
                            {user.friendship_status === 'friend' && (
                              <UserCheck size={16} className="text-green-600" />
                            )}
                            {user.friendship_status === 'request_sent' && (
                              <Clock size={16} className="text-yellow-600" />
                            )}
                            {user.friendship_status === 'request_received' && (
                              <UserPlus size={16} className="text-blue-600" />
                            )}
                          </div>
                          <p className="text-gray-600">{user.email}</p>
                          {user.city && (
                            <p className="text-sm text-gray-500">📍 {user.city}</p>
                          )}
                          {user.bio && (
                            <p className="text-sm text-gray-600 mt-1 max-w-md">{user.bio}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        {renderActionButton(user)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}