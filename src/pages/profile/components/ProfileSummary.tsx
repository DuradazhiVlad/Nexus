import React from 'react';
import { MapPin } from 'lucide-react';
import { useProfileEdit } from '../context/ProfileEditContext';

export const ProfileSummary: React.FC = () => {
  const { profile } = useProfileEdit();
  if (!profile) return null;

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <h1 className="text-3xl font-extrabold text-gray-900 mb-2">
        {profile.name} {profile.last_name}
      </h1>
      <div className="flex items-center gap-4 text-gray-600 mb-4">
        {profile.city && (
          <span className="inline-flex items-center">
            <MapPin className="w-4 h-4 mr-1" /> {profile.city}
          </span>
        )}
        <span className="inline-flex items-center">
          <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
          Онлайн
        </span>
      </div>
      {profile.bio && (
        <div>
          <h3 className="text-base font-semibold text-gray-900 mb-1">Хобі та інтереси</h3>
          <p className="text-gray-700">{profile.bio}</p>
        </div>
      )}
    </div>
  );
};









