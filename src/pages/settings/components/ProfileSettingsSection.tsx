import React from 'react';

interface ProfileSettingsSectionProps {
  settings: any;
  updateNestedField: (section: string, field: string, value: any) => void;
  addHobby: () => void;
  removeHobby: (index: number) => void;
  newHobby: string;
  setNewHobby: (value: string) => void;
  addLanguage: () => void;
  removeLanguage: (index: number) => void;
  newLanguage: string;
  setNewLanguage: (value: string) => void;
}

const GENDER_OPTIONS = [
  { value: 'male', label: 'Чоловіча' },
  { value: 'female', label: 'Жіноча' },
  { value: 'other', label: 'Інша' },
];

const EDUCATION_OPTIONS = [
  { value: 'none', label: 'Немає' },
  { value: 'secondary', label: 'Середня' },
  { value: 'vocational', label: 'Професійно-технічна' },
  { value: 'incomplete_higher', label: 'Неповна вища' },
  { value: 'higher', label: 'Вища' },
  { value: 'two_or_more_higher', label: 'Дві та більше вищих' },
  { value: 'phd', label: 'Кандидат наук / Доктор філософії' },
];

const RELATIONSHIP_OPTIONS = [
  { value: 'single', label: 'Неодружений/Незаміжня' },
  { value: 'in_relationship', label: 'У стосунках' },
  { value: 'engaged', label: 'Заручений/Заручена' },
  { value: 'married', label: 'Одружений/Заміжня' },
  { value: 'complicated', label: 'Все складно' },
  { value: 'active_search', label: 'В активному пошуку' },
];

const LANGUAGE_OPTIONS = [
  { value: 'ukrainian', label: 'Українська' },
  { value: 'english', label: 'Англійська' },
  { value: 'russian', label: 'Російська' },
  { value: 'polish', label: 'Польська' },
  { value: 'german', label: 'Німецька' },
  { value: 'french', label: 'Французька' },
  { value: 'spanish', label: 'Іспанська' },
];

export const ProfileSettingsSection: React.FC<ProfileSettingsSectionProps> = ({
  settings,
  updateNestedField,
  addHobby,
  removeHobby,
  newHobby,
  setNewHobby,
  addLanguage,
  removeLanguage,
  newLanguage,
  setNewLanguage,
}) => {
  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-semibold mb-4">Налаштування профілю</h2>

      {/* Gender */}
      <div className="mb-4">
        <label htmlFor="gender" className="block text-sm font-medium text-gray-700">Стать</label>
        <select
          id="gender"
          name="gender"
          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
          value={settings.profile_settings?.gender || ''}
          onChange={(e) => updateNestedField('profile_settings', 'gender', e.target.value)}
        >
          <option value="">Оберіть стать</option>
          {GENDER_OPTIONS.map(option => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
      </div>

      {/* Education */}
      <div className="mb-4">
        <label htmlFor="education" className="block text-sm font-medium text-gray-700">Освіта</label>
        <select
          id="education"
          name="education"
          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
          value={settings.profile_settings?.education || ''}
          onChange={(e) => updateNestedField('profile_settings', 'education', e.target.value)}
        >
          <option value="">Оберіть освіту</option>
          {EDUCATION_OPTIONS.map(option => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
      </div>

      {/* Relationship Status */}
      <div className="mb-4">
        <label htmlFor="relationship_status" className="block text-sm font-medium text-gray-700">Сімейний стан</label>
        <select
          id="relationship_status"
          name="relationship_status"
          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
          value={settings.profile_settings?.relationship_status || ''}
          onChange={(e) => updateNestedField('profile_settings', 'relationship_status', e.target.value)}
        >
          <option value="">Оберіть сімейний стан</option>
          {RELATIONSHIP_OPTIONS.map(option => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
      </div>

      {/* Hobbies */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700">Хобі</label>
        <div className="mt-1 flex flex-wrap gap-2">
          {settings.profile_settings?.hobbies?.map((hobby: string, index: number) => (
            <span key={index} className="inline-flex items-center px-3 py-0.5 rounded-full text-sm font-medium bg-indigo-100 text-indigo-800">
              {hobby}
              <button
                type="button"
                onClick={() => removeHobby(index)}
                className="flex-shrink-0 ml-1 h-4 w-4 rounded-full inline-flex items-center justify-center text-indigo-400 hover:bg-indigo-200 hover:text-indigo-500 focus:outline-none focus:bg-indigo-200 focus:text-indigo-500"
              >
                <span className="sr-only">Видалити хобі</span>
                <svg className="h-2 w-2" stroke="currentColor" fill="none" viewBox="0 0 8 8">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M1 1l6 6m0-6L1 7" />
                </svg>
              </button>
            </span>
          ))}
        </div>
        <div className="mt-2 flex">
          <input
            type="text"
            className="flex-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            value={newHobby}
            onChange={(e) => setNewHobby(e.target.value)}
            placeholder="Додати нове хобі"
          />
          <button
            type="button"
            onClick={addHobby}
            className="ml-3 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Додати
          </button>
        </div>
      </div>

      {/* Languages */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700">Мови</label>
        <div className="mt-1 flex flex-wrap gap-2">
          {settings.profile_settings?.languages?.map((lang: string, index: number) => (
            <span key={index} className="inline-flex items-center px-3 py-0.5 rounded-full text-sm font-medium bg-indigo-100 text-indigo-800">
              {lang}
              <button
                type="button"
                onClick={() => removeLanguage(index)}
                className="flex-shrink-0 ml-1 h-4 w-4 rounded-full inline-flex items-center justify-center text-indigo-400 hover:bg-indigo-200 hover:text-indigo-500 focus:outline-none focus:bg-indigo-200 focus:text-indigo-500"
              >
                <span className="sr-only">Видалити мову</span>
                <svg className="h-2 w-2" stroke="currentColor" fill="none" viewBox="0 0 8 8">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M1 1l6 6m0-6L1 7" />
                </svg>
              </button>
            </span>
          ))}
        </div>
        <div className="mt-2 flex">
          <input
            type="text"
            className="flex-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            value={newLanguage}
            onChange={(e) => setNewLanguage(e.target.value)}
            placeholder="Додати нову мову"
          />
          <button
            type="button"
            onClick={addLanguage}
            className="ml-3 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Додати
          </button>
        </div>
      </div>
    </div>
  );
};