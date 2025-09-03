import React, { useState } from 'react';
import { AuthUserProfile } from '../../../lib/authUserService';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface ProfileInfoProps {
  profile: AuthUserProfile;
}

export const ProfileInfo: React.FC<ProfileInfoProps> = ({ profile }) => {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    personal: false,
    hobbies: false,
    languages: false
  });

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Перевіряємо, чи є хоч якась інформація в профілі
  const hasPersonalInfo = profile.education || profile.work || profile.phone || 
                          profile.website || profile.relationship_status;
  const hasHobbies = profile.hobbies?.length > 0;
  const hasLanguages = profile.languages?.length > 0;

  return (
    <div className="mt-6 p-4 bg-gray-50 rounded-lg">
      <h3 className="text-lg font-semibold text-gray-900 mb-3">Додаткова інформація</h3>
<<<<<<< HEAD
      
      {/* Особиста інформація */}
      <div className="border-b border-gray-200 pb-3 mb-3">
        <button 
          onClick={() => toggleSection('personal')}
          className="flex items-center justify-between w-full text-left"
        >
          <span className="font-medium">Особиста інформація</span>
          <span className="text-gray-500">
            {hasPersonalInfo ? (
              expandedSections.personal ? <ChevronUp size={18} /> : <ChevronDown size={18} />
            ) : (
              <span className="text-xs text-gray-400">Не вказано</span>
            )}
          </span>
        </button>
        
        {expandedSections.personal && hasPersonalInfo && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
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
=======
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
>>>>>>> 045292ca8f4981ae452b4934066e6e30219318c0
          </div>
        )}
      </div>
      
      {/* Хобі */}
      <div className="border-b border-gray-200 pb-3 mb-3">
        <button 
          onClick={() => toggleSection('hobbies')}
          className="flex items-center justify-between w-full text-left"
        >
          <span className="font-medium">Хобі</span>
          <span className="text-gray-500">
            {hasHobbies ? (
              expandedSections.hobbies ? <ChevronUp size={18} /> : <ChevronDown size={18} />
            ) : (
              <span className="text-xs text-gray-400">Не вказано</span>
            )}
          </span>
        </button>
        
        {expandedSections.hobbies && hasHobbies && (
          <div className="mt-3">
            <div className="flex flex-wrap gap-2">
              {profile.hobbies.map((hobby, index) => (
                <span key={index} className="bg-blue-100 text-blue-800 text-sm font-medium px-2.5 py-0.5 rounded-full">
                  {hobby}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
      
      {/* Мови */}
      <div>
        <button 
          onClick={() => toggleSection('languages')}
          className="flex items-center justify-between w-full text-left"
        >
          <span className="font-medium">Мови</span>
          <span className="text-gray-500">
            {hasLanguages ? (
              expandedSections.languages ? <ChevronUp size={18} /> : <ChevronDown size={18} />
            ) : (
              <span className="text-xs text-gray-400">Не вказано</span>
            )}
          </span>
        </button>
        
        {expandedSections.languages && hasLanguages && (
          <div className="mt-3">
            <div className="flex flex-wrap gap-2">
              {profile.languages.map((language, index) => (
                <span key={index} className="bg-purple-100 text-purple-800 text-sm font-medium px-2.5 py-0.5 rounded-full">
                  {language}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};