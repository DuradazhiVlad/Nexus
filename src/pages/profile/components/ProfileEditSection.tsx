import React from 'react';
import { Edit3, Camera, Save, X } from 'lucide-react';
import { ProfileImageUpload } from '../../../components/ProfileImageUpload';
import { useProfileEdit } from '../context/ProfileEditContext';

export const ProfileEditSection: React.FC = () => {
  const {
    profile,
    isEditing,
    saving,
    setIsEditing,
    saveProfile,
    cancelEdit,
    handleAvatarChange,
    currentUser,
  } = useProfileEdit();
  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="text-center">
        {isEditing ? (
          <ProfileImageUpload
            currentAvatar={profile.avatar}
            onUpload={handleAvatarChange}
            onCancel={() => {}}
            className="w-32 h-32 mx-auto rounded-lg shadow-md"
          />
        ) : (
          <div className="w-32 h-32 mx-auto rounded-lg shadow-md overflow-hidden bg-white">
            {profile.avatar ? (
              <img
                src={profile.avatar}
                alt={profile.name || 'User'}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold">
                {profile.name?.[0]?.toUpperCase() || 'U'}{profile.last_name?.[0]?.toUpperCase() || ''}
              </div>
            )}
          </div>
        )}

        <div className="mt-4 space-y-2">
          {!isEditing ? (
            <>
              {currentUser?.id === profile?.id && (
                <button
                  onClick={onEdit}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                >
                  <Edit3 className="inline-block w-4 h-4 mr-2" /> Редагувати
                </button>
              )}
            </>
          ) : (
            <div className="space-y-2">
              <button
                onClick={onSave}
                disabled={saving}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 text-sm font-medium"
              >
                {saving ? <Save className="inline-block w-4 h-4 mr-2 animate-pulse" /> : <Save className="inline-block w-4 h-4 mr-2" />} {saving ? 'Збереження...' : 'Зберегти'}
              </button>
              <button
                onClick={onCancel}
                className="w-full px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors text-sm font-medium"
              >
                <X className="inline-block w-4 h-4 mr-2" /> Скасувати
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};