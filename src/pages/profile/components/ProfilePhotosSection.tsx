import React from 'react';
import { useProfileEdit } from '../context/ProfileEditContext';

interface ProfilePhotosSectionProps {
  // Можливо, тут будуть пропси для фотографій, наприклад, profileId або список фотографій
}

export const ProfilePhotosSection: React.FC<ProfilePhotosSectionProps> = () => {
  const { profile } = useProfileEdit();
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Фотографії</h3>
      <div className="grid grid-cols-3 gap-2">
        {/* Placeholder for photos */}
        {[...Array(9)].map((_, i) => (
          <div key={i} className="w-full h-20 bg-gray-200 rounded-lg"></div>
        ))}
      </div>
      <button className="mt-4 w-full py-2 bg-gray-100 rounded-lg text-blue-600 hover:bg-gray-200 transition-colors">
        Показати всі фотографії
      </button>
    </div>
  );
};