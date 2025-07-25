import React, { useState, useEffect } from 'react';
import { Sidebar } from '../components/Sidebar';
import { supabase } from '../lib/supabase';
import { User, Shield, Bell, Globe, Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getUserProfile, updateUserProfile } from '../lib/userProfileService';

interface UserSettings {
  name: string;
  last_name: string;
  email: string;
  avatar?: string;
  bio?: string;
  city?: string;
  birth_date?: string;
  notifications: {
    email: boolean;
    messages: boolean;
    friendRequests: boolean;
  };
  privacy: {
    profileVisibility: 'public' | 'friends' | 'private';
    showBirthDate: boolean;
    showEmail: boolean;
  };
}

export function Settings() {
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const [settings, setSettings] = useState<UserSettings>({
    name: '',
    last_name: '',
    email: '',
    avatar: '',
    bio: '',
    city: '',
    birth_date: '',
    notifications: {
      email: true,
      messages: true,
      friendRequests: true,
    },
    privacy: {
      profileVisibility: 'public',
      showBirthDate: true,
      showEmail: false,
    },
  });

  useEffect(() => {
    loadUserSettings();
  }, []);

  const loadUserSettings = async () => {
    try {
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
      if (authError || !authUser) {
        navigate('/login');
        return;
      }
      const data = await getUserProfile(authUser.id);
      if (!data) return;
      setSettings({
        name: data.name || '',
        last_name: data.last_name || '',
        email: data.email || '',
        avatar: data.avatar || '',
        bio: data.bio || '',
        city: data.city || '',
        birth_date: data.birth_date || '',
        notifications: data.notifications || { email: true, messages: true, friendRequests: true },
        privacy: data.privacy || { profileVisibility: 'public', showBirthDate: true, showEmail: false },
      });
    } catch (error) {
      console.error('Error loading user settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
      if (authError || !authUser) {
        navigate('/login');
        return;
      }
      await updateUserProfile(authUser.id, settings);
      alert('Налаштування збережено успішно');
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Помилка при збереженні налаштувань');
    }
  };

  const tabs = [
    { id: 'profile', label: 'Профіль', icon: User },
    { id: 'privacy', label: 'Приватність', icon: Lock },
    { id: 'notifications', label: 'Сповіщення', icon: Bell },
  ];

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
        <div className="max-w-3xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Налаштування</h1>
          
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="flex border-b border-gray-200">
              {tabs.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  className={`flex items-center px-6 py-3 text-sm font-medium ${
                    activeTab === id
                      ? 'text-blue-600 border-b-2 border-blue-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Icon size={18} className="mr-2" />
                  {label}
                </button>
              ))}
            </div>

            <div className="p-6">
              {activeTab === 'profile' && (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Ім'я</label>
                      <input
                        type="text"
                        value={settings.name}
                        onChange={e => setSettings({ ...settings, name: e.target.value })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Прізвище</label>
                      <input
                        type="text"
                        value={settings.last_name}
                        onChange={e => setSettings({ ...settings, last_name: e.target.value })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Email</label>
                      <input
                        type="email"
                        value={settings.email}
                        onChange={e => setSettings({ ...settings, email: e.target.value })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Аватар (URL)</label>
                      <input
                        type="url"
                        value={settings.avatar || ''}
                        onChange={e => setSettings({ ...settings, avatar: e.target.value })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Про себе</label>
                    <textarea
                      value={settings.bio || ''}
                      onChange={e => setSettings({ ...settings, bio: e.target.value })}
                      rows={4}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Місто</label>
                      <input
                        type="text"
                        value={settings.city || ''}
                        onChange={e => setSettings({ ...settings, city: e.target.value })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">День народження</label>
                      <input
                        type="date"
                        value={settings.birth_date || ''}
                        onChange={e => setSettings({ ...settings, birth_date: e.target.value })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    className="inline-flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                  >
                    Зберегти
                  </button>
                </form>
              )}

              {activeTab === 'privacy' && (
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Видимість профілю</label>
                    <div className="flex space-x-4 mt-2">
                      <label className="inline-flex items-center">
                        <input
                          type="radio"
                          name="profileVisibility"
                          value="public"
                          checked={settings.privacy.profileVisibility === 'public'}
                          onChange={() => setSettings({ ...settings, privacy: { ...settings.privacy, profileVisibility: 'public' } })}
                          className="form-radio h-5 w-5 text-blue-600"
                        />
                        <span className="ml-2">Публічно</span>
                      </label>
                      <label className="inline-flex items-center">
                        <input
                          type="radio"
                          name="profileVisibility"
                          value="friends"
                          checked={settings.privacy.profileVisibility === 'friends'}
                          onChange={() => setSettings({ ...settings, privacy: { ...settings.privacy, profileVisibility: 'friends' } })}
                          className="form-radio h-5 w-5 text-blue-600"
                        />
                        <span className="ml-2">Тільки друзі</span>
                      </label>
                      <label className="inline-flex items-center">
                        <input
                          type="radio"
                          name="profileVisibility"
                          value="private"
                          checked={settings.privacy.profileVisibility === 'private'}
                          onChange={() => setSettings({ ...settings, privacy: { ...settings.privacy, profileVisibility: 'private' } })}
                          className="form-radio h-5 w-5 text-blue-600"
                        />
                        <span className="ml-2">Приватно</span>
                      </label>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <label className="inline-flex items-center">
                      <input
                        type="checkbox"
                        checked={settings.privacy.showEmail}
                        onChange={e => setSettings({ ...settings, privacy: { ...settings.privacy, showEmail: e.target.checked } })}
                        className="form-checkbox h-5 w-5 text-blue-600"
                      />
                      <span className="ml-2">Показувати email</span>
                    </label>
                    <label className="inline-flex items-center">
                      <input
                        type="checkbox"
                        checked={settings.privacy.showBirthDate}
                        onChange={e => setSettings({ ...settings, privacy: { ...settings.privacy, showBirthDate: e.target.checked } })}
                        className="form-checkbox h-5 w-5 text-blue-600"
                      />
                      <span className="ml-2">Показувати дату народження</span>
                    </label>
                  </div>
                </div>
              )}

              {activeTab === 'notifications' && (
                <div className="space-y-6">
                  <div className="flex items-center space-x-4">
                    <label className="inline-flex items-center">
                      <input
                        type="checkbox"
                        checked={settings.notifications.email}
                        onChange={e => setSettings({ ...settings, notifications: { ...settings.notifications, email: e.target.checked } })}
                        className="form-checkbox h-5 w-5 text-blue-600"
                      />
                      <span className="ml-2">Email</span>
                    </label>
                    <label className="inline-flex items-center">
                      <input
                        type="checkbox"
                        checked={settings.notifications.messages}
                        onChange={e => setSettings({ ...settings, notifications: { ...settings.notifications, messages: e.target.checked } })}
                        className="form-checkbox h-5 w-5 text-blue-600"
                      />
                      <span className="ml-2">Повідомлення</span>
                    </label>
                    <label className="inline-flex items-center">
                      <input
                        type="checkbox"
                        checked={settings.notifications.friendRequests}
                        onChange={e => setSettings({ ...settings, notifications: { ...settings.notifications, friendRequests: e.target.checked } })}
                        className="form-checkbox h-5 w-5 text-blue-600"
                      />
                      <span className="ml-2">Запити в друзі</span>
                    </label>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}