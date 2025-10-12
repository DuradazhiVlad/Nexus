import React from 'react';
import { Bell } from 'lucide-react';

interface NotificationSettingsSectionProps {
  settings: any;
  updateNestedField: (section: string, field: string, value: any) => void;
}

export const NotificationSettingsSection: React.FC<NotificationSettingsSectionProps> = ({
  settings,
  updateNestedField,
}) => {
  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-semibold mb-4 flex items-center">
        <Bell className="w-6 h-6 mr-2 text-gray-700" />
        Налаштування сповіщень
      </h2>

      {/* Email Notifications */}
      <div className="flex items-center justify-between mb-4">
        <label htmlFor="email-notifications" className="text-sm font-medium text-gray-700 cursor-pointer">
          Сповіщення електронною поштою
        </label>
        <div className="relative inline-block w-10 mr-2 align-middle select-none transition duration-200 ease-in">
          <input
            type="checkbox"
            name="email-notifications"
            id="email-notifications"
            className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer"
            checked={settings.notifications.email}
            onChange={(e) => updateNestedField('notifications', 'email', e.target.checked)}
          />
          <label
            htmlFor="email-notifications"
            className={`toggle-label block overflow-hidden h-6 rounded-full cursor-pointer ${settings.notifications.email ? 'bg-blue-500' : 'bg-gray-300'}`}
          >
            <span className={`toggle-dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform duration-300 ease-in-out ${settings.notifications.email ? 'transform translate-x-6' : ''}`}></span>
          </label>
        </div>
      </div>

      {/* Message Notifications */}
      <div className="flex items-center justify-between mb-4">
        <label htmlFor="message-notifications" className="text-sm font-medium text-gray-700 cursor-pointer">
          Сповіщення про повідомлення
        </label>
        <div className="relative inline-block w-10 mr-2 align-middle select-none transition duration-200 ease-in">
          <input
            type="checkbox"
            name="message-notifications"
            id="message-notifications"
            className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer"
            checked={settings.notifications.messages}
            onChange={(e) => updateNestedField('notifications', 'messages', e.target.checked)}
          />
          <label
            htmlFor="message-notifications"
            className={`toggle-label block overflow-hidden h-6 rounded-full cursor-pointer ${settings.notifications.messages ? 'bg-blue-500' : 'bg-gray-300'}`}
          >
            <span className={`toggle-dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform duration-300 ease-in-out ${settings.notifications.messages ? 'transform translate-x-6' : ''}`}></span>
          </label>
        </div>
      </div>

      {/* Friend Request Notifications */}
      <div className="flex items-center justify-between mb-4">
        <label htmlFor="friend-request-notifications" className="text-sm font-medium text-gray-700 cursor-pointer">
          Сповіщення про запити на додавання в друзі
        </label>
        <div className="relative inline-block w-10 mr-2 align-middle select-none transition duration-200 ease-in">
          <input
            type="checkbox"
            name="friend-request-notifications"
            id="friend-request-notifications"
            className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer"
            checked={settings.notifications.friendRequests}
            onChange={(e) => updateNestedField('notifications', 'friendRequests', e.target.checked)}
          />
          <label
            htmlFor="friend-request-notifications"
            className={`toggle-label block overflow-hidden h-6 rounded-full cursor-pointer ${settings.notifications.friendRequests ? 'bg-blue-500' : 'bg-gray-300'}`}
          >
            <span className={`toggle-dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform duration-300 ease-in-out ${settings.notifications.friendRequests ? 'transform translate-x-6' : ''}`}></span>
          </label>
        </div>
      </div>
    </div>
  );
};