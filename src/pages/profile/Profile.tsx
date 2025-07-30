import React, { useState, useEffect } from 'react';
import { Sidebar } from '../../components/Sidebar';
import { supabase } from '../../lib/supabase';
import { DatabaseService } from '../../lib/database';
import { 
  User, 
  Mail, 
  MapPin, 
  Calendar, 
  Edit3, 
  Camera, 
  Save, 
  X, 
  Settings,
  Heart,
  MessageCircle,
  Users,
  Image as ImageIcon,
  Plus,
  Upload,
  Check,
  AlertCircle
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

interface UserProfile {
  id: string;
  auth_user_id: string;
  name: string;
  last_name?: string;
  email: string;
  avatar?: string;
  bio?: string;
  city?: string;
  birth_date?: string;
  email_verified?: boolean;
  created_at?: string;
  updated_at?: string;
  notifications?: {
    email: boolean;
    messages: boolean;
    friendRequests: boolean;
  };
  privacy?: {
    profileVisibility: 'public' | 'friends' | 'private';
    showBirthDate: boolean;
    showEmail: boolean;
  };
}

export function Profile() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  
  // Form states
  const [editForm, setEditForm] = useState({
    name: '',
    last_name: '',
    email: '',
    bio: '',
    city: '',
    birth_date: '',
    avatar: '',
    notifications: {
      email: true,
      messages: true,
      friendRequests: true
    },
    privacy: {
      profileVisibility: 'public' as const,
      showBirthDate: true,
      showEmail: false
    }
  });

  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    loadProfile();
  }, [location.key]);

  const loadProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔍 Loading profile...');
      
      // Отримуємо поточного користувача
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
      
      if (authError) {
        console.error('Auth error:', authError);
        throw new Error(`Помилка аутентифікації: ${authError.message}`);
      }
      
      if (!authUser) {
        console.log('No authenticated user, redirecting to login');
        navigate('/login');
        return;
      }
      
      console.log('✅ Authenticated user:', authUser.email);
      setCurrentUser(authUser);
      
      // Отримуємо профіль користувача
      const userProfile = await DatabaseService.getCurrentUserProfile();
      
      if (!userProfile) {
        console.log('No user profile found, creating new one');
        // Створюємо новий профіль
        const newProfile = {
          auth_user_id: authUser.id,
          name: authUser.user_metadata?.full_name?.split(' ')[0] || 'Користувач',
          last_name: authUser.user_metadata?.full_name?.split(' ').slice(1).join(' ') || '',
          email: authUser.email || '',
          bio: '',
          city: '',
          birth_date: '',
          avatar: '',
          email_verified: authUser.email_confirmed_at ? true : false,
          notifications: {
            email: true,
            messages: true,
            friendRequests: true
          },
          privacy: {
            profileVisibility: 'public' as const,
            showBirthDate: true,
            showEmail: false
          }
        };
        
        // Зберігаємо новий профіль
        const { data: savedProfile, error: saveError } = await supabase
          .from('user_profiles')
          .insert([newProfile])
          .select()
          .single();
          
        if (saveError) throw saveError;
        
        setProfile(savedProfile);
        setEditForm({
          name: savedProfile.name,
          last_name: savedProfile.last_name || '',
          email: savedProfile.email,
          bio: savedProfile.bio || '',
          city: savedProfile.city || '',
          birth_date: savedProfile.birth_date || '',
          avatar: savedProfile.avatar || '',
          notifications: savedProfile.notifications || {
            email: true,
            messages: true,
            friendRequests: true
          },
          privacy: savedProfile.privacy || {
            profileVisibility: 'public',
            showBirthDate: true,
            showEmail: false
          }
        });
      } else {
        console.log('✅ User profile loaded:', userProfile);
        setProfile(userProfile);
        setEditForm({
          name: userProfile.name,
          last_name: userProfile.last_name || '',
          email: userProfile.email,
          bio: userProfile.bio || '',
          city: userProfile.city || '',
          birth_date: userProfile.birth_date || '',
          avatar: userProfile.avatar || '',
          notifications: userProfile.notifications || {
            email: true,
            messages: true,
            friendRequests: true
          },
          privacy: userProfile.privacy || {
            profileVisibility: 'public',
            showBirthDate: true,
            showEmail: false
          }
        });
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      setError(error instanceof Error ? error.message : 'Помилка завантаження профілю');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    try {
      setSaving(true);
      setError(null);
      
      if (!currentUser) {
        throw new Error('Користувач не авторизований');
      }
      
      const updates = {
        name: editForm.name,
        last_name: editForm.last_name,
        email: editForm.email,
        bio: editForm.bio,
        city: editForm.city,
        birth_date: editForm.birth_date,
        avatar: editForm.avatar,
        notifications: editForm.notifications,
        privacy: editForm.privacy,
        updated_at: new Date().toISOString()
      };
      
      const { error } = await supabase
        .from('user_profiles')
        .update(updates)
        .eq('auth_user_id', currentUser.id);
        
      if (error) throw error;
      
      setSuccess('Профіль успішно оновлено!');
      setIsEditing(false);
      loadProfile(); // Перезавантажуємо профіль
      
      // Очищаємо повідомлення через 3 секунди
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      console.error('Error saving profile:', error);
      setError(error instanceof Error ? error.message : 'Помилка збереження профілю');
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setError(null);
    // Відновлюємо оригінальні дані
    if (profile) {
      setEditForm({
        name: profile.name,
        last_name: profile.last_name || '',
        email: profile.email,
        bio: profile.bio || '',
        city: profile.city || '',
        birth_date: profile.birth_date || '',
        avatar: profile.avatar || '',
        notifications: profile.notifications || {
          email: true,
          messages: true,
          friendRequests: true
        },
        privacy: profile.privacy || {
          profileVisibility: 'public',
          showBirthDate: true,
          showEmail: false
        }
      });
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Не вказано';
    return new Date(dateString).toLocaleDateString('uk-UA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getInitials = (name?: string, lastname?: string) => {
    const first = name ? name[0].toUpperCase() : '';
    const last = lastname ? lastname[0].toUpperCase() : '';
    return `${first}${last}`;
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1 ml-64 p-8">
          <div className="max-w-4xl mx-auto">
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Завантаження профілю...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error && !profile) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1 ml-64 p-8">
          <div className="max-w-4xl mx-auto">
            <div className="text-center py-12">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Помилка завантаження</h2>
              <p className="text-gray-600 mb-4">{error}</p>
              <button
                onClick={loadProfile}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Спробувати знову
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1 ml-64 p-8">
          <div className="max-w-4xl mx-auto">
            <div className="text-center py-12">
              <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Профіль не знайдено</h2>
              <p className="text-gray-600">Не вдалося завантажити дані профілю</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 ml-64 p-8">
        <div className="max-w-4xl mx-auto">
          {/* Success/Error Messages */}
          {success && (
            <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center">
              <Check className="h-5 w-5 mr-2" />
              {success}
            </div>
          )}
          
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center">
              <AlertCircle className="h-5 w-5 mr-2" />
              {error}
            </div>
          )}

          {/* Profile Header */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden mb-6">
            {/* Cover Photo */}
            <div className="h-48 bg-gradient-to-r from-blue-500 to-purple-600 relative">
              <div className="absolute inset-0 bg-black bg-opacity-20"></div>
            </div>

            {/* Profile Info */}
            <div className="relative px-6 pb-6">
              {/* Avatar */}
              <div className="flex items-end justify-between -mt-16 mb-4">
                <div className="relative">
                  <div className="w-32 h-32 bg-white rounded-full p-2 shadow-lg">
                    {profile.avatar ? (
                      <img
                        src={profile.avatar}
                        alt={profile.name}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold">
                        {getInitials(profile.name, profile.last_name)}
                      </div>
                    )}
                  </div>
                  {isEditing && (
                    <button className="absolute bottom-2 right-2 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center hover:bg-blue-700 transition-colors">
                      <Camera size={16} />
                    </button>
                  )}
                </div>

                {/* Edit Button */}
                <div className="flex space-x-2">
                  {!isEditing ? (
                    <>
                      <button
                        onClick={() => setIsEditing(true)}
                        className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        <Edit3 size={16} className="mr-2" />
                        Редагувати профіль
                      </button>
                      <button
                        onClick={() => navigate('/settings')}
                        className="flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <Settings size={16} className="mr-2" />
                        Налаштування
                      </button>
                    </>
                  ) : (
                    <div className="flex space-x-2">
                      <button
                        onClick={handleSaveProfile}
                        disabled={saving}
                        className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {saving ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        ) : (
                          <Save size={16} className="mr-2" />
                        )}
                        {saving ? 'Збереження...' : 'Зберегти'}
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        disabled={saving}
                        className="flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
                      >
                        <X size={16} className="mr-2" />
                        Скасувати
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* User Info */}
              <div className="space-y-4">
                {!isEditing ? (
                  <>
                    <div>
                      <h1 className="text-3xl font-bold text-gray-900">
                        {profile.name} {profile.last_name}
                      </h1>
                      <p className="text-gray-600 flex items-center mt-1">
                        <Mail size={16} className="mr-2" />
                        {profile.email}
                      </p>
                    </div>

                    {profile.bio && (
                      <p className="text-gray-700 text-lg leading-relaxed">
                        {profile.bio}
                      </p>
                    )}

                    <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                      {profile.city && (
                        <div className="flex items-center">
                          <MapPin size={16} className="mr-1" />
                          {profile.city}
                        </div>
                      )}
                      <div className="flex items-center">
                        <Calendar size={16} className="mr-1" />
                        Приєднався {formatDate(profile.created_at)}
                      </div>
                      {profile.birth_date && (
                        <div className="flex items-center">
                          <Calendar size={16} className="mr-1" />
                          Народився {formatDate(profile.birth_date)}
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Ім'я *
                        </label>
                        <input
                          type="text"
                          value={editForm.name}
                          onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Введіть ім'я"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Прізвище
                        </label>
                        <input
                          type="text"
                          value={editForm.last_name}
                          onChange={(e) => setEditForm(prev => ({ ...prev, last_name: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Введіть прізвище"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email
                      </label>
                      <input
                        type="email"
                        value={editForm.email}
                        onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Введіть email"
                        disabled={true} // Email не може бути змінений
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Про себе
                      </label>
                      <textarea
                        value={editForm.bio}
                        onChange={(e) => setEditForm(prev => ({ ...prev, bio: e.target.value }))}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Розкажіть про себе"
                        maxLength={500}
                      />
                      <p className="text-xs text-gray-500 mt-1">{editForm.bio.length}/500</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Місто
                        </label>
                        <input
                          type="text"
                          value={editForm.city}
                          onChange={(e) => setEditForm(prev => ({ ...prev, city: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Введіть місто"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Дата народження
                        </label>
                        <input
                          type="date"
                          value={editForm.birth_date}
                          onChange={(e) => setEditForm(prev => ({ ...prev, birth_date: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Аватар (URL)
                      </label>
                      <input
                        type="url"
                        value={editForm.avatar}
                        onChange={(e) => setEditForm(prev => ({ ...prev, avatar: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="https://example.com/avatar.jpg"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Показувати дату народження
                        </label>
                        <select
                          value={editForm.privacy.showBirthDate ? 'true' : 'false'}
                          onChange={(e) => setEditForm(prev => ({
                            ...prev,
                            privacy: { ...prev.privacy, showBirthDate: e.target.value === 'true' }
                          }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="true">Так</option>
                          <option value="false">Ні</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Показувати email
                        </label>
                        <select
                          value={editForm.privacy.showEmail ? 'true' : 'false'}
                          onChange={(e) => setEditForm(prev => ({
                            ...prev,
                            privacy: { ...prev.privacy, showEmail: e.target.value === 'true' }
                          }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="true">Так</option>
                          <option value="false">Ні</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Показувати профіль всім
                        </label>
                        <select
                          value={editForm.privacy.profileVisibility}
                          onChange={(e) => setEditForm(prev => ({
                            ...prev,
                            privacy: { ...prev.privacy, profileVisibility: e.target.value as 'public' | 'friends' | 'private' }
                          }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="public">Всім</option>
                          <option value="friends">Друзям</option>
                          <option value="private">Тільки мені</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Heart className="h-6 w-6 text-blue-600" />
              </div>
              <div className="text-2xl font-bold text-gray-900">0</div>
              <div className="text-sm text-gray-600">Вподобань</div>
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <MessageCircle className="h-6 w-6 text-green-600" />
              </div>
              <div className="text-2xl font-bold text-gray-900">0</div>
              <div className="text-sm text-gray-600">Постів</div>
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
              <div className="text-2xl font-bold text-gray-900">0</div>
              <div className="text-sm text-gray-600">Друзів</div>
            </div>
          </div>

          {/* Content Tabs */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="border-b border-gray-200">
              <nav className="flex space-x-8 px-6">
                <button className="py-4 px-1 border-b-2 border-blue-500 text-blue-600 font-medium text-sm">
                  Пости
                </button>
                <button className="py-4 px-1 border-b-2 border-transparent text-gray-500 hover:text-gray-700 font-medium text-sm">
                  Фото
                </button>
                <button className="py-4 px-1 border-b-2 border-transparent text-gray-500 hover:text-gray-700 font-medium text-sm">
                  Друзі
                </button>
              </nav>
            </div>

            <div className="p-6">
              <div className="text-center py-12">
                <ImageIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Поки що немає контенту</h3>
                <p className="text-gray-600 mb-4">Почніть ділитися своїми думками та фото</p>
                <button className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  <Plus className="h-4 w-4 mr-2" />
                  Створити пост
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}