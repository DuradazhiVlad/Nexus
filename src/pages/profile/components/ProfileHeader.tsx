import React from 'react';
import { Mail, MapPin, Edit3, Save, X, Settings, MessageCircle, UserPlus, UserX } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ProfileImageUpload } from '../../../components/ProfileImageUpload';
import { useProfileEdit } from '../context/ProfileEditContext';
import { useFriendship } from '../hooks/useFriendship';
import { UserNotesSection } from './UserNotesSection';

interface ProfileHeaderProps {
  // profile: AuthUserProfile;
  // isEditing: boolean;
  // saving: boolean;
  // onEdit: () => void;
  // onSave: () => void;
  // onCancel: () => void;
  // onAvatarChange?: (avatarUrl: string) => void;
}

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  // profile,
  // isEditing,
  // saving,
  // onEdit,
  // onSave,
  // onCancel,
  // onAvatarChange
}) => {
  const navigate = useNavigate();
  const { profile, currentUser, isEditing, saving, setIsEditing, saveProfile, cancelEdit, handleAvatarChange } = useProfileEdit();

  const isOwnProfile = !!profile && !!currentUser && profile.id === currentUser.id;
  const { friendshipStatus, sendFriendRequest, removeFriend, loading: friendshipLoading } = useFriendship(profile?.id);

  

  const getInitials = (name?: string, lastname?: string) => {
    const first = name ? name[0].toUpperCase() : '';
    const last = lastname ? lastname[0].toUpperCase() : '';
    return `${first}${last}`;
  };

  if (!profile) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      {/* Rectangular avatar */}
      <div className="w-full h-36 rounded-xl overflow-hidden bg-gray-200">
        {isEditing ? (
          <ProfileImageUpload
            currentAvatar={profile.avatar}
            onUpload={handleAvatarChange}
            onCancel={() => {}}
            className="w-full h-36 rounded-xl"
          />
        ) : profile.avatar ? (
          <img src={profile.avatar} alt={profile.name || 'User'} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600 text-white text-2xl font-bold">
            {getInitials(profile.name, profile.last_name)}
          </div>
        )}
      </div>

      {/* Actions like VK */}
      <div className="mt-4 grid grid-cols-1 gap-2">
        {isOwnProfile ? (
          <>
            <UserNotesSection />
            <button onClick={() => setIsEditing(true)} className="flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
              <Edit3 className="w-4 h-4 mr-2" /> Редагувати профіль
            </button>
            <button onClick={() => navigate('/settings')} className="flex items-center justify-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition">
              <Settings className="w-4 h-4 mr-2" /> Налаштування
            </button>
          </>
        ) : (
          <>
            {friendshipStatus === 'accepted' ? (
              <button onClick={() => removeFriend()} disabled={friendshipLoading} className="flex items-center justify-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition">
                <UserX className="w-4 h-4 mr-2" /> Видалити з друзів
              </button>
            ) : (
              <button onClick={() => sendFriendRequest()} disabled={friendshipLoading || friendshipStatus === 'sent' || friendshipStatus === 'pending'} className="flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
                <UserPlus className="w-4 h-4 mr-2" /> {friendshipStatus === 'sent' || friendshipStatus === 'pending' ? 'Запит відправлено' : 'Додати в друзі'}
              </button>
            )}
            {profile?.privacy?.profileVisibility === 'public' && (
              <button onClick={() => navigate('/messages')} className="flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition">
                <MessageCircle className="w-4 h-4 mr-2" /> Написати повідомлення
              </button>
            )}
          </>
        )}

        {isEditing && (
          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => saveProfile()} disabled={saving} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50">
              <Save className="w-4 h-4 inline-block mr-2" /> {saving ? 'Збереження...' : 'Зберегти'}
            </button>
            <button onClick={cancelEdit} disabled={saving} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50">
              <X className="w-4 h-4 inline-block mr-2" /> Скасувати
            </button>
          </div>
        )}
      </div>

      {/* Quick info under avatar */}
      <div className="mt-4 text-sm text-gray-600 space-y-1">
        {profile.city && (
          <div className="flex items-center"><MapPin className="w-4 h-4 mr-2" />{profile.city}</div>
        )}
        {profile.email && (
          <div className="flex items-center"><Mail className="w-4 h-4 mr-2" />{profile.email}</div>
        )}
      </div>
    </div>
  );
};