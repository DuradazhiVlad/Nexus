import React from 'react';
import { UserProfile } from '../types';

interface ProfileInfoProps {
  profile: UserProfile;
}

export const ProfileInfo: React.FC<ProfileInfoProps> = ({ profile }) => {
  return (
    <div className="mt-6 p-4 bg-gray-50 rounded-lg">
      <h3 className="text-lg font-semibold text-gray-900 mb-3">Додаткова інформація</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {profile.education && (
          <div>
            <span className="text-sm font-medium text-gray-600">Освіта:</span>
            <p className="text-gray-900">{profile.education}</p>
          </div>
        )}
        {profile.work && (
          <div>
            <span className="text-sm font-medium text-gray-600">Робота:</span>
            <p className="text-gray-900">{profile.work}</p>
          </div>
        )}
        {profile.phone && (
          <div>
            <span className="text-sm font-medium text-gray-600">Телефон:</span>
            <p className="text-gray-900">{profile.phone}</p>
          </div>
        )}
        {profile.website && (
          <div>
            <span className="text-sm font-medium text-gray-600">Веб-сайт:</span>
            <a href={profile.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
              {profile.website}
            </a>
          </div>
        )}
        {profile.relationship_status && (
          <div>
            <span className="text-sm font-medium text-gray-600">Сімейний стан:</span>
            <p className="text-gray-900">{profile.relationship_status}</p>
          </div>
        )}
      </div>
      
      {profile.hobbies?.length > 0 && (
        <div className="mt-4">
          <span className="text-sm font-medium text-gray-600">Хобі:</span>
          <div className="flex flex-wrap gap-2 mt-1">
            {profile.hobbies.map((hobby, index) => (
              <span key={index} className="bg-blue-100 text-blue-800 text-sm font-medium px-2.5 py-0.5 rounded-full">
                {hobby}
              </span>
            ))}
          </div>
        </div>
      )}
      
      {profile.languages?.length > 0 && (
        <div className="mt-4">
          <span className="text-sm font-medium text-gray-600">Мови:</span>
          <div className="flex flex-wrap gap-2 mt-1">
            {profile.languages.map((language, index) => (
              <span key={index} className="bg-purple-100 text-purple-800 text-sm font-medium px-2.5 py-0.5 rounded-full">
                {language}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}; 