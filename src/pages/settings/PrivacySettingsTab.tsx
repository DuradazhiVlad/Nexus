import React from 'react';
import { useSettings } from '../../lib/hooks/SettingsContext';

const PrivacySettingsTab: React.FC = () => {
  const { user, saveSettings, saveStatus, saveMessage, updateNestedField } = useSettings();

  if (!user) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium leading-6 text-gray-900">Налаштування приватності</h3>
        <p className="mt-1 text-sm text-gray-500">Керуйте тим, хто може бачити вашу інформацію.</p>
      </div>

      <div className="space-y-6 bg-white p-6 rounded-lg shadow-sm border border-gray-100">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">Видимість профілю</label>
          <div className="grid grid-cols-3 gap-3">
            <div
              className={`flex flex-col items-center p-4 rounded-lg cursor-pointer border ${user.user_metadata?.privacy?.profileVisibility === 'public' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'}`}
              onClick={() => {
                if (saveStatus !== 'saving') {
                  updateNestedField('privacy.profileVisibility', 'public');
                }
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className={`h-8 w-8 ${user.user_metadata?.privacy?.profileVisibility === 'public' ? 'text-blue-500' : 'text-gray-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className={`mt-2 text-sm font-medium ${user.user_metadata?.privacy?.profileVisibility === 'public' ? 'text-blue-700' : 'text-gray-700'}`}>Публічний</span>
              <span className="text-xs text-gray-500 mt-1 text-center">Доступний всім</span>
            </div>
            <div
              className={`flex flex-col items-center p-4 rounded-lg cursor-pointer border ${user.user_metadata?.privacy?.profileVisibility === 'friends' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'}`}
              onClick={() => {
                if (saveStatus !== 'saving') {
                  updateNestedField('privacy.profileVisibility', 'friends');
                }
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className={`h-8 w-8 ${user.user_metadata?.privacy?.profileVisibility === 'friends' ? 'text-blue-500' : 'text-gray-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              <span className={`mt-2 text-sm font-medium ${user.user_metadata?.privacy?.profileVisibility === 'friends' ? 'text-blue-700' : 'text-gray-700'}`}>Тільки друзі</span>
              <span className="text-xs text-gray-500 mt-1 text-center">Тільки для друзів</span>
            </div>
            <div
              className={`flex flex-col items-center p-4 rounded-lg cursor-pointer border ${user.user_metadata?.privacy?.profileVisibility === 'private' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'}`}
              onClick={() => {
                if (saveStatus !== 'saving') {
                  updateNestedField('privacy.profileVisibility', 'private');
                }
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className={`h-8 w-8 ${user.user_metadata?.privacy?.profileVisibility === 'private' ? 'text-blue-500' : 'text-gray-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <span className={`mt-2 text-sm font-medium ${user.user_metadata?.privacy?.profileVisibility === 'private' ? 'text-blue-700' : 'text-gray-700'}`}>Приватний</span>
              <span className="text-xs text-gray-500 mt-1 text-center">Тільки для вас</span>
            </div>
          </div>
        </div>

        <div className="space-y-4 pt-4 border-t border-gray-100">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Додаткові налаштування приватності</h4>
          
          <div className="flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:bg-gray-50">
            <div>
              <label htmlFor="show-birth-date" className="text-sm font-medium text-gray-700 cursor-pointer">
                Показувати дату народження
              </label>
              <p className="text-xs text-gray-500">Дозволити іншим користувачам бачити вашу дату народження</p>
            </div>
            <div className="relative inline-block w-12 mr-2 align-middle select-none">
              <input
                type="checkbox"
                id="show-birth-date"
                checked={user.user_metadata?.privacy?.showBirthDate || false}
                onChange={e => updateNestedField('privacy.showBirthDate', e.target.checked)}
                disabled={saveStatus === 'saving'}
                className="sr-only"
              />
              <label
                htmlFor="show-birth-date"
                className={`toggle-label block overflow-hidden h-6 rounded-full cursor-pointer ${user.user_metadata?.privacy?.showBirthDate ? 'bg-blue-500' : 'bg-gray-300'}`}
              >
                <span className={`toggle-dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform duration-300 ease-in-out ${user.user_metadata?.privacy?.showBirthDate ? 'transform translate-x-6' : ''}`}></span>
              </label>
            </div>
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:bg-gray-50">
            <div>
              <label htmlFor="show-email" className="text-sm font-medium text-gray-700 cursor-pointer">
                Показувати електронну пошту
              </label>
              <p className="text-xs text-gray-500">Дозволити іншим користувачам бачити вашу електронну пошту</p>
            </div>
            <div className="relative inline-block w-12 mr-2 align-middle select-none">
              <input
                type="checkbox"
                id="show-email"
                checked={user.user_metadata?.privacy?.showEmail || false}
                onChange={e => updateNestedField('privacy.showEmail', e.target.checked)}
                disabled={saveStatus === 'saving'}
                className="sr-only"
              />
              <label
                htmlFor="show-email"
                className={`toggle-label block overflow-hidden h-6 rounded-full cursor-pointer ${user.user_metadata?.privacy?.showEmail ? 'bg-blue-500' : 'bg-gray-300'}`}
              >
                <span className={`toggle-dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform duration-300 ease-in-out ${user.user_metadata?.privacy?.showEmail ? 'transform translate-x-6' : ''}`}></span>
              </label>
            </div>
          </div>
        </div>
      </div>

      {saveStatus !== 'idle' && (
        <div className={`mb-4 p-4 rounded-md ${
          saveStatus === 'success' ? 'bg-green-50 border border-green-200' :
          saveStatus === 'error' ? 'bg-red-50 border border-red-200' :
          'bg-blue-50 border border-blue-200'
        }`}>
          <div className="flex items-center">
            {saveStatus === 'saving' && (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
            )}
            {saveStatus === 'success' && (
              <svg className="h-4 w-4 text-green-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            )}
            {saveStatus === 'error' && (
              <svg className="h-4 w-4 text-red-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            )}
            <span className={`text-sm font-medium ${
              saveStatus === 'success' ? 'text-green-800' :
              saveStatus === 'error' ? 'text-red-800' :
              'text-blue-800'
            }`}>
              {saveStatus === 'saving' ? 'Збереження...' : saveMessage}
            </span>
          </div>
        </div>
      )}

      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => saveSettings({ privacy: user.user_metadata?.privacy })}
          disabled={saveStatus === 'saving'}
          className={`inline-flex justify-center rounded-md border border-transparent px-4 py-2 text-sm font-medium text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
            saveStatus === 'saving'
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {saveStatus === 'saving' ? 'Збереження...' : 'Зберегти'}
        </button>
      </div>
    </div>
  );
};

export default PrivacySettingsTab;