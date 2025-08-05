import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { UserPlus, UserMinus, Users, UserCheck, UserX, Search, Filter } from 'lucide-react';
import { useNotifications } from '../../components/ErrorNotification';

interface Friend {
  id: string;
  name: string;
  last_name?: string;
  avatar?: string;
  auth_user_id: string;
}

interface FriendRequest {
  id: string;
  user_id: string;
  friend_id: string;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
  user: Friend;
  friend: Friend;
}

export function Friends() {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [requests, setRequests] = useState<FriendRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'online' | 'recent'>('all');
  const [authUser, setAuthUser] = useState<any>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const { addNotification } = useNotifications();

  useEffect(() => {
    loadAuthUser();
  }, []);

  useEffect(() => {
    if (currentUserId) {
      fetchFriends();
      fetchRequests();
    }
  }, [currentUserId]);

  async function loadAuthUser() {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error || !user) {
        console.error('Error getting auth user:', error);
        addNotification({
          type: 'error',
          title: 'Помилка авторизації',
          message: 'Не вдалося отримати дані користувача'
        });
        return;
      }
      setAuthUser(user);
      
      // Отримуємо ID користувача з таблиці user_profiles
      const { data: userProfile, error: profileError } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('auth_user_id', user.id)
        .single();
        
      if (profileError) {
        console.error('Error getting user profile:', profileError);
        addNotification({
          type: 'error',
          title: 'Помилка завантаження',
          message: 'Не вдалося отримати профіль користувача'
        });
        return;
      }
      
      setCurrentUserId(userProfile.id);
    } catch (error) {
      console.error('Error loading auth user:', error);
      addNotification({
        type: 'error',
        title: 'Помилка завантаження',
        message: 'Не вдалося завантажити дані користувача',
        details: error instanceof Error ? error.message : 'Невідома помилка'
      });
    }
  }

  const fetchFriends = async () => {
    try {
      if (!currentUserId) {
        addNotification({
          type: 'warning',
          title: 'Не авторизовано',
          message: 'Для перегляду друзів потрібно авторизуватися'
        });
        return;
      }
      
      console.log('🔍 Fetching friends for user ID:', currentUserId);
      
      // Отримуємо друзів через friendships
      const { data, error } = await supabase
        .from('friendships')
        .select('*')
        .or(`user1_id.eq.${currentUserId},user2_id.eq.${currentUserId}`);
        
      if (error) throw error;
      
      console.log('🔍 Friendships data:', data);
      
      // Отримуємо ID друзів (це user_profiles.id)
      const friendIds = (data || []).map(f => 
        f.user1_id === currentUserId ? f.user2_id : f.user1_id
      );
      
      console.log('🔍 Friend IDs:', friendIds);
      
      if (friendIds.length === 0) {
        setFriends([]);
        return;
      }
      
      // Отримуємо профілі друзів з таблиці user_profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('user_profiles')
        .select('id, name, last_name, avatar, auth_user_id')
        .in('id', friendIds);
        
      if (profilesError) throw profilesError;
      
      console.log('✅ Friends profiles:', profiles);
      setFriends(profiles || []);
    } catch (error) {
      console.error('Error fetching friends:', error);
      addNotification({
        type: 'error',
        title: 'Помилка завантаження',
        message: 'Не вдалося завантажити список друзів',
        details: error instanceof Error ? error.message : 'Невідома помилка',
        showRetry: true,
        onRetry: fetchFriends
      });
      setFriends([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchRequests = async () => {
    try {
      if (!currentUserId) {
        setRequests([]);
        return;
      }
      
      console.log('🔍 Fetching friend requests for user ID:', currentUserId);
      
      // Отримуємо запити на дружбу
      const { data, error } = await supabase
        .from('friend_requests')
        .select('*')
        .or(`user_id.eq.${currentUserId},friend_id.eq.${currentUserId}`)
        .eq('status', 'pending');
        
      if (error) throw error;
      
      console.log('🔍 Friend requests data:', data);
      
      if (!data || data.length === 0) {
        setRequests([]);
        return;
      }
      
      // Отримуємо ID користувачів для запитів
      const userIds = [...new Set(data.flatMap(req => [req.user_id, req.friend_id]))];
      
      // Отримуємо профілі користувачів з таблиці user_profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('user_profiles')
        .select('id, name, last_name, avatar, auth_user_id')
        .in('id', userIds);
        
      if (profilesError) throw profilesError;
      
      // Створюємо мапу профілів
      const profilesMap = (profiles || []).reduce((acc, profile) => {
        acc[profile.id] = profile;
        return acc;
      }, {} as Record<string, any>);
      
      // Додаємо профілі до запитів
      const requestsWithProfiles = data.map(request => ({
        ...request,
        user: profilesMap[request.user_id],
        friend: profilesMap[request.friend_id]
      }));
      
      console.log('✅ Friend requests with profiles:', requestsWithProfiles);
      setRequests(requestsWithProfiles);
    } catch (error) {
      console.error('Error fetching friend requests:', error);
      addNotification({
        type: 'error',
        title: 'Помилка завантаження',
        message: 'Не вдалося завантажити запити на дружбу',
        details: error instanceof Error ? error.message : 'Невідома помилка'
      });
      setRequests([]);
    }
  };

  const acceptRequest = async (requestId: string) => {
    try {
      console.log('🔍 Accepting friend request:', requestId);
      
      // Отримуємо запит
      const { data: request, error: getError } = await supabase
        .from('friend_requests')
        .select('*')
        .eq('id', requestId)
        .single();
        
      if (getError) throw getError;
      
      // Оновлюємо статус запиту
      const { error: updateError } = await supabase
        .from('friend_requests')
        .update({ status: 'accepted' })
        .eq('id', requestId);
        
      if (updateError) throw updateError;
      
      // Створюємо дружбу
      const { error: friendshipError } = await supabase
        .from('friendships')
        .insert([{
          user1_id: request.user_id,
          user2_id: request.friend_id
        }]);
        
      if (friendshipError) throw friendshipError;
      
      console.log('✅ Friend request accepted successfully');
      
      addNotification({
        type: 'success',
        title: 'Запит прийнято',
        message: 'Тепер ви друзі!'
      });
      
      // Оновлюємо дані
      fetchFriends();
      fetchRequests();
    } catch (error) {
      console.error('Error accepting friend request:', error);
      addNotification({
        type: 'error',
        title: 'Помилка',
        message: 'Не вдалося прийняти запит на дружбу',
        details: error instanceof Error ? error.message : 'Невідома помилка'
      });
    }
  };

  const rejectRequest = async (requestId: string) => {
    try {
      console.log('🔍 Rejecting friend request:', requestId);
      
      const { error } = await supabase
        .from('friend_requests')
        .update({ status: 'rejected' })
        .eq('id', requestId);
        
      if (error) throw error;
      
      console.log('✅ Friend request rejected successfully');
      
      addNotification({
        type: 'success',
        title: 'Запит відхилено',
        message: 'Запит на дружбу було відхилено'
      });
      
      // Оновлюємо дані
      fetchRequests();
    } catch (error) {
      console.error('Error rejecting friend request:', error);
      addNotification({
        type: 'error',
        title: 'Помилка',
        message: 'Не вдалося відхилити запит на дружбу',
        details: error instanceof Error ? error.message : 'Невідома помилка'
      });
    }
  };

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    
    if (!query.trim()) {
      fetchFriends();
      return;
    }
    
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('id, name, last_name, avatar, auth_user_id')
        .or(`name.ilike.%${query}%,last_name.ilike.%${query}%`)
        .limit(10);
        
      if (error) throw error;
      
      setFriends(data || []);
    } catch (error) {
      console.error('Error searching friends:', error);
      addNotification({
        type: 'error',
        title: 'Помилка пошуку',
        message: 'Не вдалося виконати пошук',
        details: error instanceof Error ? error.message : 'Невідома помилка'
      });
    }
  };

  const addFriend = async (friendId: string) => {
    try {
      console.log('🔍 Sending friend request to:', friendId);
      
      const { error } = await supabase
        .from('friend_requests')
        .insert([{
          user_id: currentUserId,
          friend_id: friendId,
          status: 'pending'
        }]);
        
      if (error) throw error;
      
      console.log('✅ Friend request sent successfully');
      
      addNotification({
        type: 'success',
        title: 'Запит відправлено',
        message: 'Запит на дружбу було відправлено'
      });
    } catch (error) {
      console.error('Error sending friend request:', error);
      addNotification({
        type: 'error',
        title: 'Помилка',
        message: 'Не вдалося відправити запит на дружбу',
        details: error instanceof Error ? error.message : 'Невідома помилка'
      });
    }
  };

  const removeFriend = async (friendId: string) => {
    try {
      console.log('🔍 Removing friend:', friendId);
      
      const { error } = await supabase
        .from('friendships')
        .delete()
        .or(`and(user1_id.eq.${currentUserId},user2_id.eq.${friendId}),and(user1_id.eq.${friendId},user2_id.eq.${currentUserId})`);
        
      if (error) throw error;
      
      console.log('✅ Friend removed successfully');
      
      addNotification({
        type: 'success',
        title: 'Друга видалено',
        message: 'Користувача було видалено з друзів'
      });
      
      // Оновлюємо список друзів
      fetchFriends();
    } catch (error) {
      console.error('Error removing friend:', error);
      addNotification({
        type: 'error',
        title: 'Помилка',
        message: 'Не вдалося видалити друга',
        details: error instanceof Error ? error.message : 'Невідома помилка'
      });
    }
  };

  const filteredFriends = friends.filter(friend => {
    const matchesSearch = !searchQuery || 
      friend.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (friend.last_name && friend.last_name.toLowerCase().includes(searchQuery.toLowerCase()));
    
    // Тут можна додати фільтрацію за статусом (онлайн, останній раз тощо)
    return matchesSearch;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Завантаження друзів...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Users className="h-6 w-6 text-blue-600" />
                <h1 className="text-2xl font-bold text-gray-900">Друзі</h1>
                <span className="bg-blue-100 text-blue-800 text-sm font-medium px-2.5 py-0.5 rounded-full">
                  {friends.length}
                </span>
              </div>
              
              <div className="flex items-center space-x-4">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <input
                    type="text"
                    placeholder="Пошук друзів..."
                    value={searchQuery}
                    onChange={(e) => handleSearch(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                {/* Filter */}
                <div className="relative">
                  <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <select
                    value={filter}
                    onChange={(e) => setFilter(e.target.value as 'all' | 'online' | 'recent')}
                    className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white"
                  >
                    <option value="all">Всі друзі</option>
                    <option value="online">Онлайн</option>
                    <option value="recent">Останні</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            {/* Friend Requests */}
            {requests.length > 0 && (
              <div className="mb-8">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <UserPlus className="h-5 w-5 text-orange-500 mr-2" />
                  Запити на дружбу ({requests.length})
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {requests.map((request) => (
                    <div key={request.id} className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0">
                          <img
                            src={request.user.avatar || '/default-avatar.png'}
                            alt={request.user.name}
                            className="h-10 w-10 rounded-full"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900">
                            {request.user.name} {request.user.last_name}
                          </p>
                          <p className="text-xs text-gray-500">
                            Хоче додати вас у друзі
                          </p>
                        </div>
                      </div>
                      <div className="mt-3 flex space-x-2">
                        <button
                          onClick={() => acceptRequest(request.id)}
                          className="flex-1 bg-green-600 text-white text-xs px-3 py-1.5 rounded-md hover:bg-green-700 transition-colors flex items-center justify-center"
                        >
                          <UserCheck className="h-3 w-3 mr-1" />
                          Прийняти
                        </button>
                        <button
                          onClick={() => rejectRequest(request.id)}
                          className="flex-1 bg-red-600 text-white text-xs px-3 py-1.5 rounded-md hover:bg-red-700 transition-colors flex items-center justify-center"
                        >
                          <UserX className="h-3 w-3 mr-1" />
                          Відхилити
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Friends List */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Users className="h-5 w-5 text-blue-500 mr-2" />
                Мої друзі
              </h2>
              
              {filteredFriends.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">
                    {searchQuery ? 'Друзів не знайдено' : 'У вас поки немає друзів'}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredFriends.map((friend) => (
                    <div key={friend.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0">
                          <img
                            src={friend.avatar || '/default-avatar.png'}
                            alt={friend.name}
                            className="h-10 w-10 rounded-full"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900">
                            {friend.name} {friend.last_name}
                          </p>
                          <p className="text-xs text-gray-500">
                            Онлайн
                          </p>
                        </div>
                        <button
                          onClick={() => removeFriend(friend.id)}
                          className="text-red-600 hover:text-red-800 transition-colors"
                          title="Видалити друга"
                        >
                          <UserMinus className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}