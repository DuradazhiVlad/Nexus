import React, { useEffect, useState, useRef } from 'react';
import { Sidebar } from '../../components/Sidebar';
import { DatabaseService, DatabaseUser } from '../../../lib/database';
import { Camera, Settings, Upload, X, Edit3, MapPin, Calendar, Briefcase, GraduationCap, Phone, Globe, Eye, EyeOff, ChevronLeft, ChevronRight, Image, Trash2, Palette } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PhotoFilters } from './PhotoFilters';

interface Media {
  id: string;
  type: 'photo' | 'video';
  url: string;
  created_at: string;
}

export function Profile() {
  const [user, setUser] = useState<DatabaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [media, setMedia] = useState<Media[]>([]);
  const [error, setError] = useState<string>('');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showDetailedInfo, setShowDetailedInfo] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [showPhotoEditor, setShowPhotoEditor] = useState(false);
  const [editingImageUrl, setEditingImageUrl] = useState<string>('');
  const [editingImageIndex, setEditingImageIndex] = useState<number>(-1);
  const [friends, setFriends] = useState<DatabaseUser[]>([]);
  const [groups, setGroups] = useState<any[]>([]); // Заглушка для груп
  const fileInputRef = useRef<HTMLInputElement>(null);
  const multiFileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    async function loadProfile() {
      try {
        setLoading(true);
        setError('');

        const userProfile = await DatabaseService.getCurrentUserProfile();
        
        if (!userProfile) {
          navigate('/login');
          return;
        }

        setUser(userProfile);
        const userMedia = await DatabaseService.getUserMedia();
        setMedia(userMedia);

        // Друзі
        const userFriends = await DatabaseService.getUserFriends();
        setFriends(userFriends);
        // Групи (заглушка)
        setGroups([
          { id: 1, name: 'Frontend Devs', avatar: '', members: 12 },
          { id: 2, name: 'React Ukraine', avatar: '', members: 8 }
        ]);

      } catch (error) {
        console.error('Error loading profile:', error);
        setError('Помилка завантаження профілю');
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, [navigate]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    const files = Array.from(e.dataTransfer.files) as File[];
    const imageFiles = files.filter(file => file.type.startsWith('image/')).slice(0, 10); // Максимум 10 фото
    
    if (imageFiles.length === 1) {
      handleFileUpload(imageFiles[0]); // Одне фото - для аватара
    } else if (imageFiles.length > 1) {
      handleMultipleFiles(imageFiles); // Декілька фото - для поста
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      handleFileUpload(file);
    }
  };

  const handleMultipleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []) as File[];
    const imageFiles = files.filter(file => file.type.startsWith('image/')).slice(0, 10);
    
    if (imageFiles.length > 0) {
      handleMultipleFiles(imageFiles);
    }
  };

  const handleMultipleFiles = (files: File[]) => {
    setSelectedFiles(files);
    
    // Створюємо preview URL для кожного файлу
    const urls = files.map(file => URL.createObjectURL(file));
    setPreviewUrls(urls);
    setCurrentImageIndex(0);
    setShowCreatePost(true);
  };

  const handleFileUpload = async (file: File) => {
    setUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const imageUrl = e.target?.result as string;
        setEditingImageUrl(imageUrl);
        setEditingImageIndex(-1); // -1 означає аватар
        setShowPhotoEditor(true);
        setShowUploadModal(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error uploading file:', error);
    } finally {
      setUploading(false);
    }
  };

  const handleApplyFilter = async (filteredImageUrl: string) => {
    if (editingImageIndex === -1) {
      // Оновлюємо аватар
      const success = await DatabaseService.updateUserProfile({
        avatar: filteredImageUrl
      });
      
      if (success && user) {
        setUser({ ...user, avatar: filteredImageUrl });
      }
    } else {
      // Оновлюємо фото в пості
      const newUrls = [...previewUrls];
      newUrls[editingImageIndex] = filteredImageUrl;
      setPreviewUrls(newUrls);
    }
    
    setShowPhotoEditor(false);
    setEditingImageUrl('');
    setEditingImageIndex(-1);
  };

  const removeImage = (index: number) => {
    const newFiles = selectedFiles.filter((_, i) => i !== index);
    const newUrls = previewUrls.filter((_, i) => i !== index);
    
    // Очищуємо URL для видаленого файлу
    URL.revokeObjectURL(previewUrls[index]);
    
    setSelectedFiles(newFiles);
    setPreviewUrls(newUrls);
    
    if (currentImageIndex >= newUrls.length && newUrls.length > 0) {
      setCurrentImageIndex(newUrls.length - 1);
    }
    
    if (newFiles.length === 0) {
      setShowCreatePost(false);
    }
  };

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % previewUrls.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + previewUrls.length) % previewUrls.length);
  };

  const createPost = async () => {
    if (selectedFiles.length === 0) return;
    
    setUploading(true);
    try {
      // В реальному додатку тут би було завантаження на сервер
      // Поки що просто симулюємо успішне створення поста
      console.log('Creating post with', selectedFiles.length, 'images');
      
      // Очищуємо preview URLs
      previewUrls.forEach(url => URL.revokeObjectURL(url));
      
      setSelectedFiles([]);
      setPreviewUrls([]);
      setShowCreatePost(false);
      setCurrentImageIndex(0);
      
      // Тут можна додати логіку збереження поста в базу даних
      
    } catch (error) {
      console.error('Error creating post:', error);
    } finally {
      setUploading(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Не вказано';
    return new Date(dateString).toLocaleDateString('uk-UA', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const getAge = (birthDate?: string) => {
    if (!birthDate) return null;
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  if (loading) {
    return (
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="flex-1 ml-64 p-8">
          <div className="text-center">
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
          <div className="text-center">
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
              {error}
            </div>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Спробувати знову
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="flex-1 ml-64 p-8">
          <div className="text-center">
            <p className="text-gray-600">Профіль не знайдено</p>
            <button
              onClick={() => navigate('/login')}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Увійти
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 ml-64">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="bg-white shadow-sm">
            <div className="px-8 py-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-6">
                  {/* Avatar */}
                  <div className="relative group">
                    <div 
                      className="w-32 h-32 rounded-lg overflow-hidden bg-gray-200 cursor-pointer"
                      onClick={() => setShowUploadModal(true)}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                    >
                      {user.avatar ? (
                        <img
                          src={user.avatar}
                          alt={user.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-400 to-blue-600">
                          <span className="text-4xl text-white font-bold">
                            {user.name?.[0]?.toUpperCase() || '?'}
                          </span>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Camera className="text-white" size={24} />
                      </div>
                    </div>
                    <button
                      onClick={() => setShowUploadModal(true)}
                      className="absolute -bottom-2 -right-2 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center hover:bg-blue-700 transition-colors"
                    >
                      <Camera size={16} />
                    </button>
                  </div>

                  {/* User Info */}
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-1">
                      {user.name} {user.lastName}
                    </h1>
                    <div className="flex items-center text-sm text-gray-600 space-x-4">
                      <span className="flex items-center">
                        <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                        Online
                      </span>
                      {user.city && (
                        <span className="flex items-center">
                          <MapPin size={14} className="mr-1" />
                          {user.city}
                        </span>
                      )}
                    </div>
                    {user.birthDate && (
                      <p className="text-sm text-gray-600 mt-1">
                        {formatDate(user.birthDate)}
                        {getAge(user.birthDate) && ` (${getAge(user.birthDate)} років)`}
                      </p>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => navigate('/settings')}
                    className="flex items-center px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    <Edit3 size={16} className="mr-2" />
                    Редагувати
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="flex gap-6 p-8">
            {/* Left Column - Info */}
            <div className="w-80 space-y-6">
              {/* Basic Info */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="space-y-4">
                  {user.birthDate && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">День народження:</span>
                      <span className="text-gray-900">{formatDate(user.birthDate)}</span>
                    </div>
                  )}
                  
                  {user.city && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Місто:</span>
                      <span className="text-gray-900">{user.city}</span>
                    </div>
                  )}

                  <div className="flex justify-between">
                    <span className="text-gray-600">Мова:</span>
                    <span className="text-gray-900">Українська</span>
                  </div>

                  <button
                    onClick={() => setShowDetailedInfo(!showDetailedInfo)}
                    className="text-blue-600 hover:text-blue-700 text-sm flex items-center"
                  >
                    {showDetailedInfo ? (
                      <>
                        <EyeOff size={14} className="mr-1" />
                        Приховати детальну інформацію
                      </>
                    ) : (
                      <>
                        <Eye size={14} className="mr-1" />
                        Показати детальну інформацію
                      </>
                    )}
                  </button>
                </div>

                {showDetailedInfo && (
                  <div className="mt-6 pt-6 border-t border-gray-200 space-y-4">
                    <h3 className="font-semibold text-gray-900">Основна інформація</h3>
                    
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Рідне місто:</span>
                        <span className="text-gray-900">{user.city || 'Не вказано'}</span>
                      </div>
                      
                      <div className="flex justify-between">
                        <span className="text-gray-600">Сімейний стан:</span>
                        <span className="text-gray-900">Не вказано</span>
                      </div>
                    </div>

                    <h3 className="font-semibold text-gray-900 mt-6">Контактна інформація</h3>
                    
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Моб. телефон:</span>
                        <span className="text-gray-900">Не вказано</span>
                      </div>
                      
                      <div className="flex justify-between">
                        <span className="text-gray-600">Веб-сайт:</span>
                        <span className="text-gray-900">Не вказано</span>
                      </div>
                    </div>

                    <h3 className="font-semibold text-gray-900 mt-6">Кар'єра</h3>
                    
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Місце роботи:</span>
                        <span className="text-gray-900">Не вказано</span>
                      </div>
                    </div>

                    <h3 className="font-semibold text-gray-900 mt-6">Освіта</h3>
                    
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">ВУЗ:</span>
                        <span className="text-gray-900">Не вказано</span>
                      </div>
                      
                      <div className="flex justify-between">
                        <span className="text-gray-600">Факультет:</span>
                        <span className="text-gray-900">Не вказано</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column - Posts and Media */}
            <div className="flex-1 space-y-6">
              {/* Друзі */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Друзі ({friends.length})</h2>
                <div className="flex flex-wrap gap-4">
                  {friends.length === 0 ? (
                    <span className="text-gray-500">Немає друзів</span>
                  ) : (
                    friends.slice(0, 8).map(friend => (
                      <div key={friend.id} className="flex flex-col items-center w-20">
                        <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-200 mb-1">
                          {friend.avatar ? (
                            <img src={friend.avatar} alt={friend.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-400 to-blue-600">
                              <span className="text-white font-bold">{friend.name?.[0]?.toUpperCase() || '?'}</span>
                            </div>
                          )}
                        </div>
                        <span className="text-xs text-gray-700 text-center">{friend.name}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Фото */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Фото ({media.length})</h2>
                <div className="grid grid-cols-5 gap-2">
                  {media.length === 0 ? (
                    <span className="text-gray-500">Немає фото</span>
                  ) : (
                    media.slice(0, 10).map(photo => (
                      <img key={photo.id} src={photo.url} alt="Фото" className="w-full h-20 object-cover rounded" />
                    ))
                  )}
                </div>
              </div>

              {/* Групи */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Групи ({groups.length})</h2>
                <div className="flex flex-wrap gap-4">
                  {groups.length === 0 ? (
                    <span className="text-gray-500">Немає груп</span>
                  ) : (
                    groups.map(group => (
                      <div key={group.id} className="flex flex-col items-center w-20">
                        <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-200 mb-1">
                          {group.avatar ? (
                            <img src={group.avatar} alt={group.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-green-400 to-blue-600">
                              <span className="text-white font-bold">{group.name?.[0]?.toUpperCase() || '?'}</span>
                            </div>
                          )}
                        </div>
                        <span className="text-xs text-gray-700 text-center">{group.name}</span>
                        <span className="text-[10px] text-gray-500">{group.members} учасників</span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Стіна (пости) */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Стіна</h2>
                {/* Post Creation */}
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200">
                    {user.avatar ? (
                      <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-400 to-blue-600">
                        <span className="text-white font-bold">{user.name?.[0]?.toUpperCase() || '?'}</span>
                      </div>
                    )}
                  </div>
                  <input
                    type="text"
                    placeholder="Що у вас нового?"
                    className="flex-1 px-4 py-2 bg-gray-50 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Опублікувати</button>
                </div>
                {/* No Posts Message */}
                <div className="bg-gray-50 rounded-lg p-8 text-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Edit3 className="text-gray-400" size={24} />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">На стіні поки немає жодного запису</h3>
                  <p className="text-gray-600">Ви можете додати перший запис на стіну</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Завантажити фото</h2>
              <button
                onClick={() => setShowUploadModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6">
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  dragOver 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-300 hover:border-gray-400'
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <p className="text-lg font-medium text-gray-900 mb-2">
                  Перетягніть фото сюди
                </p>
                <p className="text-gray-600 mb-4">
                  або натисніть для вибору файлу
                </p>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {uploading ? 'Завантаження...' : 'Вибрати файл'}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>
              
              <p className="text-xs text-gray-500 mt-4 text-center">
                Підтримуються формати: JPG, PNG, GIF. Максимальний розмір: 10MB
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Instagram-style Multi Photo Post Modal */}
      {showCreatePost && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl mx-4 max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Створити новий пост</h2>
              <button
                onClick={() => {
                  previewUrls.forEach(url => URL.revokeObjectURL(url));
                  setSelectedFiles([]);
                  setPreviewUrls([]);
                  setShowCreatePost(false);
                  setCurrentImageIndex(0);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>

            <div className="flex">
              {/* Image Preview Section */}
              <div className="flex-1 bg-black relative">
                {previewUrls.length > 0 && (
                  <>
                    <img
                      src={previewUrls[currentImageIndex]}
                      alt={`Preview ${currentImageIndex + 1}`}
                      className="w-full h-96 object-contain"
                    />
                    
                    {/* Navigation arrows */}
                    {previewUrls.length > 1 && (
                      <>
                        <button
                          onClick={prevImage}
                          className="absolute left-4 top-1/2 transform -translate-y-1/2 w-8 h-8 bg-black bg-opacity-50 text-white rounded-full flex items-center justify-center hover:bg-opacity-75"
                        >
                          <ChevronLeft size={20} />
                        </button>
                        <button
                          onClick={nextImage}
                          className="absolute right-4 top-1/2 transform -translate-y-1/2 w-8 h-8 bg-black bg-opacity-50 text-white rounded-full flex items-center justify-center hover:bg-opacity-75"
                        >
                          <ChevronRight size={20} />
                        </button>
                      </>
                    )}
                    
                    {/* Image counter */}
                    {previewUrls.length > 1 && (
                      <div className="absolute top-4 right-4 bg-black bg-opacity-50 text-white px-2 py-1 rounded-full text-sm">
                        {currentImageIndex + 1} / {previewUrls.length}
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Post Details Section */}
              <div className="w-80 border-l border-gray-200">
                <div className="p-4">
                  {/* User info */}
                  <div className="flex items-center mb-4">
                    <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-200 mr-3">
                      {user.avatar ? (
                        <img
                          src={user.avatar}
                          alt={user.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-400 to-blue-600">
                          <span className="text-white font-bold text-sm">
                            {user.name?.[0]?.toUpperCase() || '?'}
                          </span>
                        </div>
                      )}
                    </div>
                    <span className="font-semibold text-gray-900">
                      {user.name} {user.lastName}
                    </span>
                  </div>

                  {/* Caption */}
                  <textarea
                    placeholder="Додайте підпис..."
                    className="w-full h-32 p-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                    maxLength={500}
                  />

                  {/* Image thumbnails */}
                  <div className="mt-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">
                      Фото ({selectedFiles.length})
                    </h4>
                    <div className="grid grid-cols-4 gap-2">
                      {previewUrls.map((url, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={url}
                            alt={`Thumbnail ${index + 1}`}
                            className={`w-full h-16 object-cover rounded cursor-pointer ${
                              index === currentImageIndex ? 'ring-2 ring-blue-500' : ''
                            }`}
                            onClick={() => setCurrentImageIndex(index)}
                          />
                          <button
                            onClick={() => {
                              setEditingImageUrl(url);
                              setEditingImageIndex(index);
                              setShowPhotoEditor(true);
                            }}
                            className="absolute top-1 left-1 w-5 h-5 bg-blue-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Palette size={12} />
                          </button>
                          <button
                            onClick={() => removeImage(index)}
                            className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Add more photos */}
                  <button
                    onClick={() => multiFileInputRef.current?.click()}
                    className="w-full mt-4 py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-gray-400 hover:text-gray-700 transition-colors"
                  >
                    + Додати ще фото
                  </button>
                </div>

                {/* Action buttons */}
                <div className="border-t border-gray-200 p-4">
                  <button
                    onClick={createPost}
                    disabled={uploading || selectedFiles.length === 0}
                    className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {uploading ? 'Публікація...' : 'Поділитися'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Photo Editor Modal */}
      {showPhotoEditor && (
        <PhotoFilters
          imageUrl={editingImageUrl}
          onApplyFilter={handleApplyFilter}
          onClose={() => {
            setShowPhotoEditor(false);
            setEditingImageUrl('');
            setEditingImageIndex(-1);
          }}
        />
      )}
    </div>
  );
}