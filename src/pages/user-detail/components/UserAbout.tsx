import React from 'react';
import { UserDetail } from '../types';
import { 
  MapPin, 
  Calendar, 
  Globe, 
  Phone, 
  Mail, 
  Briefcase, 
  GraduationCap,
  Heart,
  Languages,
  User,
  Lock
} from 'lucide-react';

interface UserAboutProps {
  user: UserDetail;
}

export function UserAbout({ user }: UserAboutProps) {
  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('uk-UA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const renderInfoSection = (title: string, items: { icon: any; label: string; value?: string; hidden?: boolean }[]) => {
    const visibleItems = items.filter(item => item.value && !item.hidden);
    
    if (visibleItems.length === 0) return null;

    return (
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">{title}</h3>
        <div className="space-y-3">
          {visibleItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <div key={index} className="flex items-center gap-3 text-gray-600">
                <Icon size={16} className="text-gray-400 flex-shrink-0" />
                <span className="text-sm">{item.label}:</span>
                <span className="text-sm font-medium">{item.value}</span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderHobbiesAndLanguages = () => {
    const hasHobbies = user.hobbies && user.hobbies.length > 0;
    const hasLanguages = user.languages && user.languages.length > 0;

    if (!hasHobbies && !hasLanguages) return null;

    return (
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Інтереси та мови</h3>
        <div className="space-y-4">
          {hasHobbies && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Heart size={16} className="text-gray-400" />
                <span className="text-sm font-medium text-gray-700">Хобі</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {user.hobbies!.map((hobby, index) => (
                  <span 
                    key={index}
                    className="px-3 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                  >
                    {hobby}
                  </span>
                ))}
              </div>
            </div>
          )}
          
          {hasLanguages && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Languages size={16} className="text-gray-400" />
                <span className="text-sm font-medium text-gray-700">Мови</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {user.languages!.map((language, index) => (
                  <span 
                    key={index}
                    className="px-3 py-1 bg-green-100 text-green-800 text-xs rounded-full"
                  >
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

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      {/* Basic Info */}
      {renderInfoSection('Основна інформація', [
        { icon: MapPin, label: 'Місто', value: user.city },
        { icon: Calendar, label: 'Дата народження', value: formatDate(user.birth_date), hidden: !user.privacy?.showBirthDate },
        { icon: Calendar, label: 'Приєднався', value: formatDate(user.created_at) }
      ])}

      {/* Contact Info */}
      {renderInfoSection('Контактна інформація', [
        { icon: Mail, label: 'Email', value: user.email },
        { icon: Phone, label: 'Телефон', value: user.phone },
        { icon: Globe, label: 'Веб-сайт', value: user.website }
      ])}

      {/* Work & Education */}
      {renderInfoSection('Робота та освіта', [
        { icon: Briefcase, label: 'Робота', value: user.work },
        { icon: GraduationCap, label: 'Освіта', value: user.education }
      ])}

      {/* Relationship Status */}
      {user.relationship_status && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Особисте</h3>
          <div className="flex items-center gap-3 text-gray-600">
            <Heart size={16} className="text-gray-400" />
            <span className="text-sm">Сімейний стан:</span>
            <span className="text-sm font-medium">{user.relationship_status}</span>
          </div>
        </div>
      )}

      {/* Hobbies & Languages */}
      {renderHobbiesAndLanguages()}

      {/* Privacy Notice */}
      {user.privacy?.profileVisibility === 'private' && (
        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center gap-2 text-yellow-800">
            <Lock size={16} />
            <span className="text-sm font-medium">Приватний профіль</span>
          </div>
          <p className="text-sm text-yellow-700 mt-1">
            Деяка інформація може бути прихована через налаштування приватності користувача.
          </p>
        </div>
      )}
    </div>
  );
} 