import React, { useState, useEffect } from 'react';
import { Sidebar } from '../components/Sidebar';
import { supabase } from '../lib/supabase';
import { Search, UserPlus, UserCheck } from 'lucide-react';

interface Friend {
  id: string;
  name: string;
  lastName: string;
  avatar?: string;
}

export function Friends() {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [searchResults, setSearchResults] = useState<Friend[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFriends();
  }, []);

  const fetchFriends = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      // Використовуємо демо-дані поки база не налаштована
      const demoFriends = [
        {
          id: '1',
          name: 'Олександр',
          lastname: 'Петренко',
          avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
          isOnline: true,
          lastSeen: new Date().toISOString()
        },
        {
          id: '2',
          name: 'Марія',
          lastname: 'Іваненко',
          avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b31c?auto=format&fit=crop&w=200&q=80',
          isOnline: false,
          lastSeen: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
        },
        {
          id: '3',
          name: 'Андрій',
          lastname: 'Коваленко',
          avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=200&q=80',
          isOnline: true,
          lastSeen: new Date().toISOString()
        }
      ];
      
      setFriends(demoFriends);
    } catch (error) {
      console.error('Error fetching friends:', error);
    } finally {
      setLoading(false);
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
        .select('id, name, lastName, avatar')
        .or(`name.ilike.%${query}%, lastName.ilike.%${query}%`)
        .limit(10);

      if (error) throw error;

      setSearchResults(data || []);
    } catch (error) {
      console.error('Error searching users:', error);
    }
  };

  const addFriend = async (friendId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Створюємо запит на дружбу
      const { error } = await supabase
        .from('friend_requests')
        .insert([
          { sender_id: user.id, receiver_id: friendId, status: 'pending' }
        ]);

      if (error) throw error;

      await fetchFriends();
    } catch (error) {
      console.error('Error adding friend:', error);
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 ml-64 p-8">
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
                          {user.name} {user.lastName}
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
                        {friend.name} {friend.lastName}
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