import React, { useState, useEffect } from 'react';
import { Sidebar } from '../../components/Sidebar';
import { FileUpload } from '../../components/FileUpload';
import { supabase } from '../../lib/supabase';
import { DatabaseService } from '../../lib/database';
import { createPost, getAllPosts } from '../../lib/postService';
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
  AlertCircle,
  Send,
  Smile,
  FileText,
  Video,
  MoreHorizontal,
  Trash2
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
  education?: string;
  phone?: string;
  hobbies?: string[];
  relationship_status?: string;
  work?: string;
  website?: string;
  languages?: string[];
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
  
  // Post creation states
  const [postContent, setPostContent] = useState('');
  const [postMediaUrl, setPostMediaUrl] = useState('');
  const [postMediaType, setPostMediaType] = useState('');
  const [creatingPost, setCreatingPost] = useState(false);
  const [showPostForm, setShowPostForm] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showMediaInput, setShowMediaInput] = useState(false);
  const [characterCount, setCharacterCount] = useState(0);
  const [userPosts, setUserPosts] = useState([]);
  const [loadingPosts, setLoadingPosts] = useState(false);
  
  // Form states
  const [editForm, setEditForm] = useState({
    name: '',
    last_name: '',
    email: '',
    bio: '',
    city: '',
    birth_date: '',
    avatar: '',
    education: '',
    phone: '',
    hobbies: [] as string[],
    relationship_status: '',
    work: '',
    website: '',
    languages: [] as string[],
    newHobby: '',
    newLanguage: '',
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

  const MAX_CHARACTERS = 280; // Twitter-style character limit
  const EMOJIS = ['😊', '😂', '❤️', '👍', '🎉', '🔥', '😍', '🤔', '😭', '😎', '🥳', '💪', '✨', '🌟', '💯'];

  useEffect(() => {
    loadProfile();
  }, [location.key]);

  useEffect(() => {
    if (currentUser) {
      loadUserPosts();
    }
  }, [currentUser]);

  useEffect(() => {
    setCharacterCount(postContent.length);
  }, [postContent]);

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
          education: '',
          phone: '',
          hobbies: [],
          relationship_status: '',
          work: '',
          website: '',
          languages: [],
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
          education: savedProfile.education || '',
          phone: savedProfile.phone || '',
          hobbies: savedProfile.hobbies || [],
          relationship_status: savedProfile.relationship_status || '',
          work: savedProfile.work || '',
          website: savedProfile.website || '',
          languages: savedProfile.languages || [],
          newHobby: '',
          newLanguage: '',
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
          education: userProfile.education || '',
          phone: userProfile.phone || '',
          hobbies: userProfile.hobbies || [],
          relationship_status: userProfile.relationship_status || '',
          work: userProfile.work || '',
          website: userProfile.website || '',
          languages: userProfile.languages || [],
          newHobby: '',
          newLanguage: '',
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

  const validateForm = () => {
    const errors: string[] = [];

    // Валідація імені
    if (!editForm.name.trim()) {
      errors.push('Ім\'я є обов\'язковим полем');
    }

    // Валідація email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (editForm.email && !emailRegex.test(editForm.email)) {
      errors.push('Невірний формат email');
    }

    // Валідація телефону
    if (editForm.phone && !/^[\d\s\-\+\(\)]+$/.test(editForm.phone)) {
      errors.push('Невірний формат телефону');
    }

    // Валідація веб-сайту
    if (editForm.website && !/^https?:\/\/.+/.test(editForm.website)) {
      errors.push('Веб-сайт повинен починатися з http:// або https://');
    }

    // Валідація біо
    if (editForm.bio && editForm.bio.length > 500) {
      errors.push('Біо не може перевищувати 500 символів');
    }

    return errors;
  };

  const handleSaveProfile = async () => {
    try {
      setSaving(true);
      setError(null);
      
      // Валідація форми
      const validationErrors = validateForm();
      if (validationErrors.length > 0) {
        setError(validationErrors.join(', '));
        return;
      }
      
      if (!currentUser) {
        throw new Error('Користувач не авторизований');
      }
      
      const updates = {
        name: editForm.name.trim(),
        last_name: editForm.last_name.trim(),
        email: editForm.email.trim(),
        bio: editForm.bio.trim(),
        city: editForm.city.trim(),
        birth_date: editForm.birth_date,
        avatar: editForm.avatar,
        education: editForm.education.trim(),
        phone: editForm.phone.trim(),
        hobbies: editForm.hobbies,
        relationship_status: editForm.relationship_status.trim(),
        work: editForm.work.trim(),
        website: editForm.website.trim(),
        languages: editForm.languages,
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
        education: profile.education || '',
        phone: profile.phone || '',
        hobbies: profile.hobbies || [],
        relationship_status: profile.relationship_status || '',
        work: profile.work || '',
        website: profile.website || '',
        languages: profile.languages || [],
        newHobby: '',
        newLanguage: '',
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

  const addHobby = () => {
    if (editForm.newHobby.trim() && !editForm.hobbies.includes(editForm.newHobby.trim())) {
      setEditForm(prev => ({
        ...prev,
        hobbies: [...prev.hobbies, editForm.newHobby.trim()],
        newHobby: ''
      }));
    }
  };

  const removeHobby = (hobby: string) => {
    setEditForm(prev => ({
      ...prev,
      hobbies: prev.hobbies.filter(h => h !== hobby)
    }));
  };

  const addLanguage = () => {
    if (editForm.newLanguage.trim() && !editForm.languages.includes(editForm.newLanguage.trim())) {
      setEditForm(prev => ({
        ...prev,
        languages: [...prev.languages, editForm.newLanguage.trim()],
        newLanguage: ''
      }));
    }
  };

  const removeLanguage = (language: string) => {
    setEditForm(prev => ({
      ...prev,
      languages: prev.languages.filter(l => l !== language)
    }));
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

  // Post creation functions
  const addEmoji = (emoji: string) => {
    if (characterCount + emoji.length <= MAX_CHARACTERS) {
      setPostContent(prev => prev + emoji);
    }
  };

  const handleCreatePost = async (e: any) => {
    e.preventDefault();
    if (!postContent.trim() || !currentUser || characterCount > MAX_CHARACTERS) return;
    
    setCreatingPost(true);
    try {
      const { data, error } = await createPost({
        content: postContent,
        media_url: postMediaUrl || undefined,
        media_type: postMediaType || undefined,
      });
      
      if (error) {
        console.error('Error creating post:', error);
        throw error;
      }
      
      setPostContent('');
      setPostMediaUrl('');
      setPostMediaType('');
      setShowMediaInput(false);
      setShowEmojiPicker(false);
      setShowPostForm(false);
      setSuccess('Пост успішно створено!');
      
      // Reload user posts
      loadUserPosts();
    } catch (e: any) {
      console.error('Error creating post:', e);
      setError('Не вдалося створити пост');
    } finally {
      setCreatingPost(false);
    }
  };

  const loadUserPosts = async () => {
    if (!currentUser) return;
    
    setLoadingPosts(true);
    try {
      const { data, error } = await getAllPosts();
      if (error) {
        console.error('Error fetching posts:', error);
        throw error;
      }
      
      // Filter posts by current user's profile ID
      const userPosts = (data || []).filter((post: any) => post.user_id === currentUser.id);
      setUserPosts(userPosts);
    } catch (error) {
      console.error('Error loading user posts:', error);
    } finally {
      setLoadingPosts(false);
    }
  };

  const formatPostDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      return 'щойно';
    } else if (diffInHours < 24) {
      return `${diffInHours}г тому`;
    } else {
      return date.toLocaleDateString('uk-UA', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
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
              {/* Avatar and User Info */}
              <div className="flex items-end justify-between -mt-16 mb-4">
                <div className="flex items-end space-x-6">
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

                  {/* User Name and Email */}
                  {!isEditing && (
                    <div className="mb-2">
                      <h1 className="text-3xl font-bold text-gray-900">
                        {profile.name} {profile.last_name}
                      </h1>
                      <p className="text-gray-600 flex items-center mt-1">
                        <Mail size={16} className="mr-2" />
                        {profile.email}
                      </p>
                    </div>
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

                    {/* Додаткова інформація */}
                    {(profile.education || profile.work || profile.phone || profile.website || profile.hobbies?.length || profile.languages?.length) && (
                      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                        <h3 className="text-lg font-semibold text-gray-900 mb-3">Додаткова інформація</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {profile.education && (
                            <div>
                              <span className="text-sm font-medium text-gray-600">Освіта:</span>
                              <p className="text-gray-900">{profile.education}</p>
                            </div>
                          )}
                          {profile.work && (
                            <div>
                              <span className="text-sm font-medium text-gray-600">Робота:</span>
                              <p className="text-gray-900">{profile.work}</p>
                            </div>
                          )}
                          {profile.phone && (
                            <div>
                              <span className="text-sm font-medium text-gray-600">Телефон:</span>
                              <p className="text-gray-900">{profile.phone}</p>
                            </div>
                          )}
                          {profile.website && (
                            <div>
                              <span className="text-sm font-medium text-gray-600">Веб-сайт:</span>
                              <a href={profile.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                                {profile.website}
                              </a>
                            </div>
                          )}
                          {profile.relationship_status && (
                            <div>
                              <span className="text-sm font-medium text-gray-600">Сімейний стан:</span>
                              <p className="text-gray-900">{profile.relationship_status}</p>
                            </div>
                          )}
                        </div>
                        
                        {profile.hobbies?.length > 0 && (
                          <div className="mt-4">
                            <span className="text-sm font-medium text-gray-600">Хобі:</span>
                            <div className="flex flex-wrap gap-2 mt-1">
                              {profile.hobbies.map((hobby, index) => (
                                <span key={index} className="bg-blue-100 text-blue-800 text-sm font-medium px-2.5 py-0.5 rounded-full">
                                  {hobby}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {profile.languages?.length > 0 && (
                          <div className="mt-4">
                            <span className="text-sm font-medium text-gray-600">Мови:</span>
                            <div className="flex flex-wrap gap-2 mt-1">
                              {profile.languages.map((language, index) => (
                                <span key={index} className="bg-purple-100 text-purple-800 text-sm font-medium px-2.5 py-0.5 rounded-full">
                                  {language}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Ліва колонка */}
                    <div className="space-y-4">
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
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                            placeholder="Розкажіть про себе"
                            maxLength={500}
                          />
                          <p className="text-xs text-gray-500 mt-1">{editForm.bio.length}/500</p>
                        </div>

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
                            Освіта
                          </label>
                          <input
                            type="text"
                            value={editForm.education}
                            onChange={(e) => setEditForm(prev => ({ ...prev, education: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Введіть освіту"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Телефон
                          </label>
                          <input
                            type="tel"
                            value={editForm.phone}
                            onChange={(e) => setEditForm(prev => ({ ...prev, phone: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Введіть телефон"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Хобі
                          </label>
                          <div className="flex flex-wrap items-center gap-2 p-2 border border-gray-300 rounded-lg focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent">
                            {editForm.hobbies.map((hobby, index) => (
                              <span key={index} className="flex items-center bg-blue-100 text-blue-800 text-sm font-medium px-2.5 py-0.5 rounded-full">
                                {hobby}
                                <button
                                  type="button"
                                  onClick={() => removeHobby(hobby)}
                                  className="ml-1 text-blue-800 hover:text-blue-900 focus:outline-none"
                                >
                                  <X size={12} />
                                </button>
                              </span>
                            ))}
                            <input
                              type="text"
                              value={editForm.newHobby}
                              onChange={(e) => setEditForm(prev => ({ ...prev, newHobby: e.target.value }))}
                              onKeyPress={(e) => {
                                if (e.key === 'Enter') {
                                  addHobby();
                                }
                              }}
                              className="flex-1 px-1 py-0.5 bg-transparent focus:outline-none"
                              placeholder="Додати хобі і натиснути Enter"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Сімейний стан
                          </label>
                          <input
                            type="text"
                            value={editForm.relationship_status}
                            onChange={(e) => setEditForm(prev => ({ ...prev, relationship_status: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Введіть сімейний стан"
                          />
                        </div>
                      </div>

                      {/* Права колонка */}
                      <div className="space-y-4">
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

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Аватар
                          </label>
                          <div className="flex items-center space-x-3">
                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                              {editForm.avatar ? (
                                <img
                                  src={editForm.avatar}
                                  alt="Avatar"
                                  className="w-full h-full rounded-full object-cover"
                                />
                              ) : (
                                <User className="h-8 w-8 text-gray-400" />
                              )}
                            </div>
                            <FileUpload
                              onUploadSuccess={(url) => setEditForm(prev => ({ ...prev, avatar: url }))}
                              onUploadError={(error) => setError(error)}
                              accept="image/*"
                              maxSize={5}
                              buttonText="Завантажити аватар"
                              showPreview={false}
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            День народження
                          </label>
                          <div className="relative">
                            <input
                              type="date"
                              value={editForm.birth_date}
                              onChange={(e) => setEditForm(prev => ({ ...prev, birth_date: e.target.value }))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                            <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Робота
                          </label>
                          <input
                            type="text"
                            value={editForm.work}
                            onChange={(e) => setEditForm(prev => ({ ...prev, work: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Введіть роботу"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Веб-сайт
                          </label>
                          <input
                            type="url"
                            value={editForm.website}
                            onChange={(e) => setEditForm(prev => ({ ...prev, website: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="https://example.com"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Мови
                          </label>
                          <div className="flex flex-wrap items-center gap-2 p-2 border border-gray-300 rounded-lg focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent">
                            {editForm.languages.map((language, index) => (
                              <span key={index} className="flex items-center bg-purple-100 text-purple-800 text-sm font-medium px-2.5 py-0.5 rounded-full">
                                {language}
                                <button
                                  type="button"
                                  onClick={() => removeLanguage(language)}
                                  className="ml-1 text-purple-800 hover:text-purple-900 focus:outline-none"
                                >
                                  <X size={12} />
                                </button>
                              </span>
                            ))}
                            <input
                              type="text"
                              value={editForm.newLanguage}
                              onChange={(e) => setEditForm(prev => ({ ...prev, newLanguage: e.target.value }))}
                              onKeyPress={(e) => {
                                if (e.key === 'Enter') {
                                  addLanguage();
                                }
                              }}
                              className="flex-1 px-1 py-0.5 bg-transparent focus:outline-none"
                              placeholder="Додати мову і натиснути Enter"
                            />
                          </div>
                        </div>
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
              {/* Create Post Form */}
              <div className="mb-6">
                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="flex items-start space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                      {profile?.name?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    
                    <div className="flex-1">
                      <form onSubmit={handleCreatePost}>
                        <textarea
                          className="w-full border-0 resize-none text-lg placeholder-gray-500 focus:outline-none focus:ring-0 bg-transparent"
                          placeholder="Що нового?"
                          value={postContent}
                          onChange={e => setPostContent(e.target.value)}
                          rows={3}
                          maxLength={MAX_CHARACTERS}
                        />
                        
                        {/* Character count and actions */}
                        <div className="flex items-center justify-between mt-3">
                          <div className="flex items-center space-x-2">
                            <button
                              type="button"
                              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                              className="p-2 text-gray-500 hover:text-blue-500 hover:bg-blue-50 rounded-full transition-colors"
                            >
                              <Smile size={18} />
                            </button>
                            <button
                              type="button"
                              onClick={() => setShowMediaInput(!showMediaInput)}
                              className="p-2 text-gray-500 hover:text-green-500 hover:bg-green-50 rounded-full transition-colors"
                            >
                              <ImageIcon size={18} />
                            </button>
                          </div>
                          
                          <div className="flex items-center space-x-3">
                            <span className={`text-sm ${characterCount > MAX_CHARACTERS ? 'text-red-500' : 'text-gray-500'}`}>
                              {characterCount}/{MAX_CHARACTERS}
                            </span>
                            <button
                              type="submit"
                              disabled={creatingPost || !postContent.trim() || characterCount > MAX_CHARACTERS}
                              className="px-4 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center text-sm"
                            >
                              {creatingPost ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                              ) : (
                                <Send size={14} className="mr-2" />
                              )}
                              {creatingPost ? 'Створення...' : 'Опублікувати'}
                            </button>
                          </div>
                        </div>
                      </form>
                      
                      {/* Emoji picker */}
                      {showEmojiPicker && (
                        <div className="mt-3 p-3 bg-white rounded-lg border">
                          <div className="grid grid-cols-8 gap-2">
                            {EMOJIS.map((emoji, index) => (
                              <button
                                key={index}
                                onClick={() => addEmoji(emoji)}
                                className="text-xl hover:bg-gray-100 rounded p-1 transition-colors"
                              >
                                {emoji}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {/* Media input */}
                      {showMediaInput && (
                        <div className="mt-3 space-y-3">
                          <input
                            type="text"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                            placeholder="Посилання на медіа (необов'язково)"
                            value={postMediaUrl}
                            onChange={e => setPostMediaUrl(e.target.value)}
                          />
                          <select
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                            value={postMediaType}
                            onChange={e => setPostMediaType(e.target.value)}
                          >
                            <option value="">Тип медіа</option>
                            <option value="photo">Фото</option>
                            <option value="video">Відео</option>
                            <option value="document">Документ</option>
                          </select>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* User Posts */}
              {loadingPosts ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                  <p className="text-gray-600 text-sm">Завантаження постів...</p>
                </div>
              ) : userPosts.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <MessageCircle className="h-6 w-6 text-gray-400" />
                  </div>
                  <h3 className="text-base font-medium text-gray-900 mb-1">Поки що немає постів</h3>
                  <p className="text-gray-600 text-sm">Створіть свій перший пост вище!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {userPosts.map((post: any) => (
                    <div key={post.id} className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-start space-x-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                          {profile?.name?.charAt(0).toUpperCase() || 'U'}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <span className="font-medium text-gray-900 text-sm">
                              {profile?.name} {profile?.last_name}
                            </span>
                            <span className="text-xs text-gray-500">
                              {formatPostDate(post.created_at)}
                            </span>
                          </div>
                          <div className="text-gray-700 text-sm whitespace-pre-line mb-2">
                            {post.content}
                          </div>
                          
                          {/* Media content */}
                          {post.media_url && (
                            <div className="mb-2">
                              {post.media_type === 'photo' ? (
                                <img 
                                  src={post.media_url} 
                                  alt="media" 
                                  className="max-h-48 w-full object-cover rounded-lg" 
                                />
                              ) : post.media_type === 'video' ? (
                                <video 
                                  src={post.media_url} 
                                  controls 
                                  className="max-h-48 w-full rounded-lg" 
                                />
                              ) : post.media_type === 'document' ? (
                                <a 
                                  href={post.media_url} 
                                  target="_blank" 
                                  rel="noopener noreferrer" 
                                  className="inline-flex items-center px-3 py-1 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm"
                                >
                                  <FileText size={14} className="mr-1" />
                                  Переглянути документ
                                </a>
                              ) : null}
                            </div>
                          )}
                          
                          {/* Post stats */}
                          <div className="flex items-center space-x-4 text-xs text-gray-500">
                            <span>❤️ {post.likes_count || 0}</span>
                            <span>💬 {post.comments_count || 0}</span>
                          </div>
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
    </div>
  );
}