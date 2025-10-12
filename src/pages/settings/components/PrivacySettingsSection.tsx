import React from 'react';
import { Lock } from 'lucide-react';

interface PrivacySettingsSectionProps {
  settings: any;
  updateNestedField: (section: string, field: string, value: any) => void;
}

export const PrivacySettingsSection: React.FC<PrivacySettingsSectionProps> = ({
  settings,
  updateNestedField,
}) => {
  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-semibold mb-4 flex items-center">
        <Lock className="w-6 h-6 mr-2 text-gray-700" />
        Налаштування приватності
      </h2>

      {/* Profile Visibility */}
      <div className="mb-6">
        <h3 className="text-lg font-medium text-gray-900 mb-3">Видимість профілю</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div
            className={`flex flex-col items-center p-4 rounded-lg cursor-pointer border ${settings.privacy.profileVisibility === 'public' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'}`}
            onClick={() => updateNestedField('privacy', 'profileVisibility', 'public')}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className={`h-8 w-8 ${settings.privacy.profileVisibility === 'public' ? 'text-blue-500' : 'text-gray-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.5c-4.418 0-8 3.582-8 8s3.582 8 8 8 8-3.582 8-8-3.582-8-8-8zM12 17a5 5 0 100-10 5 5 0 000 10z" />
            </svg>
            <span className={`mt-2 text-sm font-medium ${settings.privacy.profileVisibility === 'public' ? 'text-blue-700' : 'text-gray-700'}`}>Публічний</span>
          </div>
          <div
            className={`flex flex-col items-center p-4 rounded-lg cursor-pointer border ${settings.privacy.profileVisibility === 'friends' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'}`}
            onClick={() => updateNestedField('privacy', 'profileVisibility', 'friends')}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className={`h-8 w-8 ${settings.privacy.profileVisibility === 'friends' ? 'text-blue-500' : 'text-gray-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20v-2a4 4 0 00-4-4H7a4 4 0 00-4 4v2M15 7a3 3 0 11-6 0 3 3 0 016 0zm4 8a2 2 0 100-4 2 2 0 000 4z" />
            </svg>
            <span className={`mt-2 text-sm font-medium ${settings.privacy.profileVisibility === 'friends' ? 'text-blue-700' : 'text-gray-700'}`}>Тільки друзі</span>
          </div>
          <div
            className={`flex flex-col items-center p-4 rounded-lg cursor-pointer border ${settings.privacy.profileVisibility === 'private' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'}`}
            onClick={() => updateNestedField('privacy', 'profileVisibility', 'private')}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className={`h-8 w-8 ${settings.privacy.profileVisibility === 'private' ? 'text-blue-500' : 'text-gray-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM12 15v2a4 4 0 00-4 4H3a4 4 0 01-4-4v-2h11z" />
            </svg>
            <span className={`mt-2 text-sm font-medium ${settings.privacy.profileVisibility === 'private' ? 'text-blue-700' : 'text-gray-700'}`}>Приватний</span>
          </div>
        </div>
      </div>

      {/* Show Birth Date */}
      <div className="flex items-center justify-between mb-4">
        <label htmlFor="show-birth-date" className="text-sm font-medium text-gray-700 cursor-pointer">
          Показувати дату народження
        </label>
        <div className="relative inline-block w-10 mr-2 align-middle select-none transition duration-200 ease-in">
          <input
            type="checkbox"
            name="show-birth-date"
            id="show-birth-date"
            className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer"
            checked={settings.privacy.showBirthDate}
            onChange={(e) => updateNestedField('privacy', 'showBirthDate', e.target.checked)}
          />
          <label
            htmlFor="show-birth-date"
            className={`toggle-label block overflow-hidden h-6 rounded-full cursor-pointer ${settings.privacy.showBirthDate ? 'bg-blue-500' : 'bg-gray-300'}`}
          >
            <span className={`toggle-dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform duration-300 ease-in-out ${settings.privacy.showBirthDate ? 'transform translate-x-6' : ''}`}></span>
          </label>
        </div>
      </div>

      {/* Show Email */}
      <div className="flex items-center justify-between mb-4">
        <label htmlFor="show-email" className="text-sm font-medium text-gray-700 cursor-pointer">
          Показувати електронну пошту
        </label>
        <div className="relative inline-block w-10 mr-2 align-middle select-none transition duration-200 ease-in">
          <input
            type="checkbox"
            name="show-email"
            id="show-email"
            className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer"
            checked={settings.privacy.showEmail}
            onChange={(e) => updateNestedField('privacy', 'showEmail', e.target.checked)}
          />
          <label
            htmlFor="show-email"
            className={`toggle-label block overflow-hidden h-6 rounded-full cursor-pointer ${settings.privacy.showEmail ? 'bg-blue-500' : 'bg-gray-300'}`}
          >
            <span className={`toggle-dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform duration-300 ease-in-out ${settings.privacy.showEmail ? 'transform translate-x-6' : ''}`}></span>
          </label>
        </div>
      </div>
    </div>
  );
};