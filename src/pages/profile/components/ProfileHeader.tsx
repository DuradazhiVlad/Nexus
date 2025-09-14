import React, { useState, useEffect } from 'react';
import { User, Mail, MapPin, Calendar, Edit3, Camera, Save, X, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AuthUserProfile } from '../../../lib/authUserService';
import { ProfileImageUpload } from '../../../components/ProfileImageUpload';
import { UserStatsService, UserStats } from '../../../lib/userStatsService';

interface ProfileHeaderProps {
  profile: AuthUserProfile;
  isEditing: boolean;
  saving: boolean;
  onEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
  onAvatarChange?: (avatarUrl: string) => void;
}

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  profile,
  isEditing,
  saving,
  onEdit,
  onSave,
  onCancel,
  onAvatarChange
}) => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<UserStats>({
    friendsCount: 0,
    photosCount: 0,
    videosCount: 0,
    postsCount: 0
  });
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    if (profile?.id) {
      loadUserStats();
    }
  }, [profile?.id]);

  const loadUserStats = async () => {
    try {
      setStatsLoading(true);
      const userStats = await UserStatsService.getUserStats(profile.id);
      setStats(userStats);
    } catch (error) {
      console.error('Error loading user stats:', error);
    } finally {
      setStatsLoading(false);
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

  return (
    <div className="relative bg-white">
      {/* Cover Photo */}
      <div className="h-80 bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent"></div>
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-50"></div>
        
        {/* Cover Actions */}
        <div className="absolute top-4 right-4">
          <button className="flex items-center px-4 py-2 bg-white/10 backdrop-blur-md text-white rounded-xl hover:bg-white/20 transition-all duration-200 border border-white/20">
            <Camera size={18} className="mr-2" />
            Змінити обкладинку
          </button>
        </div>
        
        {/* Gradient overlay for better text readability */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black/50 to-transparent"></div>
      </div>

      {/* Profile Content */}
      <div className="relative">
        {/* Main Profile Section */}
        <div className="px-6 pb-6">
          {/* Personal Info and Avatar */}
          <div className="flex items-start justify-between -mt-20 mb-6">
            {/* Personal Information */}
            <div className="flex-1 pt-16">
              <div className="mb-4">
                <h1 className="text-4xl font-bold text-gray-900 mb-2">
                  {profile.name || ''} {profile.last_name || ''}
                </h1>
                {profile.email && (
                  <p className="text-gray-500 text-lg font-medium">@{profile.email.split('@')[0]}</p>
                )}
              </div>
              
              {/* Status and Quick Info */}
              <div className="flex items-center space-x-6 text-sm">
                <div className="flex items-center text-green-600 font-medium">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                  Онлайн
                </div>
                
                {profile.city && (
                  <div className="flex items-center text-gray-600">
                    <MapPin size={16} className="mr-2" />
                    {profile.city}
                  </div>
                )}
                
                <div className="flex items-center text-gray-600">
                  <Calendar size={16} className="mr-2" />
                  Приєднався {formatDate(profile.created_at)}
                </div>
              </div>
              
              {/* Bio */}
              {!isEditing && profile.bio && (
                <div className="mt-4">
                  <p className="text-gray-700 text-base leading-relaxed max-w-2xl">
                    {profile.bio}
                  </p>
                </div>
              )}
            </div>

            {/* Avatar - Rectangular */}
            <div className="relative ml-6">
              {isEditing ? (
                <ProfileImageUpload
                  currentAvatar={profile.avatar}
                  onUpload={onAvatarChange || (() => {})}
                  onCancel={() => {}}
                  className="w-48 h-32 rounded-xl border-4 border-white shadow-2xl"
                />
              ) : (
                <div className="w-48 h-32 rounded-xl border-4 border-white shadow-2xl overflow-hidden bg-gray-200 relative group">
                  {profile.avatar ? (
                    <img
                      src={profile.avatar}
                      alt={profile.name || 'User'}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600 text-white text-2xl font-bold">
                      {getInitials(profile.name, profile.last_name)}
                    </div>
                  )}
                  
                  {/* Online indicator */}
                  <div className="absolute bottom-2 right-2 w-4 h-4 bg-green-500 rounded-full border-2 border-white shadow-lg"></div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-3 pt-16">
              {!isEditing ? (
                <>
                  <button
                    onClick={onEdit}
                    className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                  >
                    <Edit3 size={18} className="mr-2" />
                    Редагувати профіль
                  </button>
                  <button
                    onClick={() => navigate('/settings')}
                    className="flex items-center px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all duration-200 border border-gray-200"
                  >
                    <Settings size={18} className="mr-2" />
                    Налаштування
                  </button>
                </>
              ) : (
                <div className="flex space-x-3">
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      if (!saving) {
                        onSave();
                      }
                    }}
                    disabled={saving}
                    className="flex items-center px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg"
                  >
                    {saving ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    ) : (
                      <Save size={18} className="mr-2" />
                    )}
                    {saving ? 'Збереження...' : 'Зберегти'}
                  </button>
                  <button
                    onClick={onCancel}
                    disabled={saving}
                    className="flex items-center px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 disabled:opacity-50 transition-all duration-200 border border-gray-200"
                  >
                    <X size={18} className="mr-2" />
                    Скасувати
                  </button>
                </div>
              )}
            </div>
          </div>
          
          {/* Additional Info Row */}
          {!isEditing && (
            <div className="border-t border-gray-100 pt-6">
              <div className="flex flex-wrap gap-6 text-sm text-gray-600">
                {profile.birth_date && (
                  <div className="flex items-center">
                    <Calendar size={16} className="mr-2" />
                    Народився {formatDate(profile.birth_date)}
                  </div>
                )}
                
                {profile.email && (
                  <div className="flex items-center">
                    <Mail size={16} className="mr-2" />
                    {profile.email}
                  </div>
                )}
                
                {/* Stats */}
                <div className="flex items-center space-x-6">
                  {statsLoading ? (
                    <div className="flex items-center space-x-6">
                      <div className="h-4 bg-gray-200 rounded w-20 animate-pulse"></div>
                      <div className="h-4 bg-gray-200 rounded w-16 animate-pulse"></div>
                      <div className="h-4 bg-gray-200 rounded w-18 animate-pulse"></div>
                    </div>
                  ) : (
                    <>
                      <span className="font-medium text-gray-900">{stats.friendsCount} <span className="font-normal text-gray-600">друзів</span></span>
                      <span className="font-medium text-gray-900">{stats.photosCount} <span className="font-normal text-gray-600">фото</span></span>
                      <span className="font-medium text-gray-900">{stats.videosCount} <span className="font-normal text-gray-600">відео</span></span>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};