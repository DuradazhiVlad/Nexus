import React from 'react';
import { useSettings } from '../../lib/hooks/SettingsContext';

const NotificationsSettingsTab: React.FC = () => {
  const { user, saveSettings, saveStatus, saveMessage, updateNestedField } = useSettings();

  if (!user) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium leading-6 text-gray-900">Налаштування сповіщень</h3>
        <p className="mt-1 text-sm text-gray-500">Вирішіть, які сповіщення ви хочете отримувати.</p>
      </div>

      <div className="space-y-4 bg-white p-6 rounded-lg shadow-sm border border-gray-100">
        <div className="flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:bg-gray-50">
          <div>
            <label htmlFor="email-notifications" className="text-sm font-medium text-gray-700 cursor-pointer">
              Сповіщення електронною поштою
            </label>
            <p className="text-xs text-gray-500">Отримувати сповіщення на вашу електронну пошту</p>
          </div>
          <div className="relative inline-block w-12 mr-2 align-middle select-none">
            <input
              type="checkbox"
              id="email-notifications"
              checked={user.user_metadata?.notifications?.email || false}
              onChange={e => updateNestedField('notifications.email', e.target.checked)}
              disabled={saveStatus === 'saving'}
              className="sr-only"
            />
            <label
              htmlFor="email-notifications"
              className={`toggle-label block overflow-hidden h-6 rounded-full cursor-pointer ${user.user_metadata?.notifications?.email ? 'bg-blue-500' : 'bg-gray-300'}`}
            >
              <span className={`toggle-dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform duration-300 ease-in-out ${user.user_metadata?.notifications?.email ? 'transform translate-x-6' : ''}`}></span>
            </label>
          </div>
        </div>

        <div className="flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:bg-gray-50">
          <div>
            <label htmlFor="message-notifications" className="text-sm font-medium text-gray-700 cursor-pointer">
              Сповіщення про повідомлення
            </label>
            <p className="text-xs text-gray-500">Отримувати сповіщення, коли ви отримуєте нові повідомлення.</p>
          </div>
          <div className="relative inline-block w-12 mr-2 align-middle select-none">
            <input
              type="checkbox"
              id="message-notifications"
              checked={user.user_metadata?.notifications?.messages || false}
              onChange={e => updateNestedField('notifications.messages', e.target.checked)}
              disabled={saveStatus === 'saving'}
              className="sr-only"
            />
            <label
              htmlFor="message-notifications"
              className={`toggle-label block overflow-hidden h-6 rounded-full cursor-pointer ${user.user_metadata?.notifications?.messages ? 'bg-blue-500' : 'bg-gray-300'}`}
            >
              <span className={`toggle-dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform duration-300 ease-in-out ${user.user_metadata?.notifications?.messages ? 'transform translate-x-6' : ''}`}></span>
            </label>
          </div>
        </div>

        <div className="flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:bg-gray-50">
          <div>
            <label htmlFor="friend-request-notifications" className="text-sm font-medium text-gray-700 cursor-pointer">
              Сповіщення про запити в друзі
            </label>
            <p className="text-xs text-gray-500">Отримувати сповіщення, коли хтось надсилає вам запит у друзі.</p>
          </div>
          <div className="relative inline-block w-12 mr-2 align-middle select-none">
            <input
              type="checkbox"
              id="friend-request-notifications"
              checked={user.user_metadata?.notifications?.friendRequests || false}
              onChange={e => updateNestedField('notifications.friendRequests', e.target.checked)}
              disabled={saveStatus === 'saving'}
              className="sr-only"
            />
            <label
              htmlFor="friend-request-notifications"
              className={`toggle-label block overflow-hidden h-6 rounded-full cursor-pointer ${user.user_metadata?.notifications?.friendRequests ? 'bg-blue-500' : 'bg-gray-300'}`}
            >
              <span className={`toggle-dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform duration-300 ease-in-out ${user.user_metadata?.notifications?.friendRequests ? 'transform translate-x-6' : ''}`}></span>
            </label>
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
          onClick={() => saveSettings({ notifications: user.user_metadata?.notifications })}
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

export default NotificationsSettingsTab;