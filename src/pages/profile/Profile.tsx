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
  School,
  Building,
  Home,
  Car,
  Music,
  BookOpen,
  Film,
  Gamepad2,
  Dumbbell,
  Coffee,
  Headphones,
  Scissors,
  Zap,
  Sun,
  Moon
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PhotoFilters } from './PhotoFilters';
import { useForm } from 'react-hook-form';
import { supabase } from '../../lib/supabase';

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
  const [user, setUser] = useState<ExtendedDatabaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [media, setMedia] = useState<Media[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [error, setError] = useState('');
  
  // UI States
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [showCoverModal, setShowCoverModal] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showCreatePost, setShowCreatePost] = useState(false);
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
      lastName: '',
      bio: '',
      location: '',
      website: '',
      phone: '',
      birthday: '',
      work: '',
      education: '',
      relationshipStatus: '',
      hobbies: [],
      languages: []
    }
  });

  useEffect(() => {
    loadProfile();
  }, []);

  useEffect(() => {
    if (user) {
      setValue('name', user.name || '');
      setValue('lastName', user.lastName || '');
      setValue('bio', user.bio || '');
      setValue('location', user.location || '');
      setValue('website', user.website || '');
      setValue('phone', user.phone || '');
      setValue('birthday', user.birthday || '');
      setValue('work', user.work || '');
      setValue('education', user.education || '');
      setValue('relationshipStatus', user.relationshipStatus || '');
      setValue('hobbies', user.hobbies || []);
      setValue('languages', user.languages || []);
    }
  }, [user, setValue]);

  const loadProfile = async () => {
    try {
      setLoading(true);
      setError('');

      const userProfile = await DatabaseService.getCurrentUserProfile();
      
      if (!userProfile) {
        // Використовуємо демо-профіль якщо користувач не авторизований
        // Створюємо демо-профіль для тестування
        const demoProfile: ExtendedDatabaseUser = {
          id: 'demo-user',
          email: 'demo@example.com',
          name: 'Влад',
          lastname: 'Дурадажи',
          avatar: undefined,
          bio: 'Люблю програмування, подорожі та хорошу каву. Завжди відкритий до нових знайомств! ☕️',
          location: 'Київ, Україна',
          website: 'https://example.com',
          phone: '+380501234567',
          birthday: '1995-05-15',
          work: 'Senior Frontend Developer',
          education: 'КПІ ім. Ігоря Сікорського',
          hobbies: ['Програмування', 'Фотографія', 'Подорожі', 'Музика'],
          languages: ['Українська', 'English', 'Русский'],
          relationshipStatus: 'Неодружений',
          isVerified: true,
          isOnline: true,
          lastSeen: new Date().toISOString(),
          friendsCount: 247,
          followersCount: 156,
          followingCount: 89,
          postsCount: 42,
          photosCount: 73,
          videosCount: 15,
          achievements: generateMockAchievements(),
          privacy: {
            showEmail: true,
            showPhone: false,
            showBirthday: true,
            showLocation: true,
            allowMessages: true,
            allowFriendRequests: true,
            profileVisibility: 'public'
          }
        };
        
        setUser(demoProfile);
        await Promise.all([
          loadMedia(),
          loadPosts(),
          loadFriends()
        ]);
        return;
      }

      // Розширюємо профіль з додатковими даними
      const extendedProfile: ExtendedDatabaseUser = {
        ...userProfile,
        lastname: userProfile.lastname || '',
        bio: userProfile.bio || 'Люблю програмування, подорожі та хорошу каву. Завжди відкритий до нових знайомств! ☕️',
        location: 'Київ, Україна',
        website: 'https://example.com',
        phone: '+380501234567',
        birthday: userProfile.birthdate || '1995-05-15',
        work: 'Senior Frontend Developer',
        education: 'КПІ ім. Ігоря Сікорського',
        hobbies: ['Програмування', 'Фотографія', 'Подорожі', 'Музика'],
        languages: ['Українська', 'English', 'Русский'],
        relationshipStatus: 'Single',
        isVerified: Math.random() > 0.5,
        isOnline: true,
        lastSeen: new Date().toISOString(),
        friendsCount: Math.floor(Math.random() * 500) + 50,
        followersCount: Math.floor(Math.random() * 1000) + 100,
        followingCount: Math.floor(Math.random() * 300) + 50,
        postsCount: Math.floor(Math.random() * 100) + 10,
        photosCount: Math.floor(Math.random() * 200) + 20,
        videosCount: Math.floor(Math.random() * 50) + 5,
        achievements: generateMockAchievements(),
        privacy: {
          showEmail: userProfile.privacy?.showEmail ?? true,
          showPhone: false,
          showBirthday: userProfile.privacy?.showBirthDate ?? true,
          showLocation: true,
          allowMessages: true,
          allowFriendRequests: true,
          profileVisibility: userProfile.privacy?.profileVisibility || 'public'
        }
      };

      setUser(extendedProfile);
      await Promise.all([
        loadMedia(),
        loadPosts(),
        loadFriends()
      ]);
    } catch (error) {
      console.error('Error loading profile:', error);
      setError('Помилка при завантаженні профілю');
    } finally {
      setLoading(false);
    }
  };

  const loadMedia = async () => {
    // Симуляція завантаження медіа
    const mockMedia: Media[] = [
      {
        id: '1',
        type: 'photo',
        url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80',
        created_at: '2024-01-15T10:00:00Z',
        description: 'Захід сонця в горах',
        tags: ['природа', 'гори', 'захід'],
        likes: 24,
        comments: 5
      },
      {
        id: '2',
        type: 'photo',
        url: 'https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=crop&w=800&q=80',
        created_at: '2024-01-14T15:30:00Z',
        description: 'Відпочинок на природі',
        tags: ['відпочинок', 'природа'],
        likes: 18,
        comments: 3
      },
      {
        id: '3',
        type: 'video',
        url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
        created_at: '2024-01-13T20:00:00Z',
        description: 'Мій перший відеоблог',
        tags: ['влог', 'подорожі'],
        likes: 42,
        comments: 8
      }
    ];
    
    // Генеруємо більше медіа
    for (let i = 4; i <= 20; i++) {
      mockMedia.push({
        id: i.toString(),
        type: Math.random() > 0.8 ? 'video' : 'photo',
        url: `https://images.unsplash.com/photo-${1500000000000 + i * 100000}?auto=format&fit=crop&w=800&q=80`,
        created_at: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString(),
        description: `Медіа ${i}`,
        tags: ['тег1', 'тег2'],
        likes: Math.floor(Math.random() * 50),
        comments: Math.floor(Math.random() * 10)
      });
    }
    
    setMedia(mockMedia);
  };

  const loadPosts = async () => {
    // Симуляція завантаження постів
    const mockPosts: Post[] = [
      {
        id: '1',
        author: user || { id: '', name: 'User', lastName: '', avatar: '' },
        content: 'Прекрасний день для нових пригод! 🌟 Щойно повернувся з подорожі по Карпатах. Неймовірні краєвиди і свіже повітря зарядили енергією на тиждень вперед!',
        images: [
          'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=crop&w=800&q=80'
        ],
        created_at: '2024-01-20T10:00:00Z',
        likes: 45,
        comments: 12,
        isLiked: false
      },
      {
        id: '2',
        author: user || { id: '', name: 'User', lastName: '', avatar: '' },
        content: 'Сьогодні вивчаю нові технології React 18! Concurrent Features виглядають дуже перспективно 💻',
        images: [],
        created_at: '2024-01-18T15:30:00Z',
        likes: 28,
        comments: 8,
        isLiked: true
      },
      {
        id: '3',
        author: user || { id: '', name: 'User', lastName: '', avatar: '' },
        content: 'Ранкова пробіжка в парку! Хто ще любить активний спосіб життя? 🏃‍♂️',
        images: [
          'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=800&q=80'
        ],
        created_at: '2024-01-16T07:00:00Z',
        likes: 33,
        comments: 6,
        isLiked: false
      }
    ];
    
    setPosts(mockPosts);
  };

  const loadFriends = async () => {
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
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setAvatarPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const saveAvatar = async () => {
    if (!avatarFile || !user) return;
    
    setUploading(true);
    try {
      // Тут буде логіка завантаження на сервер
      const mockUrl = URL.createObjectURL(avatarFile);
      
      setUser(prev => prev ? { ...prev, avatar: mockUrl } : null);
      setShowAvatarModal(false);
      setAvatarFile(null);
      setAvatarPreview('');
      
      alert('Аватар успішно оновлено!');
    } catch (error) {
      console.error('Error uploading avatar:', error);
      alert('Помилка при завантаженні аватара');
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

  const handleProfileSubmit = async (data: any) => {
    if (!user) return;
    
    setUploading(true);
    try {
      const updatedUser: ExtendedDatabaseUser = {
        ...user,
        ...data
      };
      
      setUser(updatedUser);
      setShowEditProfile(false);
      alert('Профіль успішно оновлено!');
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Помилка при оновленні профілю');
    } finally {
      setUploading(false);
    }
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!postContent.trim() || !user) return;

    setUploading(true);
    try {
      // Створюємо новий пост
      const newPost: Post = {
        id: Date.now().toString(),
        author: {
          id: user.id,
          name: user.name,
          lastName: user.lastname || user.lastName || '',
          avatar: user.avatar || ''
        },
        content: postContent,
        images: previewUrls, // Використовуємо завантажені зображення
        created_at: new Date().toISOString(),
        likes: 0,
        comments: 0,
        isLiked: false
      };

      // Додаємо пост на початок списку
      setPosts(prev => [newPost, ...prev]);
      
      // Очищуємо форму
      setPostContent('');
      setSelectedFiles([]);
      setPreviewUrls([]);
      setShowCreatePost(false);
      
      alert('Пост успішно створено!');
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
      if (file.type.startsWith('image/')) {
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
            <div className="flex items-end space-x-6 -mt-20">
              {/* Avatar */}
              <div className="relative">
                <div 
                  className="w-32 h-32 bg-white rounded-full border-4 border-white shadow-lg overflow-hidden cursor-pointer group"
                  onClick={handleAvatarClick}
                >
                  {user.avatar ? (
                    <img
                      src={user.avatar}
                      alt={`${user.name} ${user.lastName}`}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center text-white text-4xl font-bold">
                      {user.name?.[0]?.toUpperCase()}{(user.lastname || user.lastName)?.[0]?.toUpperCase()}
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 rounded-full">
                    <Camera size={24} className="text-white" />
                  </div>
                </div>
                
                {/* Online Status */}
                {user.isOnline && (
                  <div className="absolute bottom-2 right-2 w-6 h-6 bg-green-500 border-4 border-white rounded-full"></div>
                )}
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
                  onClick={() => setShowEditProfile(true)}
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
            <div className="flex items-center space-x-8 mt-6 pt-6 border-t border-gray-200">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{user.postsCount}</div>
                <div className="text-sm text-gray-500">Постів</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{user.friendsCount}</div>
                <div className="text-sm text-gray-500">Друзів</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{user.followersCount}</div>
                <div className="text-sm text-gray-500">Підписників</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{user.photosCount}</div>
                <div className="text-sm text-gray-500">Фото</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{user.videosCount}</div>
                <div className="text-sm text-gray-500">Відео</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{user.achievements?.length || 0}</div>
                <div className="text-sm text-gray-500">Досягнень</div>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-8">
            <div className="flex space-x-8">
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
                  className={`flex items-center space-x-2 py-4 px-2 border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-700 hover:text-gray-900 hover:border-gray-300'
                  }`}
                >
                  <tab.icon size={20} />
                  <span className="font-medium">{tab.label}</span>
                  {tab.count !== undefined && (
                    <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-xs">
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
                  <button
                    onClick={() => setShowCreatePost(true)}
                    className="flex-1 text-left px-4 py-3 bg-gray-50 rounded-full text-gray-500 hover:bg-gray-100 transition-colors"
                  >
                    Що у вас нового, {user.name}?
                  </button>
                </div>
                <div className="flex items-center space-x-4">
                  <button 
                    onClick={() => setShowCreatePost(true)}
                    className="flex items-center space-x-2 text-gray-600 hover:text-blue-600 transition-colors"
                  >
                    <Image size={20} />
                    <span>Фото/Відео</span>
                  </button>
                  <button 
                    onClick={() => setShowCreatePost(true)}
                    className="flex items-center space-x-2 text-gray-600 hover:text-green-600 transition-colors"
                  >
                    <MapPin size={20} />
                    <span>Локація</span>
                  </button>
                  <button className="flex items-center space-x-2 text-gray-600 hover:text-yellow-600 transition-colors">
                    <Users size={20} />
                    <span>Відмітити</span>
                  </button>
                </div>
              </div>

              {/* Posts */}
              {posts.map((post) => (
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
              ))}
            </div>
          )}

          {(activeTab === 'photos' || activeTab === 'videos') && (
            <div>
              {/* Upload Button */}
              <div className="mb-6">
                <button
                  onClick={() => setShowUploadModal(true)}
                  className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus size={20} className="mr-2" />
                  Завантажити {activeTab === 'photos' ? 'фото' : 'відео'}
                </button>
              </div>

              {/* Media Grid */}
              {viewMode === 'grid' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {getFilteredMedia().map((item) => (
                    <div
                      key={item.id}
                      className="relative group bg-white rounded-lg overflow-hidden shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200"
                    >
                      <input
                        type="checkbox"
                        checked={selectedMedia.has(item.id)}
                        onChange={() => handleMediaSelect(item.id)}
                        className="absolute top-3 left-3 w-4 h-4 rounded border-gray-300 text-blue-600 z-10"
                      />
                      
                      <div className="aspect-square relative overflow-hidden">
                        {item.type === 'video' ? (
                          <div className="relative">
                            <img
                              src={item.url}
                              alt={item.description}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className="w-12 h-12 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
                                <Play size={20} className="text-white ml-1" />
                              </div>
                            </div>
                          </div>
                        ) : (
                          <img
                            src={item.url}
                            alt={item.description}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        )}
                        
                        <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button className="p-2 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-70">
                            <MoreHorizontal size={16} />
                          </button>
                        </div>
                      </div>

                      <div className="p-3">
                        <p className="text-sm text-gray-800 mb-2 line-clamp-2">{item.description}</p>
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span>{formatTime(item.created_at)}</span>
                          <div className="flex items-center space-x-3">
                            <span className="flex items-center">
                              <Heart size={12} className="mr-1" />
                              {item.likes}
                            </span>
                            <span className="flex items-center">
                              <MessageSquare size={12} className="mr-1" />
                              {item.comments}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {getFilteredMedia().map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center space-x-4 bg-white p-4 rounded-lg border border-gray-200 hover:shadow-md transition-all duration-200"
                    >
                      <input
                        type="checkbox"
                        checked={selectedMedia.has(item.id)}
                        onChange={() => handleMediaSelect(item.id)}
                        className="w-4 h-4 rounded border-gray-300 text-blue-600"
                      />
                      
                      <div className="w-20 h-20 relative overflow-hidden rounded-lg">
                        <img
                          src={item.url}
                          alt={item.description}
                          className="w-full h-full object-cover"
                        />
                        {item.type === 'video' && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <Play size={16} className="text-white" />
                          </div>
                        )}
                      </div>
                      
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 mb-1">{item.description}</h4>
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <span>{formatTime(item.created_at)}</span>
                          <span className="flex items-center">
                            <Heart size={14} className="mr-1" />
                            {item.likes} вподобань
                          </span>
                          <span className="flex items-center">
                            <MessageSquare size={14} className="mr-1" />
                            {item.comments} коментарів
                          </span>
                        </div>
                        {item.tags && (
                          <div className="flex space-x-1 mt-2">
                            {item.tags.map(tag => (
                              <span key={tag} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                                #{tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      
                      <button className="p-2 text-gray-400 hover:text-gray-600">
                        <MoreHorizontal size={20} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

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

      {/* Create Post Modal */}
      {showCreatePost && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <form onSubmit={handleCreatePost} className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Створити пост</h2>
                <button
                  type="button"
                  onClick={() => {
                    setShowCreatePost(false);
                    setPostContent('');
                    setSelectedFiles([]);
                    setPreviewUrls([]);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-6">
                {/* User Info */}
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                    {user.name?.[0]?.toUpperCase()}{(user.lastname || user.lastName)?.[0]?.toUpperCase()}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{user.name} {user.lastname || user.lastName}</p>
                    <p className="text-sm text-gray-500">Публічний пост</p>
                  </div>
                </div>

                {/* Content Input */}
                <div>
                  <textarea
                    value={postContent}
                    onChange={(e) => setPostContent(e.target.value)}
                    placeholder={`Що у вас нового, ${user.name}?`}
                    className="w-full border-none resize-none text-lg placeholder-gray-400 focus:outline-none min-h-[120px]"
                    autoFocus
                  />
                </div>

                {/* Image Preview */}
                {previewUrls.length > 0 && (
                  <div className="space-y-3">
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

                {/* Media Actions */}
                <div className="border-t border-gray-200 pt-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <button
                        type="button"
                        onClick={handlePostMediaSelect}
                        className="flex items-center space-x-2 text-gray-600 hover:text-blue-600 transition-colors"
                      >
                        <Image size={20} />
                        <span>Фото/Відео</span>
                      </button>
                      <button
                        type="button"
                        className="flex items-center space-x-2 text-gray-600 hover:text-green-600 transition-colors"
                      >
                        <MapPin size={20} />
                        <span>Місце</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Submit Button */}
                <div className="flex justify-end space-x-4 pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreatePost(false);
                      setPostContent('');
                      setSelectedFiles([]);
                      setPreviewUrls([]);
                    }}
                    className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Скасувати
                  </button>
                  <button
                    type="submit"
                    disabled={!postContent.trim() || uploading}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {uploading ? 'Публікація...' : 'Опублікувати'}
                  </button>
                </div>
              </div>

              {/* Hidden File Input */}
              <input
                ref={multiFileInputRef}
                type="file"
                accept="image/*,video/*"
                multiple
                onChange={handlePostFileChange}
                className="hidden"
              />
            </form>
          </div>
        </div>
      )}

      {/* Edit Profile Modal */}
      {showEditProfile && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <form onSubmit={handleSubmit(handleProfileSubmit)} className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Редагувати профіль</h2>
                <button
                  type="button"
                  onClick={() => setShowEditProfile(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Ім'я</label>
                    <input
                      {...register('name', { required: 'Ім\'я обов\'язкове' })}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                    {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Прізвище</label>
                    <input
                      {...register('lastName', { required: 'Прізвище обов\'язкове' })}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                    {errors.lastName && <p className="text-red-500 text-sm mt-1">{errors.lastName.message}</p>}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Про себе</label>
                  <textarea
                    {...register('bio')}
                    rows={4}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Розкажіть про себе..."
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Місцезнаходження</label>
                    <input
                      {...register('location')}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Місто, країна"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Веб-сайт</label>
                    <input
                      {...register('website')}
                      type="url"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="https://example.com"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Телефон</label>
                    <input
                      {...register('phone')}
                      type="tel"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="+380501234567"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">День народження</label>
                    <input
                      {...register('birthday')}
                      type="date"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Робота</label>
                    <input
                      {...register('work')}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Посада, компанія"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Освіта</label>
                    <input
                      {...register('education')}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Навчальний заклад"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Сімейний стан</label>
                  <select
                    {...register('relationshipStatus')}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Не вказано</option>
                    <option value="Single">Холостий/Неодружена</option>
                    <option value="In a relationship">У стосунках</option>
                    <option value="Engaged">Заручений/Заручена</option>
                    <option value="Married">Одружений/Одружена</option>
                    <option value="Complicated">Все складно</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end space-x-4 mt-8 pt-6 border-t">
                <button
                  type="button"
                  onClick={() => setShowEditProfile(false)}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Скасувати
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {uploading ? 'Збереження...' : 'Зберегти зміни'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}