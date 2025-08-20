import React, { useState, useEffect, useRef } from 'react';
import { Sidebar } from '../../components/Sidebar';
import { supabase } from '../../lib/supabase';
import { User, Shield, Bell, Globe, Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AuthUserService, AuthUserProfile } from '../../lib/authUserService';

interface UserSettings {
  name: string;
  last_name: string;
  email: string;
  avatar?: string;
  bio?: string;
  city?: string;
  birth_date?: string | null;
  birthday?: string | null;
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
  education?: string;
  work?: string;
  relationshipStatus?: string;
  phone?: string;
  hobbies?: string[];
  languages?: string[];
  website?: string;
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
    birthday: '',
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
    education: '',
    work: '',
    relationshipStatus: '',
    phone: '',
    hobbies: [],
    languages: [],
    website: '',
  });
  const [avatarUploading, setAvatarUploading] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [newHobby, setNewHobby] = useState('');
  const [newLanguage, setNewLanguage] = useState('');

  useEffect(() => {
    loadUserSettings();
  }, []);

  const loadUserSettings = async () => {
    try {
      const profile = await AuthUserService.getCurrentUserProfile();
      if (!profile) {
        navigate('/login');
        return;
      }
      
      // Отримуємо дані з raw_user_meta_data та user_profiles
      const metaData = profile.raw_user_meta_data || {};
      
      setSettings({
        name: metaData.name || profile.name || '',
        last_name: metaData.last_name || profile.last_name || '',
        email: profile.email || '',
        avatar: metaData.avatar || profile.avatar || '',
        bio: profile.bio || '',
        city: profile.city || '',
        birth_date: profile.birth_date || '',
        birthday: profile.birthday || '',
        notifications: profile.notifications || { email: true, messages: true, friendRequests: true },
        privacy: profile.privacy || { profileVisibility: 'public', showBirthDate: true, showEmail: false },
        education: profile.education || '',
        work: profile.work || '',
        relationshipStatus: profile.relationship_status || '',
        phone: profile.phone || '',
        hobbies: profile.hobbies || [],
        languages: profile.languages || [],
        website: profile.website || '',
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
      const safeSettings = { ...settings };
      if (!safeSettings.birth_date) safeSettings.birth_date = null;
      if (!safeSettings.birthday) safeSettings.birthday = null;
      if (!safeSettings.hobbies) safeSettings.hobbies = [];
      if (!safeSettings.languages) safeSettings.languages = [];
      
      // Оновлюємо профіль через AuthUserService
      await AuthUserService.updateProfile({
        name: safeSettings.name,
        last_name: safeSettings.last_name,
        bio: safeSettings.bio,
        city: safeSettings.city,
        birth_date: safeSettings.birth_date,
        education: safeSettings.education,
        work: safeSettings.work,
        relationship_status: safeSettings.relationshipStatus,
        phone: safeSettings.phone,
        hobbies: safeSettings.hobbies,
        languages: safeSettings.languages,
        website: safeSettings.website,
        notifications: safeSettings.notifications,
        privacy: safeSettings.privacy,
        avatar: safeSettings.avatar
      });
      
      alert('Налаштування збережено успішно');
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Помилка при збереженні налаштувань: ' + (error instanceof Error ? error.message : 'Невідома помилка'));
    }
  };

  const uploadAvatarToSupabase = async (file: File): Promise<string | null> => {
    setAvatarUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Не авторизовано');
      const fileExt = file.name.split('.').pop();
      const filePath = `${user.id}_${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from('avatar').upload(filePath, file, {
        upsert: true,
        contentType: file.type,
      });
      if (uploadError) throw uploadError;
      const { data } = supabase.storage.from('avatar').getPublicUrl(filePath);
      return data.publicUrl;
    } catch (e) {
      alert('Помилка при завантаженні аватара');
      return null;
    } finally {
      setAvatarUploading(false);
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
                      <label className="block text-sm font-medium text-gray-700">Ім'я *</label>
                      <input
                        type="text"
                        value={settings.name}
                        onChange={e => setSettings({ ...settings, name: e.target.value })}
                        required
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Прізвище *</label>
                      <input
                        type="text"
                        value={settings.last_name}
                        onChange={e => setSettings({ ...settings, last_name: e.target.value })}
                        required
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Email *</label>
                      <input
                        type="email"
                        value={settings.email}
                        onChange={e => setSettings({ ...settings, email: e.target.value })}
                        required
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Аватар</label>
                      <div className="flex items-center space-x-4">
                        {settings.avatar && (
                          <img src={settings.avatar} alt="avatar" className="w-16 h-16 rounded-full object-cover border" />
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          ref={avatarInputRef}
                          style={{ display: 'none' }}
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const url = await uploadAvatarToSupabase(file);
                              if (url) setSettings(s => ({ ...s, avatar: url }));
                            }
                          }}
                        />
                        <button
                          type="button"
                          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                          onClick={() => avatarInputRef.current?.click()}
                          disabled={avatarUploading}
                        >
                          {avatarUploading ? 'Завантаження...' : 'Завантажити аватар'}
                        </button>
                      </div>
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
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Освіта</label>
                      <input
                        type="text"
                        value={settings.education || ''}
                        onChange={e => setSettings({ ...settings, education: e.target.value })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Робота</label>
                      <input
                        type="text"
                        value={settings.work || ''}
                        onChange={e => setSettings({ ...settings, work: e.target.value })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Телефон</label>
                      <input
                        type="text"
                        value={settings.phone || ''}
                        onChange={e => setSettings({ ...settings, phone: e.target.value })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Веб-сайт</label>
                      <input
                        type="text"
                        value={settings.website || ''}
                        onChange={e => setSettings({ ...settings, website: e.target.value })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Хобі</label>
                      <div className="flex flex-wrap gap-2 mb-2">
                        {settings.hobbies?.map((hobby, idx) => (
                          <span key={idx} className="bg-blue-100 px-2 py-1 rounded-full flex items-center">
                            {hobby}
                            <button type="button" onClick={() => setSettings(s => ({
                              ...s,
                              hobbies: s.hobbies?.filter((_, i) => i !== idx)
                            }))} className="ml-1 text-red-500">×</button>
                          </span>
                        ))}
                      </div>
                      <input
                        type="text"
                        value={newHobby}
                        onChange={e => setNewHobby(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter' && newHobby.trim()) {
                            setSettings(s => ({
                              ...s,
                              hobbies: [...(s.hobbies || []), newHobby.trim()]
                            }));
                            setNewHobby('');
                          }
                        }}
                        placeholder="Додати хобі і натиснути Enter"
                        className="block w-full"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Мови</label>
                      <div className="flex flex-wrap gap-2 mb-2">
                        {settings.languages?.map((lang, idx) => (
                          <span key={idx} className="bg-green-100 px-2 py-1 rounded-full flex items-center">
                            {lang}
                            <button type="button" onClick={() => setSettings(s => ({
                              ...s,
                              languages: s.languages?.filter((_, i) => i !== idx)
                            }))} className="ml-1 text-red-500">×</button>
                          </span>
                        ))}
                      </div>
                      <input
                        type="text"
                        value={newLanguage}
                        onChange={e => setNewLanguage(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter' && newLanguage.trim()) {
                            setSettings(s => ({
                              ...s,
                              languages: [...(s.languages || []), newLanguage.trim()]
                            }));
                            setNewLanguage('');
                          }
                        }}
                        placeholder="Додати мову і натиснути Enter"
                        className="block w-full"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Сімейний стан</label>
                    <input
                      type="text"
                      value={settings.relationshipStatus || ''}
                      onChange={e => setSettings({ ...settings, relationshipStatus: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
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