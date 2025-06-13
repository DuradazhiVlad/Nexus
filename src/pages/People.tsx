import React, { useEffect, useState } from 'react';
import { Sidebar } from '../components/Sidebar';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { Search, MessageCircle, Users } from 'lucide-react';

interface User {
  id: string;
  name: string;
  lastname: string;
  email: string;
  avatar: string | null;
  bio: string | null;
  city: string | null;
}

export function People() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
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

      const { data, error } = await query.limit(50);

      if (error) throw error;

      setUsers(data || []);
    } catch (error) {
      console.error('Error searching users:', error);
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
            <p className="text-gray-600">Знайдіть та спілкуйтеся з іншими користувачами</p>
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
                          <h3 className="text-lg font-medium text-gray-900">
                            {user.name} {user.lastname}
                          </h3>
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
                        <button
                          onClick={() => startConversation(user)}
                          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          <MessageCircle size={16} className="mr-2" />
                          Написати
                        </button>
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