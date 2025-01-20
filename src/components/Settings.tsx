// Settings
import React, { useState } from 'react';

type SettingsType = {
  notifications: boolean;
  darkMode: boolean;
  language: string;
  currency: string;
};

const Settings = () => {
  const [settings, setSettings] = useState<SettingsType>({
    notifications: true,
    darkMode: false,
    language: 'en',
    currency: 'USD'
  });

  const handleToggle = (setting: keyof Pick<SettingsType, 'notifications' | 'darkMode'>) => {
    setSettings(prevSettings => ({
      ...prevSettings,
      [setting]: !prevSettings[setting]
    }));
  };

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setSettings(prevSettings => ({
      ...prevSettings,
      [name]: value
    }));
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-xl font-semibold mb-4">Settings</h3>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span>Notifications</span>
          <button
            onClick={() => handleToggle('notifications')}
            className={`w-12 h-6 rounded-full p-1 ${settings.notifications ? 'bg-blue-500' : 'bg-gray-300'}`}
          >
            <div className={`w-4 h-4 rounded-full bg-white transform duration-300 ease-in-out ${settings.notifications ? 'translate-x-6' : ''}`}></div>
          </button>
        </div>
        <div className="flex items-center justify-between">
          <span>Dark Mode</span>
          <button
            onClick={() => handleToggle('darkMode')}
            className={`w-12 h-6 rounded-full p-1 ${settings.darkMode ? 'bg-blue-500' : 'bg-gray-300'}`}
          >
            <div className={`w-4 h-4 rounded-full bg-white transform duration-300 ease-in-out ${settings.darkMode ? 'translate-x-6' : ''}`}></div>
          </button>
        </div>
        <div>
          <label htmlFor="language" className="block mb-1">Language</label>
          <select
            id="language"
            name="language"
            value={settings.language}
            onChange={handleChange}
            className="w-full p-2 border rounded"
          >
            <option value="en">English</option>
            <option value="es">Español</option>
            <option value="fr">Français</option>
          </select>
        </div>
        <div>
          <label htmlFor="currency" className="block mb-1">Currency</label>
          <select
            id="currency"
            name="currency"
            value={settings.currency}
            onChange={handleChange}
            className="w-full p-2 border rounded"
          >
            <option value="USD">USD</option>
            <option value="EUR">EUR</option>
            <option value="GBP">GBP</option>
          </select>
        </div>
      </div>
    </div>
  );
};

export default Settings;