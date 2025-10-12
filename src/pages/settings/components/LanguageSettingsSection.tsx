import React from 'react';
import { Globe } from 'lucide-react';

interface LanguageSettingsSectionProps {
  settings: any;
  updateNestedField: (section: string, field: string, value: any) => void;
  addLanguage: () => void;
  removeLanguage: (index: number) => void;
  newLanguage: string;
  setNewLanguage: (value: string) => void;
}

const LANGUAGE_OPTIONS = [
  'Українська',
  'English',
  'Español',
  'Français',
  'Deutsch',
  'Italiano',
  'Português',
  'Русский',
  'Polski',
  'Türkçe',
  '日本語',
  '简体中文',
  '繁體中文',
  '한국어',
];

export const LanguageSettingsSection: React.FC<LanguageSettingsSectionProps> = ({
  settings,
  updateNestedField,
  addLanguage,
  removeLanguage,
  newLanguage,
  setNewLanguage,
}) => {
  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-semibold mb-4 flex items-center">
        <Globe className="w-6 h-6 mr-2 text-gray-700" />
        Налаштування мови
      </h2>

      {/* Languages */}
      <div className="mb-6">
        <h3 className="text-lg font-medium text-gray-900 mb-3">Мови, якими я володію</h3>
        <div className="flex flex-wrap gap-2 mb-4">
          {settings.languages?.map((lang: string, idx: number) => (
            <span key={idx} className="flex items-center bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded-full">
              {lang}
              <button
                type="button"
                onClick={() => removeLanguage(idx)}
                className="ml-2 text-blue-800 hover:text-blue-600 focus:outline-none"
              >
                &times;
              </button>
            </span>
          ))}
        </div>
        <div className="flex">
          <select
            className="flex-grow border border-gray-300 rounded-l-md p-2 focus:ring-blue-500 focus:border-blue-500"
            value={newLanguage}
            onChange={(e) => setNewLanguage(e.target.value)}
          >
            <option value="">Виберіть мову</option>
            {LANGUAGE_OPTIONS.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
          <button
            type="button"
            onClick={addLanguage}
            className="bg-blue-500 text-white px-4 py-2 rounded-r-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Додати
          </button>
        </div>
      </div>
    </div>
  );
};