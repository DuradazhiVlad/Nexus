import React from 'react';
import { AuthUserProfile } from '../../../lib/authUserService';

interface ProfileInfoProps {
  profile: AuthUserProfile;
}

export const ProfileInfo: React.FC<ProfileInfoProps> = ({ profile }) => {
  return (
    <div className="mt-6 p-4 bg-gray-50 rounded-lg">
      <h3 className="text-lg font-semibold text-gray-900 mb-3">Додаткова інформація</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {profile.bio && (
          <div className="md:col-span-2">
            <span className="text-sm font-medium text-gray-600">Про себе:</span>
            <p className="text-gray-900">{profile.bio}</p>
          </div>
        )}
        {profile.city && (
          <div>
            <span className="text-sm font-medium text-gray-600">Місто:</span>
            <p className="text-gray-900">{profile.city}</p>
          </div>
        )}
        {profile.birth_date && (
          <div>
            <span className="text-sm font-medium text-gray-600">Дата народження:</span>
            <p className="text-gray-900">{new Date(profile.birth_date).toLocaleDateString('uk-UA')}</p>
          </div>
        )}
        {profile.gender && (
          <div>
            <span className="text-sm font-medium text-gray-600">Стать:</span>
            <p className="text-gray-900">{profile.gender === 'male' ? 'Чоловіча' : profile.gender === 'female' ? 'Жіноча' : 'Інше'}</p>
          </div>
        )}
        {profile.age && (
          <div>
            <span className="text-sm font-medium text-gray-600">Вік:</span>
            <p className="text-gray-900">{profile.age} років</p>
          </div>
        )}
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
          {process.env.NODE_ENV === 'development' && (
            <div className="text-xs text-gray-400 mt-1">
              Debug: {JSON.stringify(profile.hobbies)} (length: {profile.hobbies?.length || 0})
            </div>
          )}
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
          {process.env.NODE_ENV === 'development' && (
            <div className="text-xs text-gray-400 mt-1">
              Debug: {JSON.stringify(profile.languages)} (length: {profile.languages?.length || 0})
            </div>
          )}
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