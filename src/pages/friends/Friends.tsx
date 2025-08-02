import React, { useState, useEffect } from 'react';
import { Sidebar } from '../../components/Sidebar';
import { supabase } from '../../lib/supabase';
import { Search, UserPlus, UserCheck, Users, MessageCircle, User } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ErrorNotification, useErrorNotifications } from '../../components/ErrorNotification';

interface Friend {
  id: string;
  name: string;
  lastname?: string;
  avatar?: string;
  auth_user_id: string;
}

export function Friends() {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [requests, setRequests] = useState<any[]>([]); // friend_requests
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [authUser, setAuthUser] = useState(null); // auth user
  const location = useLocation();
  const navigate = useNavigate();
  
  // Modern error handling
  const { notifications, addNotification, removeNotification } = useErrorNotifications();

  useEffect(() => {
    loadAuthUser();
  }, [location.key]);

  useEffect(() => {
    if (authUser) {
      fetchFriends();
      fetchRequests();
    }
  }, [authUser]);

  async function loadAuthUser() {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error || !user) {
        addNotification({
          type: 'error',
          title: 'Помилка авторизації',
          message: 'Не вдалося отримати дані користувача'
        });
        return;
      }
      setAuthUser(user);
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
      if (!authUser) {
        addNotification({
          type: 'warning',
          title: 'Не авторизовано',
          message: 'Для перегляду друзів потрібно авторизуватися'
        });
        return;
      }
      
      console.log('🔍 Fetching friends for auth user:', authUser.id);
      
      // Отримуємо друзів через friendships
      const { data, error } = await supabase
        .from('friendships')
        .select('*')
        .or(`user1_id.eq.${authUser.id},user2_id.eq.${authUser.id}`);
        
      if (error) throw error;
      
      console.log('🔍 Friendships data:', data);
      
      // Отримуємо ID друзів (це auth.users.id)
      const friendAuthIds = (data || []).map(f => 
        f.user1_id === authUser.id ? f.user2_id : f.user1_id
      );
      
      console.log('🔍 Friend auth IDs:', friendAuthIds);
      
      if (friendAuthIds.length === 0) {
        setFriends([]);
        return;
      }
      
      // Отримуємо профілі друзів з таблиці users
      const { data: profiles, error: profilesError } = await supabase
        .from('users')
        .select('id, name, lastname, avatar, auth_user_id')
        .in('auth_user_id', friendAuthIds);
        
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
      if (!authUser) {
        setRequests([]);
        return;
      }
      
      console.log('🔍 Fetching friend requests for auth user:', authUser.id);
      
      const { data, error } = await supabase
        .from('friend_requests')
        .select('*')
        .eq('receiver_id', authUser.id)
        .eq('status', 'pending');
        
      if (error) throw error;
      
      console.log('🔍 Friend requests data:', data);
      
      // Отримуємо профілі відправників з таблиці users
      const senderIds = (data || []).map(req => req.sender_id);
      
      if (senderIds.length > 0) {
        const { data: profiles, error: profilesError } = await supabase
          .from('users')
          .select('id, name, lastname, avatar, auth_user_id')
          .in('auth_user_id', senderIds);
          
        if (profilesError) throw profilesError;
        
        console.log('🔍 Sender profiles:', profiles);
        
        // Додаємо профілі до запитів
        const requestsWithProfiles = (data || []).map(req => {
          const sender = profiles.find(p => p.auth_user_id === req.sender_id);
          return { ...req, sender };
        });
        
        console.log('✅ Requests with profiles:', requestsWithProfiles);
        setRequests(requestsWithProfiles);
      } else {
        setRequests([]);
      }
    } catch (error) {
      console.error('Error fetching requests:', error);
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
      const { error } = await supabase
        .from('friend_requests')
        .update({ status: 'accepted' })
        .eq('id', requestId);
        
      if (error) throw error;
      
      addNotification({
        type: 'success',
        title: 'Успішно!',
        message: 'Запит на дружбу прийнято!',
        autoClose: true,
        duration: 3000
      });
      
      fetchFriends();
      fetchRequests();
    } catch (error) {
      console.error('Error accepting request:', error);
      addNotification({
        type: 'error',
        title: 'Помилка',
        message: 'Не вдалося прийняти запит на дружбу',
        details: error instanceof Error ? error.message : 'Невідома помилка',
        showRetry: true,
        onRetry: () => acceptRequest(requestId)
      });
    }
  };

  const rejectRequest = async (requestId: string) => {
    try {
      const { error } = await supabase
        .from('friend_requests')
        .update({ status: 'rejected' })
        .eq('id', requestId);
        
      if (error) throw error;
      
      addNotification({
        type: 'success',
        title: 'Успішно!',
        message: 'Запит на дружбу відхилено!',
        autoClose: true,
        duration: 3000
      });
      
      fetchRequests();
    } catch (error) {
      console.error('Error rejecting request:', error);
      addNotification({
        type: 'error',
        title: 'Помилка',
        message: 'Не вдалося відхилити запит на дружбу',
        details: error instanceof Error ? error.message : 'Невідома помилка',
        showRetry: true,
        onRetry: () => rejectRequest(requestId)
      });
    }
  };

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, name, lastname, avatar, auth_user_id')
        .or(`name.ilike.%${query}%,lastname.ilike.%${query}%`)
        .limit(10);
      if (error) throw error;
      setSearchResults(data || []);
    } catch (error) {
      console.error('Error searching users:', error);
      addNotification({
        type: 'error',
        title: 'Помилка пошуку',
        message: 'Не вдалося виконати пошук користувачів',
        details: error instanceof Error ? error.message : 'Невідома помилка'
      });
    }
  };

  const addFriend = async (friendId: string) => {
    try {
      if (!authUser) {
        addNotification({
          type: 'warning',
          title: 'Не авторизовано',
          message: 'Для додавання в друзі потрібно авторизуватися'
        });
        return;
      }

      console.log('🔍 Adding friend request:', { sender_id: authUser.id, receiver_id: friendId });

      // Створюємо запит на дружбу
      const { error } = await supabase
        .from('friend_requests')
        .insert([
          { sender_id: authUser.id, receiver_id: friendId, status: 'pending' }
        ]);

      if (error) throw error;

      addNotification({
        type: 'success',
        title: 'Успішно!',
        message: 'Запит на дружбу надіслано!',
        autoClose: true,
        duration: 3000
      });

      await fetchFriends();
    } catch (error) {
      console.error('Error adding friend:', error);
      addNotification({
        type: 'error',
        title: 'Помилка',
        message: 'Не вдалося надіслати запит на дружбу',
        details: error instanceof Error ? error.message : 'Невідома помилка',
        showRetry: true,
        onRetry: () => addFriend(friendId)
      });
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 ml-64 p-8">
        {/* Error Notifications */}
        {notifications.map((notification) => (
          <ErrorNotification
            key={notification.id}
            {...notification}
            onClose={() => removeNotification(notification.id)}
          />
        ))}
        
        <div className="max-w-3xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Друзі</h1>
            <p className="text-gray-600">Керуйте своїми друзями та запитами на дружбу</p>
          </div>

          {/* Search Section */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Знайти користувачів</h2>
            <div className="flex space-x-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Пошук за ім'ям або прізвищем..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            
            {searchResults.length > 0 && (
              <div className="mt-4">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Результати пошуку:</h3>
                <div className="space-y-2">
                  {searchResults.map((user) => (
                    <div key={user.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                          {user.avatar ? (
                            <img src={user.avatar} alt={user.name} className="w-full h-full rounded-full object-cover" />
                          ) : (
                            <span className="text-gray-600 font-semibold">
                              {user.name?.[0]}{user.lastname?.[0]}
                            </span>
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{user.name} {user.lastname}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => addFriend(user.auth_user_id)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                      >
                        <UserPlus className="w-4 h-4 mr-2 inline" />
                        Додати
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Friend Requests */}
          {requests.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Запити на дружбу</h2>
              <div className="space-y-4">
                {requests.map((request) => (
                  <div key={request.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
                        {request.sender?.avatar ? (
                          <img src={request.sender.avatar} alt={request.sender.name} className="w-full h-full rounded-full object-cover" />
                        ) : (
                          <span className="text-gray-600 font-semibold">
                            {request.sender?.name?.[0]}{request.sender?.lastname?.[0]}
                          </span>
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{request.sender?.name} {request.sender?.lastname}</p>
                        <p className="text-sm text-gray-500">Надіслав запит на дружбу</p>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => acceptRequest(request.id)}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                      >
                        Прийняти
                      </button>
                      <button
                        onClick={() => rejectRequest(request.id)}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
                      >
                        Відхилити
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Friends List */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Мої друзі ({friends.length})</h2>
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-gray-500 mt-2">Завантаження...</p>
              </div>
            ) : friends.length === 0 ? (
              <div className="text-center py-8">
                <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">У вас поки немає друзів</p>
                <p className="text-sm text-gray-400 mt-1">Знайдіть друзів через пошук вище</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {friends.map((friend) => (
                  <div key={friend.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
                        {friend.avatar ? (
                          <img src={friend.avatar} alt={friend.name} className="w-full h-full rounded-full object-cover" />
                        ) : (
                                                      <span className="text-gray-600 font-semibold">
                              {friend.name?.[0]}{friend.lastname?.[0]}
                            </span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div 
                          className="cursor-pointer hover:text-blue-600 transition-colors"
                          onClick={() => navigate(`/user/${friend.id}`)}
                        >
                          <p className="font-medium text-gray-900 truncate">{friend.name} {friend.lastname}</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => navigate(`/messages?user=${friend.id}`)}
                        className="flex-1 flex items-center justify-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                      >
                        <MessageCircle className="w-4 h-4 mr-1" />
                        Повідомлення
                      </button>
                      <button
                        onClick={() => navigate(`/user/${friend.id}`)}
                        className="flex items-center justify-center px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                        title="Переглянути профіль"
                      >
                        <User className="w-4 h-4" />
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
  );
}