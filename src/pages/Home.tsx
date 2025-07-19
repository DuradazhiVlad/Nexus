import React, { useEffect, useState } from 'react';
import { Sidebar } from '../components/Sidebar';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { MessageCircle, Users, User } from 'lucide-react';

interface User {
  id: string;
  name: string;
  lastname: string;
  email: string;
  avatar: string | null;
}

export function Home() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalConversations: 0,
    totalMessages: 0
  });
  const navigate = useNavigate();

  useEffect(() => {
    getCurrentUser();
    getStats();
  }, []);

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

  async function getStats() {
    try {
      // Загальна кількість користувачів
      const { count: usersCount } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true });

      // Кількість розмов поточного користувача
      const { data: { user: authUser } } = await supabase.auth.getUser();
      let conversationsCount = 0;
      let messagesCount = 0;

      if (authUser) {
        const { count: convCount } = await supabase
          .from('conversations')
          .select('*', { count: 'exact', head: true })
          .or(`participant1_id.eq.${authUser.id},participant2_id.eq.${authUser.id}`);

        const { count: msgCount } = await supabase
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .eq('sender_id', authUser.id);

        conversationsCount = convCount || 0;
        messagesCount = msgCount || 0;
      }

      setStats({
        totalUsers: usersCount || 0,
        totalConversations: conversationsCount,
        totalMessages: messagesCount
      });
    } catch (error) {
      console.error('Error getting stats:', error);
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
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Вітаємо, {currentUser?.name}!
            </h1>
            <p className="text-gray-600">
              Ласкаво просимо до вашої соціальної мережі
            </p>
          </div>

          {/* Статистика */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center">
                <div className="p-3 bg-blue-100 rounded-full">
                  <Users className="text-blue-600" size={24} />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Всього користувачів</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalUsers}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center">
                <div className="p-3 bg-green-100 rounded-full">
                  <MessageCircle className="text-green-600" size={24} />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Ваші розмови</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalConversations}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center">
                <div className="p-3 bg-purple-100 rounded-full">
                  <User className="text-purple-600" size={24} />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Ваші повідомлення</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalMessages}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Швидкі дії */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Швидкі дії</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <button
                onClick={() => navigate('/profile')}
                className="p-4 text-left bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <User className="text-blue-600 mb-2" size={24} />
                <h3 className="font-medium text-gray-900">Мій профіль</h3>
                <p className="text-sm text-gray-600">Переглянути та редагувати профіль</p>
              </button>

              <button
                onClick={() => navigate('/messages')}
                className="p-4 text-left bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <MessageCircle className="text-green-600 mb-2" size={24} />
                <h3 className="font-medium text-gray-900">Повідомлення</h3>
                <p className="text-sm text-gray-600">Переписка з друзями</p>
              </button>

              <button
                onClick={() => navigate('/friends')}
                className="p-4 text-left bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Users className="text-purple-600 mb-2" size={24} />
                <h3 className="font-medium text-gray-900">Друзі</h3>
                <p className="text-sm text-gray-600">Знайти та додати друзів</p>
              </button>

              <button
                onClick={() => navigate('/settings')}
                className="p-4 text-left bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <User className="text-orange-600 mb-2" size={24} />
                <h3 className="font-medium text-gray-900">Налаштування</h3>
                <p className="text-sm text-gray-600">Налаштувати аккаунт</p>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}