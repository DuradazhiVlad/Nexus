import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Sidebar } from '../../components/Sidebar';
import { DatabaseService, DatabaseUser } from '../../lib/database';
import { 
  Camera, 
  Settings, 
  Upload, 
  X, 
  Edit3, 
  MapPin, 
  Calendar, 
  Briefcase, 
  GraduationCap, 
  Phone, 
  Globe, 
  Eye, 
  EyeOff, 
  ChevronLeft, 
  ChevronRight, 
  Image, 
  Trash2, 
  Palette,
  Users,
  MessageSquare,
  Heart,
  Share2,
  MoreHorizontal,
  UserPlus,
  UserCheck,
  Mail,
  Edit,
  Save,
  Check,
  CopyIcon,
  ExternalLink,
  Crown,
  Shield,
  Star,
  Award,
  Activity,
  Grid,
  List,
  Filter,
  Search,
  Plus,
  Play,
  Lock,
  Unlock,
  AlertCircle,
  CheckCircle,
  Info,
  Gift,
  Cake,
  User,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PhotoFilters } from './PhotoFilters';
import { useForm } from 'react-hook-form';
import { supabase } from '../../lib/supabase';
import { getUserProfile, updateUserProfile, upsertUserProfile } from '../../lib/userProfileService';
import { uploadMediaFile, getUserMedia, deleteMedia, updateMediaDescription } from '../../lib/mediaService';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

interface Media {
  id: string;
  type: 'photo' | 'video';
  url: string;
  created_at: string;
  description?: string;
  tags?: string[];
  likes?: number;
  comments?: number;
}

interface Post {
  id: string;
  author: DatabaseUser;
  content: string;
  images: string[];
  created_at: string;
  likes: number;
  comments: number;
  isLiked?: boolean;
}

interface Friend {
  id: string;
  name: string;
  lastName: string;
  avatar?: string;
  status?: 'online' | 'offline' | 'away';
  mutualFriends?: number;
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  earned_at: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

interface Privacy {
  showEmail: boolean;
  showPhone: boolean;
  showBirthday: boolean;
  showLocation: boolean;
  allowMessages: boolean;
  allowFriendRequests: boolean;
  profileVisibility: 'public' | 'friends' | 'private';
}

type ExtendedDatabaseUser = DatabaseUser & {
  lastname?: string; // Alias for lastname field
  status?: string;
  phone?: string;
  website?: string;
  familyStatus?: string;
  bio?: string;
  location?: string;
  birthday?: string;
  work?: string;
  education?: string;
  hobbies?: string[];
  languages?: string[];
  relationshipStatus?: string;
  isVerified?: boolean;
  isOnline?: boolean;
  lastSeen?: string;
  friendsCount?: number;
  followersCount?: number;
  followingCount?: number;
  postsCount?: number;
  photosCount?: number;
  videosCount?: number;
  achievements?: Achievement[];
  privacy?: Privacy;
};

type TabType = 'posts' | 'photos' | 'videos' | 'friends' | 'about' | 'achievements';
type ViewMode = 'grid' | 'list';

export function Profile() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [media, setMedia] = useState<Media[]>([]);
  const [mediaLoading, setMediaLoading] = useState(false);
  const [mediaTypeToUpload, setMediaTypeToUpload] = useState<'photo' | 'video' | null>(null);
  const [mediaDescription, setMediaDescription] = useState('');
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [error, setError] = useState('');
  
  // UI States
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [showCoverModal, setShowCoverModal] = useState(false);
  const [showPhotoEditor, setShowPhotoEditor] = useState(false);
  const [showPrivacySettings, setShowPrivacySettings] = useState(false);
  const [showAchievements, setShowAchievements] = useState(false);
  
  // Upload States
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>('');
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string>('');
  
  // Editor States
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [editingImageUrl, setEditingImageUrl] = useState('');
  const [editingImageIndex, setEditingImageIndex] = useState(-1);
  
  // Content States
  const [postContent, setPostContent] = useState('');
  const [activeTab, setActiveTab] = useState<TabType>('posts');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMedia, setSelectedMedia] = useState<Set<string>>(new Set());
  const [showBulkActions, setShowBulkActions] = useState(false);
  
  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const multiFileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();


  // Form for profile editing
  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm({
    defaultValues: {
      name: '',
      last_name: '',
      email: '',
      avatar: '',
      bio: '',
      city: '',
      birth_date: '',
      notifications: { email: true, messages: true, friendRequests: true },
      privacy: { showEmail: false, showBirthDate: true, profileVisibility: 'public' }
    }
  });

  // --- useEffect для завантаження профілю ---
  useEffect(() => {
    loadProfile();
    // eslint-disable-next-line
  }, []);

  // --- useEffect для завантаження вкладок ---
  useEffect(() => {
    if (!user) return;
    if (activeTab === 'posts') {
      loadPosts();
    } else if (activeTab === 'friends') {
      loadFriends();
    } else if (activeTab === 'photos' || activeTab === 'videos') {
      loadMediaFromDB(activeTab === 'photos' ? 'photo' : 'video');
    }
    // eslint-disable-next-line
  }, [user, activeTab]);

  useEffect(() => {
    if (user) {
      setValue('name', user.name || '');
      setValue('last_name', user.last_name || '');
      setValue('email', user.email || '');
      setValue('avatar', user.avatar || '');
      setValue('bio', user.bio || '');
      setValue('city', user.city || '');
      setValue('birth_date', user.birth_date || '');
      setValue('notifications', user.notifications || { email: true, messages: true, friendRequests: true });
      setValue('privacy', user.privacy || { showEmail: false, showBirthDate: true, profileVisibility: 'public' });
    }
  }, [user, setValue]);

  const loadProfile = async () => {
    setLoading(true);
    setError('');
    try {
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
      if (authError || !authUser) {
        setError('Потрібно авторизуватися для перегляду профілю');
        setLoading(false);
        return;
      }
      const profile = await getUserProfile(authUser.id);
      setUser(profile);
    } catch (e: any) {
      setError('Помилка при завантаженні профілю: ' + (e.message || e));
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: any) => {
    setLoading(true);
    setError('');
    try {
      // Виправлення: порожній рядок дати -> null
      if (data.birth_date === "") data.birth_date = null;
      if (data.birthday === "") data.birthday = null;
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) throw new Error('Не авторизовано');
      // Використовуємо upsertUserProfile
      const { data: updated, error: upsertError } = await upsertUserProfile({
        auth_user_id: authUser.id,
        name: data.name,
        last_name: data.last_name,
        email: data.email,
        avatar: data.avatar,
        bio: data.bio,
        city: data.city,
        birth_date: data.birth_date,
        notifications: data.notifications,
        privacy: data.privacy,
        education: data.education,
        work: data.work,
        relationshipStatus: data.relationshipStatus,
        phone: data.phone,
        hobbies: data.hobbies,
        languages: data.languages,
        website: data.website,
        isVerified: data.isVerified,
        familyStatus: data.familyStatus,
        location: data.location,
        birthday: data.birthday,
      });
      if (upsertError) throw upsertError;
      setUser(updated);
    } catch (e: any) {
      setError('Помилка при оновленні профілю: ' + (e.message || e.details || e));
    } finally {
      setLoading(false);
    }
  };

  // Завантаження медіа з БД
  const loadMediaFromDB = async (type?: 'photo' | 'video') => {
    setMediaLoading(true);
    try {
      if (!user) return;
      const data = await getUserMedia(user.id, type);
      setMedia(data || []);
    } catch (e) {
      setMedia([]);
    } finally {
      setMediaLoading(false);
    }
  };

  const loadPosts = async () => {
    setLoading(true);
    try {
      if (!user) return;
      
      // Завантажуємо пости з бази даних
      const dbPosts = await DatabaseService.getUserPosts(user.id);
      
      // Конвертуємо пости з бази в формат UI
      const formattedPosts: Post[] = dbPosts.map(post => ({
        id: post.id,
        author: {
          id: user.id,
          name: user.name,
          lastname: user.lastname || user.lastName || '',
          avatar: user.avatar || '',
          email: user.email || '',
        },
        content: post.content,
        images: post.media_url ? [post.media_url] : [],
        created_at: post.created_at,
        likes: post.likes_count,
        comments: post.comments_count,
        isLiked: false // TODO: реалізувати перевірку лайків
      }));
      
      setPosts(formattedPosts);
    } catch (error) {
      console.error('Error loading posts:', error);
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  const loadFriends = async () => {
    setLoading(true);
    try {
      // Симуляція завантаження друзів
      const mockFriends: Friend[] = [
        {
          id: '1',
          name: 'Олександр',
          lastName: 'Петренко',
          avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
          status: 'online',
          mutualFriends: 15
        },
        {
          id: '2',
          name: 'Марія',
          lastName: 'Іваненко',
          avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b31c?auto=format&fit=crop&w=200&q=80',
          status: 'away',
          mutualFriends: 8
        },
        {
          id: '3',
          name: 'Андрій',
          lastName: 'Коваленко',
          avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=200&q=80',
          status: 'offline',
          mutualFriends: 22
        }
      ];
      
      // Генеруємо більше друзів
      for (let i = 4; i <= 20; i++) {
        mockFriends.push({
          id: i.toString(),
          name: `Користувач${i}`,
          lastName: 'Тестовий',
          avatar: `https://images.unsplash.com/photo-${1500000000000 + i * 100000}?auto=format&fit=crop&w=200&q=80`,
          status: ['online', 'offline', 'away'][Math.floor(Math.random() * 3)] as 'online' | 'offline' | 'away',
          mutualFriends: Math.floor(Math.random() * 30)
        });
      }
      
      setFriends(mockFriends);
    } catch (error) {
      setFriends([]);
    } finally {
      setLoading(false);
    }
  };

  const generateMockAchievements = (): Achievement[] => {
    return [
      {
        id: '1',
        title: 'Перший пост',
        description: 'Опублікував свій перший пост',
        icon: '🎉',
        earned_at: '2024-01-01T10:00:00Z',
        rarity: 'common'
      },
      {
        id: '2',
        title: 'Популярний автор',
        description: '100+ лайків на пості',
        icon: '⭐',
        earned_at: '2024-01-10T10:00:00Z',
        rarity: 'rare'
      },
      {
        id: '3',
        title: 'Соціальна бабка',
        description: '50+ друзів',
        icon: '👥',
        earned_at: '2024-01-15T10:00:00Z',
        rarity: 'epic'
      },
      {
        id: '4',
        title: 'Фотограф',
        description: 'Завантажив 100+ фото',
        icon: '📸',
        earned_at: '2024-01-20T10:00:00Z',
        rarity: 'legendary'
      }
    ];
  };

  const handleAvatarClick = () => {
    setShowAvatarModal(true);
  };

  const handleAvatarUpload = () => {
    avatarInputRef.current?.click();
  };

  const handleAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file instanceof Blob) {
      setAvatarFile(file as File);
      const reader = new FileReader();
      reader.onload = (ev) => {
        setAvatarPreview(ev.target?.result as string);
      };
      reader.readAsDataURL(file as File);
    }
  };

  const saveAvatar = async () => {
    if (!avatarFile || !user) return;
    setUploading(true);
    try {
      // Завантаження у Supabase Storage
      const fileExt = avatarFile.name.split('.').pop();
      const fileName = `${user.id}_${Date.now()}.${fileExt}`;
      const { data: uploadData, error: uploadError } = await supabase.storage.from('avatars').upload(fileName, avatarFile, {
        cacheControl: '3600',
        upsert: true,
      });
      if (uploadError) throw uploadError;
      // Отримати публічний URL
      const { data: publicUrlData } = supabase.storage.from('avatars').getPublicUrl(fileName);
      const avatarUrl = publicUrlData?.publicUrl;
      if (!avatarUrl) throw new Error('Не вдалося отримати URL аватара');
      // Оновити профіль користувача
      const updated = await updateUserProfile(user.id, { avatar: avatarUrl });
      setUser(updated);
      setShowAvatarModal(false);
      setAvatarFile(null);
      setAvatarPreview('');
      toast.success('Аватар успішно оновлено!');
    } catch (error: any) {
      console.error('Error uploading avatar:', error);
      toast.error('Помилка при завантаженні аватара: ' + (error.message || error));
    } finally {
      setUploading(false);
    }
  };

  const handleCoverUpload = () => {
    coverInputRef.current?.click();
  };

  const handleCoverFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCoverFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setCoverPreview(e.target?.result as string);
        setShowCoverModal(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const saveCover = async () => {
    if (!coverFile || !user) return;
    
    setUploading(true);
    try {
      const mockUrl = URL.createObjectURL(coverFile);
      
      setUser(prev => prev ? { ...prev, coverImage: mockUrl } : null);
      setShowCoverModal(false);
      setCoverFile(null);
      setCoverPreview('');
      
      alert('Обкладинка успішно оновлена!');
    } catch (error) {
      console.error('Error uploading cover:', error);
      alert('Помилка при завантаженні обкладинки');
    } finally {
      setUploading(false);
    }
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!postContent.trim() || !user) return;

    setUploading(true);
    try {
      // Створюємо пост в базі даних
      const createdPost = await DatabaseService.createPost(postContent);
      
      if (createdPost) {
        // Оновити список постів з БД після створення поста
        await loadPosts();
        // Очищуємо форму
        setPostContent('');
        setSelectedFiles([]);
        setPreviewUrls([]);
        alert('Пост успішно створено!');
      } else {
        throw new Error('Failed to create post');
      }
    } catch (error) {
      console.error('Error creating post:', error);
      alert('Помилка при створенні поста');
    } finally {
      setUploading(false);
    }
  };

  const handlePostMediaSelect = () => {
    if (multiFileInputRef.current) {
      multiFileInputRef.current.click();
    }
  };

  const handlePostFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setSelectedFiles(files);
    
    // Створюємо preview URL для зображень
    const urls = files.map(file => {
      if (file instanceof File && file.type.startsWith('image/')) {
        return URL.createObjectURL(file);
      }
      return '';
    }).filter(url => url !== '');
    
    setPreviewUrls(urls);
  };

  const removePostImage = (index: number) => {
    const newFiles = selectedFiles.filter((_, i) => i !== index);
    const newUrls = previewUrls.filter((_, i) => i !== index);
    
    setSelectedFiles(newFiles);
    setPreviewUrls(newUrls);
  };

  const toggleLike = (postId: string) => {
    setPosts(prev => prev.map(post => 
      post.id === postId 
        ? { 
            ...post, 
            isLiked: !post.isLiked, 
            likes: post.isLiked ? post.likes - 1 : post.likes + 1 
          }
        : post
    ));
  };

  const handleMediaSelect = (mediaId: string) => {
    const newSelection = new Set(selectedMedia);
    if (newSelection.has(mediaId)) {
      newSelection.delete(mediaId);
    } else {
      newSelection.add(mediaId);
    }
    setSelectedMedia(newSelection);
    setShowBulkActions(newSelection.size > 0);
  };

  const clearSelection = () => {
    setSelectedMedia(new Set());
    setShowBulkActions(false);
  };

  const deleteSelectedMedia = async () => {
    if (selectedMedia.size === 0) return;
    
    if (confirm(`Видалити ${selectedMedia.size} обраних медіафайлів?`)) {
      setMedia(prev => prev.filter(item => !selectedMedia.has(item.id)));
      clearSelection();
      alert('Медіафайли успішно видалено!');
    }
  };

  const getFilteredMedia = () => {
    let filtered = media;
    
    if (activeTab === 'photos') {
      filtered = filtered.filter(item => item.type === 'photo');
    } else if (activeTab === 'videos') {
      filtered = filtered.filter(item => item.type === 'video');
    }
    
    if (searchQuery) {
      filtered = filtered.filter(item => 
        item.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }
    
    return filtered;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('uk-UA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (dateString: string) => {
    const diff = Date.now() - new Date(dateString).getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (hours < 24) return `${hours} год тому`;
    return `${days} дн тому`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-green-500';
      case 'away': return 'bg-yellow-500';
      case 'offline': return 'bg-gray-400';
      default: return 'bg-gray-400';
    }
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'bg-gray-100 text-gray-700';
      case 'rare': return 'bg-blue-100 text-blue-700';
      case 'epic': return 'bg-purple-100 text-purple-700';
      case 'legendary': return 'bg-yellow-100 text-yellow-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  // Додати стани для редагування опису
  const [editingMediaId, setEditingMediaId] = useState<string | null>(null);
  const [editingDescription, setEditingDescription] = useState('');

  // Функція для видалення медіа
  const handleDeleteMedia = async (mediaId: string, fileUrl: string) => {
    if (!window.confirm('Видалити цей файл?')) return;
    // Витягуємо шлях до файлу з URL (після /media/)
    const filePath = fileUrl.split('/media/')[1];
    if (!filePath) return alert('Не вдалося визначити шлях до файлу');
    try {
      await deleteMedia(mediaId, filePath);
      setMedia(prev => prev.filter(m => m.id !== mediaId));
    } catch (e) {
      alert('Помилка при видаленні медіа');
    }
  };

  // Функція для збереження опису
  const handleSaveDescription = async (mediaId: string) => {
    try {
      await updateMediaDescription(mediaId, editingDescription);
      setMedia(prev => prev.map(m => m.id === mediaId ? { ...m, description: editingDescription } : m));
      setEditingMediaId(null);
      setEditingDescription('');
    } catch (e) {
      alert('Помилка при оновленні опису');
    }
  };

  // --- Медіа завантаження для фото/відео ---
  const handleMediaFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setMediaFile(file);
  };

  const handleUploadMedia = async () => {
    if (!mediaFile || !mediaTypeToUpload) return;
    setMediaLoading(true);
    try {
      // Використовуємо uploadMediaFile з lib/mediaService.ts
      // Якщо такого немає, просто завантажуємо у storage
      // (припускаємо, що uploadMediaFile існує)
      if (typeof uploadMediaFile === 'function') {
        await uploadMediaFile({
          file: mediaFile,
          type: mediaTypeToUpload,
          description: mediaDescription,
        });
      } else {
        // Fallback: upload to storage only
        // TODO: реалізувати якщо потрібно
      }
      setMediaTypeToUpload(null);
      setMediaFile(null);
      setMediaDescription('');
      await loadMediaFromDB(mediaTypeToUpload);
    } catch (e: any) {
      alert('Помилка при завантаженні медіа: ' + (e.message || e.details || e));
    } finally {
      setMediaLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="flex-1 ml-64 p-8">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Завантаження профілю...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="flex-1 ml-64 p-8">
          <div className="text-center py-12">
            <AlertCircle size={48} className="text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Помилка завантаження</h3>
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
    );
  }

  if (!user) return null;

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 ml-64">
        {/* Cover Photo */}
        <div className="relative h-80 bg-gradient-to-r from-purple-500 to-blue-600 overflow-hidden">
          {user.coverImage && (
            <img
              src={user.coverImage}
              alt="Cover"
              className="w-full h-full object-cover"
            />
          )}
          <div className="absolute inset-0 bg-black bg-opacity-20"></div>
          
          {/* Cover Upload Button */}
          <button
            onClick={handleCoverUpload}
            className="absolute bottom-4 right-4 flex items-center px-3 py-2 bg-black bg-opacity-50 text-white rounded-lg hover:bg-opacity-70 transition-all"
          >
            <Camera size={16} className="mr-2" />
            Змінити обкладинку
          </button>
          
          <input
            ref={coverInputRef}
            type="file"
            accept="image/*"
            onChange={handleCoverFileChange}
            className="hidden"
          />
        </div>

        {/* Profile Header */}
        <div className="relative bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-8 py-6">
            <div className="flex flex-col sm:flex-row items-center sm:items-end space-y-4 sm:space-y-0 sm:space-x-6 -mt-16 sm:-mt-20">
              {/* Avatar */}
              <div className="relative w-32 h-32 mx-auto mb-4">
                {user?.avatar ? (
                  <img
                    src={user.avatar}
                    alt="Avatar"
                    className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-lg"
                    style={{ objectPosition: avatarPosition }}
                  />
                ) : (
                  <div className="w-32 h-32 rounded-full bg-gray-200 flex items-center justify-center text-4xl text-gray-400">
                    <User />
                  </div>
                )}
                {/* Вибір позиції */}
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 bg-white bg-opacity-90 rounded-lg shadow p-2 mt-2 flex flex-col items-center">
                  <label htmlFor="avatar-position" className="text-xs text-gray-600 mb-1">Розташування аватарки</label>
                  <select
                    id="avatar-position"
                    value={avatarPosition}
                    onChange={e => setAvatarPosition(e.target.value as any)}
                    className="text-sm border rounded px-2 py-1"
                  >
                    <option value="center">По центру</option>
                    <option value="top">Верх</option>
                    <option value="bottom">Низ</option>
                    <option value="left">Ліво</option>
                    <option value="right">Право</option>
                  </select>
                </div>
              </div>

              {/* User Info */}
              <div className="flex-1 pb-4">
                <div className="flex items-center space-x-3 mb-2">
                  <h1 className="text-3xl font-bold text-gray-900">
                    {user.name} {user.lastName}
                  </h1>
                  {user.isVerified && (
                    <CheckCircle size={24} className="text-blue-500" />
                  )}
                  {user.isOnline ? (
                    <span className="px-2 py-1 bg-green-100 text-green-800 text-sm rounded-full">
                      Онлайн
                    </span>
                  ) : (
                    <span className="text-sm text-gray-500">
                      Востаннє: {formatTime(user.lastSeen || '')}
                    </span>
                  )}
                </div>
                
                {user.bio && (
                  <p className="text-gray-600 mb-3 max-w-2xl">{user.bio}</p>
                )}
                
                <div className="flex items-center space-x-6 text-sm text-gray-500">
                  {user.location && (
                    <div className="flex items-center">
                      <MapPin size={16} className="mr-1" />
                      {user.location}
                    </div>
                  )}
                  {user.work && (
                    <div className="flex items-center">
                      <Briefcase size={16} className="mr-1" />
                      {user.work}
                    </div>
                  )}
                  {user.website && (
                    <a 
                      href={user.website} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center text-blue-600 hover:text-blue-800"
                    >
                      <Globe size={16} className="mr-1" />
                      Веб-сайт
                    </a>
                  )}
                  <div className="flex items-center">
                    <Calendar size={16} className="mr-1" />
                    Приєднався {formatDate(user.createdAt || '')}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3 pb-4">
                <button
                  onClick={() => navigate('/settings')}
                  className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  <Edit3 size={16} className="mr-2" />
                  Редагувати профіль
                </button>
                <button
                  onClick={() => setShowPrivacySettings(true)}
                  className="flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Settings size={16} className="mr-2" />
                  Налаштування
                </button>
                <button className="flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                  <MoreHorizontal size={16} />
                </button>
              </div>
            </div>

            {/* Stats */}
            <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-200">
              <div className="text-center">
                <div className="text-4xl font-extrabold text-gray-900">{user.postsCount}</div>
                <div className="text-base text-gray-500 mt-1">Постів</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-extrabold text-gray-900">{user.friendsCount}</div>
                <div className="text-base text-gray-500 mt-1">Друзів</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-extrabold text-gray-900">{user.followersCount}</div>
                <div className="text-base text-gray-500 mt-1">Підписників</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-extrabold text-gray-900">{user.photosCount}</div>
                <div className="text-base text-gray-500 mt-1">Фото</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-extrabold text-gray-900">{user.videosCount}</div>
                <div className="text-base text-gray-500 mt-1">Відео</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-extrabold text-gray-900">{user.achievements?.length || 0}</div>
                <div className="text-base text-gray-500 mt-1">Досягнень</div>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-8">
            <div className="flex space-x-2">
              {[
                { id: 'posts', label: 'Пости', icon: MessageSquare, count: user.postsCount },
                { id: 'photos', label: 'Фото', icon: Image, count: user.photosCount },
                { id: 'videos', label: 'Відео', icon: Play, count: user.videosCount },
                { id: 'friends', label: 'Друзі', icon: Users, count: user.friendsCount },
                { id: 'about', label: 'Про себе', icon: Info },
                { id: 'achievements', label: 'Досягнення', icon: Award, count: user.achievements?.length }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as TabType)}
                  className={`flex items-center space-x-2 py-3 px-4 rounded-lg font-medium transition-colors relative
                    ${activeTab === tab.id ? 'text-blue-600 bg-blue-50' : 'text-gray-700 hover:text-blue-600 hover:bg-gray-100'}`}
                >
                  <tab.icon size={22} />
                  <span>{tab.label}</span>
                  {tab.count !== undefined && (
                    <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-semibold ${activeTab === tab.id ? 'bg-white text-blue-600' : 'bg-gray-100 text-gray-600'}`}>
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="max-w-7xl mx-auto px-8 py-8">
          {/* Bulk Actions */}
          {showBulkActions && (activeTab === 'photos' || activeTab === 'videos') && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-blue-800">
                  Обрано {selectedMedia.size} файлів
                </span>
                <div className="flex space-x-2">
                  <button
                    onClick={deleteSelectedMedia}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
                  >
                    Видалити
                  </button>
                  <button
                    onClick={clearSelection}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                  >
                    Скасувати
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Search and Filters */}
          {(activeTab === 'photos' || activeTab === 'videos' || activeTab === 'friends') && (
            <div className="mb-6 flex items-center space-x-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder={`Пошук ${activeTab === 'friends' ? 'друзів' : 'медіа'}...`}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
              
              {(activeTab === 'photos' || activeTab === 'videos') && (
                <div className="flex border border-gray-300 rounded-lg overflow-hidden">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 ${viewMode === 'grid' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                  >
                    <Grid size={18} />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2 ${viewMode === 'list' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                  >
                    <List size={18} />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Tab Content */}
          {activeTab === 'posts' && (
            <div className="space-y-6">
              {/* Create Post */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                    {user.name?.[0]?.toUpperCase()}{(user.lastname || user.lastName)?.[0]?.toUpperCase()}
                  </div>
                  <div className="flex-1">
                    {/* Інлайн textarea для створення поста */}
                    <textarea
                      value={postContent}
                      onChange={e => setPostContent(e.target.value)}
                      placeholder={`Що у вас нового, ${user.name}?`}
                      className="w-full px-4 py-3 bg-gray-50 rounded-full text-gray-500 border border-gray-200 focus:bg-white focus:border-blue-400 focus:outline-none transition-all min-h-[48px] resize-none"
                      rows={postContent ? 4 : 1}
                      onFocus={e => e.currentTarget.rows = 4}
                      onBlur={e => { if (!postContent) e.currentTarget.rows = 1; }}
                    />
                  </div>
                </div>
                {/* Кнопки для додавання медіа та публікації */}
                {(postContent || selectedFiles.length > 0) && (
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center space-x-4">
                      <button
                        type="button"
                        onClick={handlePostMediaSelect}
                        className="flex items-center space-x-2 text-gray-600 hover:text-blue-600 transition-colors"
                      >
                        <Image size={20} />
                        <span>Фото/Відео</span>
                      </button>
                    </div>
                    <button
                      onClick={handleCreatePost}
                      disabled={!postContent.trim() || uploading}
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {uploading ? 'Публікація...' : 'Опублікувати'}
                    </button>
                  </div>
                )}
                {/* Прев'ю медіа */}
                {previewUrls.length > 0 && (
                  <div className="space-y-3 mt-2">
                    <h4 className="font-medium text-gray-900">Завантажені зображення:</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {previewUrls.map((url, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={url}
                            alt={`Preview ${index + 1}`}
                            className="w-full h-32 object-cover rounded-lg"
                          />
                          <button
                            type="button"
                            onClick={() => removePostImage(index)}
                            className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {/* Hidden File Input */}
                <input
                  ref={multiFileInputRef}
                  type="file"
                  accept="image/*,video/*"
                  multiple
                  onChange={handlePostFileChange}
                  className="hidden"
                />
              </div>

              {/* Posts */}
              {posts.length === 0 ? (
                <div className="text-center py-12 text-gray-500">Поки що немає постів</div>
              ) : (
                posts.map((post) => (
                  <div key={post.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                    {/* Post Header */}
                    <div className="p-6 pb-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                          {user.name?.[0]?.toUpperCase()}{(user.lastname || user.lastName)?.[0]?.toUpperCase()}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900">{user.name} {user.lastname || user.lastName}</h4>
                          <p className="text-sm text-gray-500">{formatTime(post.created_at)}</p>
                        </div>
                        <button className="text-gray-400 hover:text-gray-600">
                          <MoreHorizontal size={20} />
                        </button>
                      </div>
                      
                      <p className="mt-4 text-gray-800">{post.content}</p>
                    </div>

                    {/* Post Images */}
                    {post.images.length > 0 && (
                      <div className={`grid gap-1 ${post.images.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
                        {post.images.map((image, index) => (
                          <img
                            key={index}
                            src={image}
                            alt={`Post image ${index + 1}`}
                            className="w-full h-80 object-cover hover:opacity-95 transition-opacity cursor-pointer"
                          />
                        ))}
                      </div>
                    )}

                    {/* Post Actions */}
                    <div className="p-6 pt-4">
                      <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                        <span>{post.likes} вподобань</span>
                        <span>{post.comments} коментарів</span>
                      </div>
                      
                      <div className="flex items-center space-x-1 pt-4 border-t border-gray-200">
                        <button
                          onClick={() => toggleLike(post.id)}
                          className={`flex-1 flex items-center justify-center space-x-2 py-2 px-3 rounded-lg transition-colors ${
                            post.isLiked 
                              ? 'text-red-600 bg-red-50 hover:bg-red-100' 
                              : 'text-gray-600 hover:bg-gray-50'
                          }`}
                        >
                          <Heart size={20} className={post.isLiked ? 'fill-current' : ''} />
                          <span>Подобається</span>
                        </button>
                        <button className="flex-1 flex items-center justify-center space-x-2 py-2 px-3 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors">
                          <MessageSquare size={20} />
                          <span>Коментувати</span>
                        </button>
                        <button className="flex-1 flex items-center justify-center space-x-2 py-2 px-3 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors">
                          <Share2 size={20} />
                          <span>Поділитися</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'photos' || activeTab === 'videos' ? (
            <div>
              <button
                className="px-4 py-2 bg-blue-600 text-white rounded-lg mb-4"
                onClick={() => setMediaTypeToUpload(activeTab === 'photos' ? 'photo' : 'video')}
              >
                Додати {activeTab === 'photos' ? 'фото' : 'відео'}
              </button>
              {mediaTypeToUpload && (
                <div className="mb-4 p-4 border rounded-lg bg-gray-50">
                  <input type="file" accept={mediaTypeToUpload === 'photo' ? 'image/*' : 'video/*'} onChange={handleMediaFileChange} />
                  <textarea
                    className="block w-full mt-2 border rounded"
                    placeholder="Опис (необов'язково)"
                    value={mediaDescription}
                    onChange={e => setMediaDescription(e.target.value)}
                  />
                  <button
                    className="mt-2 px-4 py-2 bg-green-600 text-white rounded"
                    onClick={handleUploadMedia}
                    disabled={mediaLoading}
                  >
                    {mediaLoading ? 'Завантаження...' : 'Завантажити'}
                  </button>
                  <button
                    className="mt-2 ml-2 px-4 py-2 bg-gray-300 text-gray-700 rounded"
                    onClick={() => { setMediaTypeToUpload(null); setMediaFile(null); setMediaDescription(''); }}
                  >
                    Скасувати
                  </button>
                </div>
              )}
              {mediaLoading ? (
                <div>Завантаження...</div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {media.map(m => (
                    <div key={m.id} className="border rounded-lg p-2 bg-white relative">
                      {/* Видалити */}
                      <button
                        className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-700"
                        onClick={() => handleDeleteMedia(m.id, m.url)}
                        title="Видалити"
                      >
                        <Trash2 size={16} />
                      </button>
                      {/* Фото/відео */}
                      {m.type === 'photo' ? (
                        <img src={m.url} alt={m.description || ''} className="w-full h-40 object-cover rounded" />
                      ) : (
                        <video src={m.url} controls className="w-full h-40 object-cover rounded" />
                      )}
                      {/* Опис + редагування */}
                      <div className="mt-2 text-sm text-gray-700 flex items-center">
                        {editingMediaId === m.id ? (
                          <>
                            <input
                              className="border rounded px-2 py-1 mr-2 flex-1"
                              value={editingDescription}
                              onChange={e => setEditingDescription(e.target.value)}
                              autoFocus
                            />
                            <button
                              className="px-2 py-1 bg-green-600 text-white rounded mr-1"
                              onClick={() => handleSaveDescription(m.id)}
                            >
                              Зберегти
                            </button>
                            <button
                              className="px-2 py-1 bg-gray-300 text-gray-700 rounded"
                              onClick={() => { setEditingMediaId(null); setEditingDescription(''); }}
                            >
                              Скасувати
                            </button>
                          </>
                        ) : (
                          <>
                            <span className="flex-1">{m.description}</span>
                            <button
                              className="ml-2 text-blue-600 hover:text-blue-800"
                              onClick={() => { setEditingMediaId(m.id); setEditingDescription(m.description || ''); }}
                              title="Редагувати опис"
                            >
                              <Edit size={16} />
                            </button>
                          </>
                        )}
                      </div>
                      <div className="text-xs text-gray-400 mt-1">{new Date(m.created_at).toLocaleString()}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : null}

          {activeTab === 'friends' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {friends
                .filter(friend => 
                  searchQuery === '' || 
                  `${friend.name} ${friend.lastName}`.toLowerCase().includes(searchQuery.toLowerCase())
                )
                .map((friend) => (
                <div key={friend.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all duration-200">
                  <div className="flex items-center space-x-4 mb-4">
                    <div className="relative">
                      <div className="w-16 h-16 rounded-full overflow-hidden">
                        {friend.avatar ? (
                          <img
                            src={friend.avatar}
                            alt={`${friend.name} ${friend.lastName}`}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center text-white text-lg font-bold">
                            {friend.name?.[0]?.toUpperCase()}{(friend.lastname || friend.lastName)?.[0]?.toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div className={`absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 border-white ${getStatusColor(friend.status || 'offline')}`}></div>
                    </div>
                    
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900">{friend.name} {friend.lastName}</h4>
                      <p className="text-sm text-gray-500">{friend.mutualFriends} спільних друзів</p>
                    </div>
                    
                    <button className="text-gray-400 hover:text-gray-600">
                      <MoreHorizontal size={20} />
                    </button>
                  </div>
                  
                  <div className="flex space-x-2">
                    <button className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm">
                      Написати
                    </button>
                    <button className="flex-1 px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm">
                      Переглянути
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'about' && (
            <div className="space-y-6">
              {/* Personal Info */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Особиста інформація</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-blue-600 text-xs font-semibold">І</span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Ім'я</p>
                      <p className="text-gray-600">{user.name}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center">
                      <span className="text-green-600 text-xs font-semibold">П</span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Прізвище</p>
                      <p className="text-gray-600">{user.lastname || user.lastName || 'Дурадажи'}</p>
                    </div>
                  </div>

                  {user.birthday && (
                    <div className="flex items-center space-x-3">
                      <Calendar size={20} className="text-gray-400" />
                      <div>
                        <p className="font-medium text-gray-900">День народження</p>
                        <p className="text-gray-600">{formatDate(user.birthday)}</p>
                      </div>
                    </div>
                  )}

                  {user.location && (
                    <div className="flex items-center space-x-3">
                      <MapPin size={20} className="text-gray-400" />
                      <div>
                        <p className="font-medium text-gray-900">Місцезнаходження</p>
                        <p className="text-gray-600">{user.location}</p>
                      </div>
                    </div>
                  )}
                </div>

                {user.bio && (
                  <div className="mt-6 pt-4 border-t border-gray-100">
                    <div className="flex items-start space-x-3">
                      <div className="w-5 h-5 bg-purple-100 rounded-full flex items-center justify-center mt-0.5">
                        <span className="text-purple-600 text-xs font-semibold">О</span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">Про себе</p>
                        <p className="text-gray-600 mt-1">{user.bio}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Professional Info */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Професійна інформація</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {user.work && (
                    <div className="flex items-center space-x-3">
                      <Briefcase size={20} className="text-gray-400" />
                      <div>
                        <p className="font-medium text-gray-900">Робота</p>
                        <p className="text-gray-600">{user.work}</p>
                      </div>
                    </div>
                  )}
                  
                  {user.education && (
                    <div className="flex items-center space-x-3">
                      <GraduationCap size={20} className="text-gray-400" />
                      <div>
                        <p className="font-medium text-gray-900">Освіта</p>
                        <p className="text-gray-600">{user.education}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Relationship Status */}
              {user.relationshipStatus && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Сімейний стан</h3>
                  <div className="flex items-center space-x-3">
                    <Heart size={20} className="text-pink-400" />
                    <div>
                      <p className="font-medium text-gray-900">Стосунки</p>
                      <p className="text-gray-600">{user.relationshipStatus}</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

              {/* Contact Info */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Контактна інформація</h3>
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <Mail size={20} className="text-gray-400" />
                    <div>
                      <p className="font-medium text-gray-900">Email</p>
                      <p className="text-gray-600">{user.email}</p>
                    </div>
                  </div>
                  
                  {user.phone && user.privacy?.showPhone && (
                    <div className="flex items-center space-x-3">
                      <Phone size={20} className="text-gray-400" />
                      <div>
                        <p className="font-medium text-gray-900">Телефон</p>
                        <p className="text-gray-600">{user.phone}</p>
                      </div>
                    </div>
                  )}
                  
                  {user.website && (
                    <div className="flex items-center space-x-3">
                      <Globe size={20} className="text-gray-400" />
                      <div>
                        <p className="font-medium text-gray-900">Веб-сайт</p>
                        <a href={user.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800">
                          {user.website}
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Hobbies */}
              {user.hobbies && user.hobbies.length > 0 && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Інтереси та хобі</h3>
                  <div className="flex flex-wrap gap-2">
                    {user.hobbies.map((hobby, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                      >
                        {hobby}
                      </span>
                    ))}
                  </div>
                </div>
              )}

                {/* Languages */}
                {user.languages && user.languages.length > 0 && (
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Мови</h3>
                    <div className="flex flex-wrap gap-2">
                      {user.languages.map((language, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm"
                        >
                          {language}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'achievements' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {user.achievements?.map((achievement) => (
                <div key={achievement.id} className={`rounded-lg border-2 p-6 text-center ${getRarityColor(achievement.rarity)}`}>
                  <div className="text-4xl mb-3">{achievement.icon}</div>
                  <h4 className="font-semibold text-lg mb-2">{achievement.title}</h4>
                  <p className="text-sm mb-3">{achievement.description}</p>
                  <p className="text-xs opacity-75">Отримано {formatDate(achievement.earned_at)}</p>
                  <div className="mt-3">
                    <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                      achievement.rarity === 'legendary' ? 'bg-yellow-200 text-yellow-800' :
                      achievement.rarity === 'epic' ? 'bg-purple-200 text-purple-800' :
                      achievement.rarity === 'rare' ? 'bg-blue-200 text-blue-800' :
                      'bg-gray-200 text-gray-800'
                    }`}>
                      {achievement.rarity === 'legendary' ? 'Легендарне' :
                       achievement.rarity === 'epic' ? 'Епічне' :
                       achievement.rarity === 'rare' ? 'Рідкісне' : 'Звичайне'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Empty State */}
          {((activeTab === 'photos' && getFilteredMedia().filter(m => m.type === 'photo').length === 0) ||
            (activeTab === 'videos' && getFilteredMedia().filter(m => m.type === 'video').length === 0) ||
            (activeTab === 'friends' && friends.length === 0)) && (
            <div className="text-center py-12">
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                {activeTab === 'photos' && <Image size={32} className="text-gray-400" />}
                {activeTab === 'videos' && <Play size={32} className="text-gray-400" />}
                {activeTab === 'friends' && <Users size={32} className="text-gray-400" />}
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {activeTab === 'photos' && 'Немає фото'}
                {activeTab === 'videos' && 'Немає відео'}
                {activeTab === 'friends' && 'Немає друзів'}
              </h3>
              <p className="text-gray-600 mb-4">
                {searchQuery ? 'Спробуйте змінити критерії пошуку' : 'Поки що тут порожньо'}
              </p>
              {!searchQuery && (
                <button
                  onClick={() => {
                    if (activeTab === 'photos' || activeTab === 'videos') {
                      setShowUploadModal(true);
                    }
                  }}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus size={20} className="mr-2" />
                  {activeTab === 'photos' && 'Додати фото'}
                  {activeTab === 'videos' && 'Додати відео'}
                  {activeTab === 'friends' && 'Знайти друзів'}
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Avatar Modal */}
      {showAvatarModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Змінити аватар</h2>
              <button
                onClick={() => {
                  setShowAvatarModal(false);
                  setAvatarFile(null);
                  setAvatarPreview('');
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>

            <div className="text-center">
              <div className="w-48 h-48 mx-auto mb-6 rounded-full overflow-hidden border-4 border-gray-200">
                {avatarPreview ? (
                  <img
                    src={avatarPreview}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                ) : user.avatar ? (
                  <img
                    src={user.avatar}
                    alt="Current avatar"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center text-white text-6xl font-bold">
                    {user.name?.[0]?.toUpperCase()}{(user.lastname || user.lastName)?.[0]?.toUpperCase()}
                  </div>
                )}
              </div>

              <input
                ref={avatarInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarFileChange}
                className="hidden"
              />

              <div className="flex space-x-3">
                <button
                  onClick={handleAvatarUpload}
                  className="flex-1 flex items-center justify-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Upload size={20} className="mr-2" />
                  Завантажити фото
                </button>
                {avatarFile && (
                  <button
                    onClick={saveAvatar}
                    disabled={uploading}
                    className="flex-1 flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    {uploading ? 'Завантаження...' : 'Зберегти'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cover Modal */}
      {showCoverModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Змінити обкладинку</h2>
              <button
                onClick={() => {
                  setShowCoverModal(false);
                  setCoverFile(null);
                  setCoverPreview('');
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>

            <div className="text-center">
              <div className="w-full h-48 mx-auto mb-6 rounded-lg overflow-hidden border border-gray-200">
                {coverPreview ? (
                  <img
                    src={coverPreview}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-r from-purple-500 to-blue-600"></div>
                )}
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    setShowCoverModal(false);
                    setCoverFile(null);
                    setCoverPreview('');
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Скасувати
                </button>
                <button
                  onClick={saveCover}
                  disabled={uploading}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {uploading ? 'Завантаження...' : 'Зберегти'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} newestOnTop closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover aria-label="Notification messages" />
    </div>
  );
} 