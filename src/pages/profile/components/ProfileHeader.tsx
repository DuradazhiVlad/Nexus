import React from 'react';
import { User, Mail, MapPin, Calendar, Edit3, Camera, Save, X, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AuthUserProfile } from '../../../lib/authUserService';
import { ProfileImageUpload } from '../../../components/ProfileImageUpload';

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
              {isEditing ? (
                <ProfileImageUpload
                  currentAvatar={profile.avatar}
                  onUpload={onAvatarChange || (() => {})}
                  onCancel={() => {}}
                  className="w-32 h-32 mx-auto"
                />
              ) : (
                <div className="w-32 h-32 bg-white rounded-full p-2 shadow-lg">
                  {profile.avatar ? (
                    <img
                      src={profile.avatar}
                      alt={profile.name || 'User'}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold">
                      {getInitials(profile.name, profile.last_name)}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* User Name and Email */}
            {!isEditing && (
              <div className="mb-2">
                <h1 className="text-3xl font-bold text-gray-900">
                  {profile.name || ''} {profile.last_name || ''}
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
                  onClick={onEdit}
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
                  onClick={(e) => {
                    e.preventDefault();
                    if (!saving) {
                      onSave();
                    }
                  }}
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
                  onClick={onCancel}
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
          {!isEditing && (
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
            </>
          )}
        </div>
      </div>
    </div>
  );
};