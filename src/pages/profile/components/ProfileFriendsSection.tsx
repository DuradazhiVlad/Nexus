import React from 'react';
import { AuthUserProfile } from '../../../lib/authUserService';
import { useProfileEdit } from '../context/ProfileEditContext';

interface ProfileFriendsSectionProps {
  // profile: AuthUserProfile;
}

export const ProfileFriendsSection: React.FC<ProfileFriendsSectionProps> = () => {
  const { profile } = useProfileEdit();

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Друзі</h3>
      <div className="grid grid-cols-3 gap-4">
        {/* Placeholder for friends */}
        {[...Array(6)].map((_, i) => (
          <div key={i} className="flex flex-col items-center">
            <div className="w-16 h-16 bg-gray-200 rounded-full mb-2"></div>
            <p className="text-sm text-gray-700">Друг {i + 1}</p>
          </div>
        ))}
      </div>
      <button className="mt-4 w-full py-2 bg-gray-100 rounded-lg text-blue-600 hover:bg-gray-200 transition-colors">
        Показати всіх друзів
      </button>
    </div>
  );
};