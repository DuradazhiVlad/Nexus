import React, { useState, useEffect } from 'react';
import { Sidebar } from '../components/Sidebar';
import { supabase } from '../lib/supabase';
import { Search, UserPlus, MessageCircle, Calendar, MapPin, Mail } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface User {
  id: string;
  auth_user_id: string;
  name: string;
  lastName: string;
  email: string;
  avatar?: string;
  bio?: string;
  city?: string;
  birthDate?: string;
  date: string;
}

export function People() {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredUsers(users);
    } else {
      const filtered = users.filter(user =>
        user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (user.city && user.city.toLowerCase().includes(searchQuery.toLowerCase()))
      );
      setFilteredUsers(filtered);
    }
  }, [searchQuery, users]);

  const fetchUsers = async () => {
    try {
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !authUser) {
        navigate('/login');
        return;
      }

      setCurrentUser(authUser.id);

      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('date', { ascending: false });

      if (error) throw error;

      // Фільтруємо поточного користувача зі списку
      let otherUsers = data?.filter(user => user.auth_user_id !== authUser.id) || [];
      // Додаємо фільтрацію: не показувати користувачів з помилками (без id, name, lastName, email)
      otherUsers = otherUsers.filter(user => user && user.id && user.name && user.lastName && user.email);
      setUsers(otherUsers);
      setFilteredUsers(otherUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
      setUsers([]);
      setFilteredUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const addFriend = async (friendId: string) => {
    try {
      if (!currentUser) return;

      const { error } = await supabase
        .from('friends')
        .insert([
          { user_id: currentUser, friend_id: friendId }
        ]);

      if (error) throw error;

      alert('Запит на дружбу надіслано!');
    } catch (error) {
      console.error('Error adding friend:', error);
      alert('Помилка при додаванні в друзі');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('uk-UA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
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
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Люди</h1>
            <p className="text-gray-600">Знайдіть нових друзів та розширте свою мережу</p>
          </div>

          <div className="mb-6">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Пошук за ім'ям, прізвищем, email або містом"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Знайдено {filteredUsers.length} {filteredUsers.length === 1 ? 'користувач' : 'користувачів'}
            </p>
          </div>

          {filteredUsers.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredUsers.map((user) => (
                <div
                  key={user.id}
                  className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow duration-200 cursor-pointer group"
                  onClick={() => navigate(`/profile/${user.id}`)}
                >
                  <div className="p-6">
                    <div className="flex items-center mb-4">
                      <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xl font-bold overflow-hidden">
                        {user.avatar ? (
                          <img
                            src={user.avatar}
                            alt={user.name}
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          <span>
                            {user.name[0]?.toUpperCase()}{user.lastName[0]?.toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div className="ml-4 flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 group-hover:underline">
                          {user.name} {user.lastName}
                        </h3>
                        <div className="flex items-center text-sm text-gray-500 mt-1">
                          <Calendar size={14} className="mr-1" />
                          Приєднався {formatDate(user.date)}
                        </div>
                      </div>
                    </div>

                    {user.bio && (
                      <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                        {user.bio}
                      </p>
                    )}

                    <div className="space-y-2 mb-4">
                      {user.city && (
                        <div className="flex items-center text-sm text-gray-600">
                          <MapPin size={14} className="mr-2 text-gray-400" />
                          {user.city}
                        </div>
                      )}
                      <div className="flex items-center text-sm text-gray-600">
                        <Mail size={14} className="mr-2 text-gray-400" />
                        {user.email}
                      </div>
                    </div>

                    <div className="flex space-x-2">
                      <button
                        onClick={e => { e.stopPropagation(); addFriend(user.auth_user_id); }}
                        className="flex-1 flex items-center justify-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                      >
                        <UserPlus size={16} className="mr-1" />
                        Додати в друзі
                      </button>
                      <button
                        onClick={e => { e.stopPropagation(); navigate(`/messages?user=${user.id}`); }}
                        className="flex items-center justify-center px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <MessageCircle size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search size={32} className="text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Користувачів не знайдено
              </h3>
              <p className="text-gray-600">
                {searchQuery 
                  ? 'Спробуйте змінити критерії пошуку'
                  : 'Поки що немає зареєстрованих користувачів'
                }
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}