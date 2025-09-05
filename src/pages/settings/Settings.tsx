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
  gender?: string;
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

// Доступні варіанти для випадаючих списків
const GENDER_OPTIONS = [
  { value: '', label: 'Не вказано' },
  { value: 'male', label: 'Чоловік' },
  { value: 'female', label: 'Жінка' },
  { value: 'other', label: 'Інше' }
];

const EDUCATION_OPTIONS = [
  'Середня освіта',
  'Професійно-технічна освіта',
  'Неповна вища освіта',
  'Бакалавр',
  'Магістр',
  'Доктор філософії (PhD)',
  'Інше'
];

const RELATIONSHIP_OPTIONS = [
  'Неодружений/Незаміжня',
  'У відносинах',
  'Заручений/Заручена',
  'Одружений/Заміжня',
  'Все складно',
  'Розлучений/Розлучена',
  'Вдівець/Вдова'
];

const LANGUAGE_OPTIONS = [
  'Українська',
  'Англійська',
  'Німецька',
  'Французька',
  'Іспанська',
  'Італійська',
  'Польська',
  'Російська',
  'Китайська',
  'Японська',
  'Корейська',
  'Арабська',
  'Інша'
];

// Додаємо CSS стилі для перемикачів
const toggleStyles = `
  .toggle-label {
    width: 48px;
    height: 24px;
  }
  .toggle-dot {
    transition: transform 0.3s ease-in-out;
  }
`;

export function Settings() {
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const [settings, setSettings] = useState({
    name: '',
    last_name: '',
    email: '',
    avatar: '',
    bio: '',
    city: '',
    birth_date: '',
    birthday: '',
    gender: '',
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
  const avatarInputRef = useRef(null);
  const [newHobby, setNewHobby] = useState('');
  const [newLanguage, setNewLanguage] = useState('');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const [saveMessage, setSaveMessage] = useState('');

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
      
      // Виводимо в консоль для діагностики
      console.log('Завантажені дані профілю:', profile);
      
      // Перевіряємо, чи hobbies та languages є масивами
      const hobbies = Array.isArray(profile.hobbies) ? profile.hobbies : [];
      const languages = Array.isArray(profile.languages) ? profile.languages : [];
      
      // Перевіряємо, чи privacy та notifications є об'єктами
      const privacy = profile.privacy || {
        profileVisibility: 'public',
        showBirthDate: true,
        showEmail: false
      };
      
      const notifications = profile.notifications || {
        email: true,
        messages: true,
        friendRequests: true
      };
      
      const newSettings = {
        name: metaData.name || profile.name || '',
        last_name: metaData.last_name || profile.last_name || '',
        email: profile.email || '',
        avatar: metaData.avatar || profile.avatar || '',
        bio: profile.bio || '',
        city: profile.city || '',
        birth_date: profile.birth_date || '',
        birthday: profile.birthday || '',
        gender: profile.gender || '',
        notifications: notifications,
        privacy: privacy,
        education: profile.education || '',
        work: profile.work || '',
        relationshipStatus: profile.relationship_status || '',
        phone: profile.phone || '',
        hobbies: hobbies,
        languages: languages,
        website: profile.website || '',
      };
      
      // Виводимо в консоль налаштування перед встановленням стану
      console.log('Налаштування перед встановленням стану:', newSettings);
      
      setSettings(newSettings);
    } catch (error) {
      console.error('Error loading user settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveStatus('saving');
    setSaveMessage('');
    
    try {
      const safeSettings = { ...settings };
      if (!safeSettings.birth_date) safeSettings.birth_date = null;
      if (!safeSettings.birthday) safeSettings.birthday = null;
      if (!safeSettings.hobbies) safeSettings.hobbies = [];
      if (!safeSettings.languages) safeSettings.languages = [];
      
      // Оновлюємо профіль через AuthUserService
      const updateData = {
        name: safeSettings.name,
        last_name: safeSettings.last_name,
        bio: safeSettings.bio,
        city: safeSettings.city,
        birth_date: safeSettings.birth_date,
        gender: safeSettings.gender,
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
      };
      
      console.log('Updating profile with data:', updateData);
      await AuthUserService.updateFullProfile(updateData);
      
      setSaveStatus('success');
      setSaveMessage('Налаштування збережено успішно!');
      
      // Автоматично приховуємо повідомлення через 3 секунди
      setTimeout(() => {
        setSaveStatus('idle');
        setSaveMessage('');
      }, 3000);
    } catch (error) {
      console.error('Error saving settings:', error);
      setSaveStatus('error');
      setSaveMessage('Помилка при збереженні налаштувань: ' + (error instanceof Error ? error.message : 'Невідома помилка'));
      
      // Автоматично приховуємо повідомлення про помилку через 5 секунд
      setTimeout(() => {
        setSaveStatus('idle');
        setSaveMessage('');
      }, 5000);
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
        <div className="flex-1 lg:ml-64 p-8">
          <div className="text-center">Завантаження...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <style>{toggleStyles}</style>
      <Sidebar />
      <div className="flex-1 lg:ml-64 p-8">
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
                          <img src={settings.avatar} alt="avatar" className="w-20 h-20 rounded-full object-cover border" />
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
                      <label className="block text-sm font-medium text-gray-700">Стать</label>
                      <select
                        value={settings.gender || ''}
                        onChange={e => setSettings({ ...settings, gender: e.target.value })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      >
                        {GENDER_OPTIONS.map(option => (
                          <option key={option.value} value={option.value}>{option.label}</option>
                        ))}
                      </select>
                    </div>
                    <div></div>
                  </div>
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Освіта</label>
                      <select
                        value={settings.education || ''}
                        onChange={e => setSettings({ ...settings, education: e.target.value })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      >
                        <option value="">Виберіть рівень освіти</option>
                        {EDUCATION_OPTIONS.map(option => (
                          <option key={option} value={option}>{option}</option>
                        ))}
                      </select>
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
                      <div className="flex">
                        <select
                          value={newLanguage}
                          onChange={e => setNewLanguage(e.target.value)}
                          className="block w-full flex-1 rounded-l-md border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                        >
                          <option value="">Виберіть мову</option>
                          {LANGUAGE_OPTIONS.map(option => (
                            <option key={option} value={option}>{option}</option>
                          ))}
                        </select>
                        <button
                          type="button"
                          onClick={() => {
                            if (newLanguage.trim()) {
                              setSettings(s => ({
                                ...s,
                                languages: [...(s.languages || []), newLanguage.trim()]
                              }));
                              setNewLanguage('');
                            }
                          }}
                          className="inline-flex items-center rounded-r-md border border-l-0 border-gray-300 bg-blue-600 px-3 text-white hover:bg-blue-700"
                        >
                          Додати
                        </button>
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Сімейний стан</label>
                    <select
                      value={settings.relationshipStatus || ''}
                      onChange={e => setSettings({ ...settings, relationshipStatus: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    >
                      <option value="">Виберіть сімейний стан</option>
                      {RELATIONSHIP_OPTIONS.map(option => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
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
                    <h3 className="text-lg font-medium leading-6 text-gray-900">Налаштування приватності</h3>
                    <p className="mt-1 text-sm text-gray-500">Керуйте тим, хто може бачити вашу інформацію.</p>
                  </div>

                  <div className="space-y-6 bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-3">Видимість профілю</label>
                      <div className="grid grid-cols-3 gap-3">
                        <div 
                          className={`flex flex-col items-center p-4 rounded-lg cursor-pointer border ${settings.privacy.profileVisibility === 'public' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'}`}
                          onClick={() => setSettings({
                            ...settings,
                            privacy: { ...settings.privacy, profileVisibility: 'public' },
                          })}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className={`h-8 w-8 ${settings.privacy.profileVisibility === 'public' ? 'text-blue-500' : 'text-gray-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span className={`mt-2 text-sm font-medium ${settings.privacy.profileVisibility === 'public' ? 'text-blue-700' : 'text-gray-700'}`}>Публічний</span>
                          <span className="text-xs text-gray-500 mt-1 text-center">Доступний всім</span>
                        </div>
                        <div 
                          className={`flex flex-col items-center p-4 rounded-lg cursor-pointer border ${settings.privacy.profileVisibility === 'friends' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'}`}
                          onClick={() => setSettings({
                            ...settings,
                            privacy: { ...settings.privacy, profileVisibility: 'friends' },
                          })}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className={`h-8 w-8 ${settings.privacy.profileVisibility === 'friends' ? 'text-blue-500' : 'text-gray-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                          </svg>
                          <span className={`mt-2 text-sm font-medium ${settings.privacy.profileVisibility === 'friends' ? 'text-blue-700' : 'text-gray-700'}`}>Тільки друзі</span>
                          <span className="text-xs text-gray-500 mt-1 text-center">Тільки для друзів</span>
                        </div>
                        <div 
                          className={`flex flex-col items-center p-4 rounded-lg cursor-pointer border ${settings.privacy.profileVisibility === 'private' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'}`}
                          onClick={() => setSettings({
                            ...settings,
                            privacy: { ...settings.privacy, profileVisibility: 'private' },
                          })}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className={`h-8 w-8 ${settings.privacy.profileVisibility === 'private' ? 'text-blue-500' : 'text-gray-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                          </svg>
                          <span className={`mt-2 text-sm font-medium ${settings.privacy.profileVisibility === 'private' ? 'text-blue-700' : 'text-gray-700'}`}>Приватний</span>
                          <span className="text-xs text-gray-500 mt-1 text-center">Тільки для вас</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4 pt-4 border-t border-gray-100">
                      <h4 className="text-sm font-medium text-gray-700 mb-3">Додаткові налаштування приватності</h4>
                      
                      <div className="flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:bg-gray-50">
                        <div>
                          <label htmlFor="show-birth-date" className="text-sm font-medium text-gray-700 cursor-pointer">
                            Показувати дату народження
                          </label>
                          <p className="text-xs text-gray-500">Дозволити іншим користувачам бачити вашу дату народження</p>
                        </div>
                        <div className="relative inline-block w-12 mr-2 align-middle select-none">
                          <input 
                            type="checkbox" 
                            id="show-birth-date" 
                            checked={settings.privacy.showBirthDate}
                            onChange={e => setSettings({
                              ...settings,
                              privacy: { ...settings.privacy, showBirthDate: e.target.checked },
                            })}
                            className="sr-only" 
                          />
                          <label 
                            htmlFor="show-birth-date"
                            className={`toggle-label block overflow-hidden h-6 rounded-full cursor-pointer ${settings.privacy.showBirthDate ? 'bg-blue-500' : 'bg-gray-300'}`}
                          >
                            <span className={`toggle-dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform duration-300 ease-in-out ${settings.privacy.showBirthDate ? 'transform translate-x-6' : ''}`}></span>
                          </label>
                        </div>
                      </div>

                      <div className="flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:bg-gray-50">
                        <div>
                          <label htmlFor="show-email" className="text-sm font-medium text-gray-700 cursor-pointer">
                            Показувати електронну пошту
                          </label>
                          <p className="text-xs text-gray-500">Дозволити іншим користувачам бачити вашу електронну пошту</p>
                        </div>
                        <div className="relative inline-block w-12 mr-2 align-middle select-none">
                          <input 
                            type="checkbox" 
                            id="show-email" 
                            checked={settings.privacy.showEmail}
                            onChange={e => setSettings({
                              ...settings,
                              privacy: { ...settings.privacy, showEmail: e.target.checked },
                            })}
                            className="sr-only" 
                          />
                          <label 
                            htmlFor="show-email"
                            className={`toggle-label block overflow-hidden h-6 rounded-full cursor-pointer ${settings.privacy.showEmail ? 'bg-blue-500' : 'bg-gray-300'}`}
                          >
                            <span className={`toggle-dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform duration-300 ease-in-out ${settings.privacy.showEmail ? 'transform translate-x-6' : ''}`}></span>
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Повідомлення про статус збереження */}
                  {saveStatus !== 'idle' && (
                    <div className={`mb-4 p-4 rounded-md ${
                      saveStatus === 'success' ? 'bg-green-50 border border-green-200' :
                      saveStatus === 'error' ? 'bg-red-50 border border-red-200' :
                      'bg-blue-50 border border-blue-200'
                    }`}>
                      <div className="flex items-center">
                        {saveStatus === 'saving' && (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                        )}
                        {saveStatus === 'success' && (
                          <svg className="h-4 w-4 text-green-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        )}
                        {saveStatus === 'error' && (
                          <svg className="h-4 w-4 text-red-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                          </svg>
                        )}
                        <span className={`text-sm font-medium ${
                          saveStatus === 'success' ? 'text-green-800' :
                          saveStatus === 'error' ? 'text-red-800' :
                          'text-blue-800'
                        }`}>
                          {saveStatus === 'saving' ? 'Збереження...' : saveMessage}
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={handleSubmit}
                      disabled={saveStatus === 'saving'}
                      className={`inline-flex justify-center rounded-md border border-transparent px-4 py-2 text-sm font-medium text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                        saveStatus === 'saving' 
                          ? 'bg-gray-400 cursor-not-allowed' 
                          : 'bg-blue-600 hover:bg-blue-700'
                      }`}
                    >
                      {saveStatus === 'saving' ? 'Збереження...' : 'Зберегти'}
                    </button>
                  </div>
                </div>
              )}

              {activeTab === 'notifications' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium leading-6 text-gray-900">Налаштування сповіщень</h3>
                    <p className="mt-1 text-sm text-gray-500">Вирішіть, які сповіщення ви хочете отримувати.</p>
                  </div>

                  <div className="space-y-4 bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:bg-gray-50">
                      <div>
                        <label htmlFor="email-notifications" className="text-sm font-medium text-gray-700 cursor-pointer">
                          Сповіщення електронною поштою
                        </label>
                        <p className="text-xs text-gray-500">Отримувати сповіщення на вашу електронну пошту</p>
                      </div>
                      <div className="relative inline-block w-12 mr-2 align-middle select-none">
                        <input 
                          type="checkbox" 
                          id="email-notifications" 
                          checked={settings.notifications.email}
                          onChange={e => setSettings({
                            ...settings,
                            notifications: { ...settings.notifications, email: e.target.checked },
                          })}
                          className="sr-only" 
                        />
                        <label 
                          htmlFor="email-notifications"
                          className={`toggle-label block overflow-hidden h-6 rounded-full cursor-pointer ${settings.notifications.email ? 'bg-blue-500' : 'bg-gray-300'}`}
                        >
                          <span className={`toggle-dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform duration-300 ease-in-out ${settings.notifications.email ? 'transform translate-x-6' : ''}`}></span>
                        </label>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:bg-gray-50">
                      <div>
                        <label htmlFor="message-notifications" className="text-sm font-medium text-gray-700 cursor-pointer">
                          Сповіщення про повідомлення
                        </label>
                        <p className="text-xs text-gray-500">Отримувати сповіщення про нові повідомлення</p>
                      </div>
                      <div className="relative inline-block w-12 mr-2 align-middle select-none">
                        <input 
                          type="checkbox" 
                          id="message-notifications" 
                          checked={settings.notifications.messages}
                          onChange={e => setSettings({
                            ...settings,
                            notifications: { ...settings.notifications, messages: e.target.checked },
                          })}
                          className="sr-only" 
                        />
                        <label 
                          htmlFor="message-notifications"
                          className={`toggle-label block overflow-hidden h-6 rounded-full cursor-pointer ${settings.notifications.messages ? 'bg-blue-500' : 'bg-gray-300'}`}
                        >
                          <span className={`toggle-dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform duration-300 ease-in-out ${settings.notifications.messages ? 'transform translate-x-6' : ''}`}></span>
                        </label>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:bg-gray-50">
                      <div>
                        <label htmlFor="friend-request-notifications" className="text-sm font-medium text-gray-700 cursor-pointer">
                          Сповіщення про запити в друзі
                        </label>
                        <p className="text-xs text-gray-500">Отримувати сповіщення про нові запити в друзі</p>
                      </div>
                      <div className="relative inline-block w-12 mr-2 align-middle select-none">
                        <input 
                          type="checkbox" 
                          id="friend-request-notifications" 
                          checked={settings.notifications.friendRequests}
                          onChange={e => setSettings({
                            ...settings,
                            notifications: { ...settings.notifications, friendRequests: e.target.checked },
                          })}
                          className="sr-only" 
                        />
                        <label 
                          htmlFor="friend-request-notifications"
                          className={`toggle-label block overflow-hidden h-6 rounded-full cursor-pointer ${settings.notifications.friendRequests ? 'bg-blue-500' : 'bg-gray-300'}`}
                        >
                          <span className={`toggle-dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform duration-300 ease-in-out ${settings.notifications.friendRequests ? 'transform translate-x-6' : ''}`}></span>
                        </label>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={handleSubmit}
                      className="inline-flex justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    >
                      Зберегти
                    </button>
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