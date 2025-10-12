import React from 'react';

interface AccountSettingsSectionProps {
  settings: any;
  setSettings: (settings: any) => void;
}

export const AccountSettingsSection: React.FC<AccountSettingsSectionProps> = ({
  settings,
  setSettings,
}) => {
  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-semibold mb-4">Налаштування облікового запису</h2>

      {/* Email */}
      <div className="mb-4">
        <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email *</label>
        <input
          type="email"
          id="email"
          name="email"
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          value={settings.email}
          onChange={e => setSettings({ ...settings, email: e.target.value })}
          required
        />
      </div>
    </div>
  );
};