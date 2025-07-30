import React, { useState, useEffect } from 'react';
import { Sidebar } from '../../components/Sidebar';
import { supabase } from '../../lib/supabase';
import { Search, UserPlus, UserCheck } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { ErrorNotification, useErrorNotifications } from '../../components/ErrorNotification';

interface Friend {
  id: string;
  name: string;
  last_name: string;
  avatar?: string;
}

export function Friends() {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [requests, setRequests] = useState<any[]>([]); // friend_requests
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [authUser, setAuthUser] = useState(null); // auth user
  const location = useLocation();
  
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
      
      // Отримуємо друзів через friendships
      const { data, error } = await supabase
        .from('friendships')
        .select('*')
        .or(`user1_id.eq.${authUser.id},user2_id.eq.${authUser.id}`);
        
      if (error) throw error;
      
      // Отримуємо ID друзів
      const friendIds = (data || []).map(f => 
        f.user1_id === authUser.id ? f.user2_id : f.user1_id
      );
      
      // Отримуємо профілі друзів
      const { data: profiles, error: profilesError } = await supabase
        .from('user_profiles')
        .select('id, name, last_name, avatar')
        .in('auth_user_id', friendIds);
        
      if (profilesError) throw profilesError;
      
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
      
      const { data, error } = await supabase
        .from('friend_requests')
        .select('*')
        .eq('receiver_id', authUser.id)
        .eq('status', 'pending');
        
      if (error) throw error;
      
      // Отримуємо профілі відправників
      const senderIds = (data || []).map(req => req.sender_id);
      
      if (senderIds.length > 0) {
        const { data: profiles, error: profilesError } = await supabase
          .from('user_profiles')
          .select('id, name, last_name, avatar')
          .in('auth_user_id', senderIds);
          
        if (profilesError) throw profilesError;
        
        // Додаємо профілі до запитів
        const requestsWithProfiles = (data || []).map(req => {
          const sender = profiles.find(p => p.auth_user_id === req.sender_id);
          return { ...req, sender };
        });
        
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
        .from('user_profiles')
        .select('id, name, last_name, avatar')
        .or(`name.ilike.%${query}%,last_name.ilike.%${query}%`)
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
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Пошук друзів</h1>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Пошук за ім'ям або прізвищем"
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            {searchResults.length > 0 && (
              <div className="mt-4 bg-white rounded-lg shadow-sm">
                {searchResults.map((user) => (
                  <div key={user.id} className="flex items-center justify-between p-4 border-b last:border-b-0">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                        {user.avatar ? (
                          <img
                            src={user.avatar}
                            alt={user.name}
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          <span className="text-lg text-gray-600">
                            {user.name?.[0]}
                          </span>
                        )}
                      </div>
                      <div className="ml-3">
                        <p className="font-medium text-gray-900">
                          {user.name} {user.last_name}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => addFriend(user.id)}
                      className="flex items-center px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <UserPlus size={18} className="mr-1" />
                      Додати
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Запити у друзі</h2>
            {requests.length > 0 ? (
              <div className="space-y-4 mb-8">
                {requests.map((req) => (
                  <div key={req.id} className="bg-white p-4 rounded-lg shadow-sm flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                        {req.sender?.avatar ? (
                          <img src={req.sender.avatar} alt={req.sender.name} className="w-full h-full rounded-full object-cover" />
                        ) : (
                          <span className="text-lg text-gray-600">{req.sender?.name?.[0]}</span>
                        )}
                      </div>
                      <div className="ml-3">
                        <p className="font-medium text-gray-900">{req.sender?.name} {req.sender?.last_name}</p>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <button onClick={() => acceptRequest(req.id)} className="px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700">Прийняти</button>
                      <button onClick={() => rejectRequest(req.id)} className="px-3 py-1 bg-red-600 text-white rounded-lg hover:bg-red-700">Відхилити</button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-gray-600 mb-8">Немає нових запитів</div>
            )}
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Мої друзі</h2>
            {loading ? (
              <div className="text-center py-8">Завантаження...</div>
            ) : friends.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {friends.map((friend) => (
                  <div key={friend.id} className="bg-white p-4 rounded-lg shadow-sm flex items-center">
                    <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                      {friend.avatar ? (
                        <img
                          src={friend.avatar}
                          alt={friend.name}
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        <span className="text-xl text-gray-600">
                          {friend.name?.[0]}
                        </span>
                      )}
                    </div>
                    <div className="ml-4">
                      <p className="font-medium text-gray-900">
                        {friend.name} {friend.last_name}
                      </p>
                      <button className="flex items-center text-sm text-blue-600 hover:text-blue-700 mt-1">
                        <UserCheck size={16} className="mr-1" />
                        Друзі
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-600">
                У вас поки немає друзів
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}