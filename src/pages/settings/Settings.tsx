// src/pages/settings/Settings.tsx
import React, { useState } from 'react';
import ProfileSettingsTab from './ProfileSettingsTab';
import PrivacySettingsTab from './PrivacySettingsTab';
import NotificationsSettingsTab from './NotificationsSettingsTab';
import { Sidebar } from '../../components/Sidebar';
import { User, Bell, Lock } from 'lucide-react';
import { SettingsProvider, useSettings } from '../../lib/hooks/SettingsContext';
import { useAuth } from '../../lib/hooks/useAuth';

// Додаємо CSS стилі для перемикачів
const toggleStyles = `
  .toggle-label {
    width: 48px;
    height: 24px;
  }
  .toggle-dot {
    transition: transform 0.3s ease-in-out;
  }
`;

const SettingsContent: React.FC = () => {
  useAuth(); // Хук залишається для перевірки автентифікації
  const [activeTab, setActiveTab] = useState('profile');
  const { loading } = useSettings();

  const tabs = [
    { id: 'profile', label: 'Профіль', icon: User },
    { id: 'privacy', label: 'Приватність', icon: Lock },
    { id: 'notifications', label: 'Сповіщення', icon: Bell },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'profile':
        return <ProfileSettingsTab />;
      case 'privacy':
        return <PrivacySettingsTab />;
      case 'notifications':
        return <NotificationsSettingsTab />;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="flex-1 lg:ml-64 p-8">
          <div className="text-center">Завантаження...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <style>{toggleStyles}</style>
      <Sidebar />
      <div className="flex-1 lg:ml-64 p-8">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Налаштування</h1>
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="flex border-b border-gray-200">
              {tabs.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  className={`flex items-center px-6 py-3 text-sm font-medium ${
                    activeTab === id
                      ? 'text-blue-600 border-b-2 border-blue-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Icon size={18} className="mr-2" />
                  {label}
                </button>
              ))}
            </div>
            <div className="p-6">
              {renderTabContent()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Іменований експорт компонента Settings
export const Settings: React.FC = () => (
  <SettingsProvider>
    <SettingsContent />
  </SettingsProvider>
);
