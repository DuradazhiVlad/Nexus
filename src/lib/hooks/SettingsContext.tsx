import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { AuthUserProfile } from '../../authUserService';
import { UserSettings } from '../../types/userSettings';
import { supabase } from '../supabase';

interface SettingsContextType {
  settings: UserSettings | null;
  loading: boolean;
  saveStatus: 'idle' | 'saving' | 'success' | 'error';
  saveMessage: string;
  updateNestedField: (path: string, value: any) => void;
  handleSave: () => Promise<void>;
  addHobby: () => void;
  removeHobby: (index: number) => void;
  newHobby: string;
  setNewHobby: (hobby: string) => void;
  addLanguage: () => void;
  removeLanguage: (index: number) => void;
  newLanguage: string;
  setNewLanguage: (language: string) => void;
  GENDER_OPTIONS: { value: string; label: string }[];
  EDUCATION_OPTIONS: { value: string; label: string }[];
  RELATIONSHIP_STATUS_OPTIONS: { value: string; label: string }[];
  LANGUAGE_OPTIONS: { value: string; label: string }[];
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

interface SettingsProviderProps {
  children: React.ReactNode;
  initialUser: AuthUserProfile | null;
}

export const SettingsProvider: React.FC<SettingsProviderProps> = ({ children, initialUser }) => {
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const [saveMessage, setSaveMessage] = useState('');
  const [newHobby, setNewHobby] = useState('');
  const [newLanguage, setNewLanguage] = useState('');

  const GENDER_OPTIONS = [
    { value: 'male', label: 'Чоловік' },
    { value: 'female', label: 'Жінка' },
    { value: 'other', label: 'Інше' },
  ];

  const EDUCATION_OPTIONS = [
    { value: 'none', label: 'Немає' },
    { value: 'high_school', label: 'Середня' },
    { value: 'bachelor', label: 'Бакалавр' },
    { value: 'master', label: 'Магістр' },
    { value: 'phd', label: 'Доктор наук' },
  ];

  const RELATIONSHIP_STATUS_OPTIONS = [
    { value: 'single', label: 'Неодружений/Незаміжня' },
    { value: 'in_relationship', label: 'У стосунках' },
    { value: 'married', label: 'Одружений/Заміжня' },
    { value: 'complicated', label: 'Все складно' },
  ];

  const LANGUAGE_OPTIONS = [
    { value: 'ukrainian', label: 'Українська' },
    { value: 'english', label: 'Англійська' },
    { value: 'russian', label: 'Російська' },
    { value: 'polish', label: 'Польська' },
  ];

  const fetchSettings = useCallback(async () => {
    if (!initialUser?.id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', initialUser.id)
      .single();

    if (error) {
      console.error('Error fetching user settings:', error);
      setSettings(null);
    } else {
      setSettings(data as UserSettings);
    }
    setLoading(false);
  }, [initialUser]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  useEffect(() => {
    if (saveStatus === 'success' || saveStatus === 'error') {
      const timer = setTimeout(() => {
        setSaveStatus('idle');
        setSaveMessage('');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [saveStatus]);

  const updateNestedField = useCallback((path: string, value: any) => {
    setSettings(prevSettings => {
      if (!prevSettings) return null;

      const newSettings = { ...prevSettings };
      let current: any = newSettings;
      const pathParts = path.split('.');

      for (let i = 0; i < pathParts.length - 1; i++) {
        const part = pathParts[i];
        if (!current[part]) {
          current[part] = {};
        }
        current = current[part];
      }
      current[pathParts[pathParts.length - 1]] = value;
      return newSettings;
    });
  }, []);

  const handleSave = useCallback(async () => {
    if (!initialUser?.id || !settings) return;

    setSaveStatus('saving');
    setSaveMessage('Збереження...');

    const { id, ...updates } = settings;

    const { error } = await supabase
      .from('user_profiles')
      .update(updates)
      .eq('id', initialUser.id);

    if (error) {
      console.error('Error saving settings:', error);
      setSaveStatus('error');
      setSaveMessage('Помилка збереження!');
    } else {
      setSaveStatus('success');
      setSaveMessage('Налаштування успішно збережено!');
    }
  }, [initialUser, settings]);

  const addHobby = useCallback(() => {
    if (newHobby.trim() !== '' && settings) {
      updateNestedField('personal_info.hobbies', [...(settings.personal_info?.hobbies || []), newHobby.trim()]);
      setNewHobby('');
    }
  }, [newHobby, settings, updateNestedField]);

  const removeHobby = useCallback((index: number) => {
    if (settings?.personal_info?.hobbies) {
      const updatedHobbies = settings.personal_info.hobbies.filter((_, i) => i !== index);
      updateNestedField('personal_info.hobbies', updatedHobbies);
    }
  }, [settings, updateNestedField]);

  const addLanguage = useCallback(() => {
    if (newLanguage.trim() !== '' && settings) {
      updateNestedField('personal_info.languages', [...(settings.personal_info?.languages || []), newLanguage.trim()]);
      setNewLanguage('');
    }
  }, [newLanguage, settings, updateNestedField]);

  const removeLanguage = useCallback((index: number) => {
    if (settings?.personal_info?.languages) {
      const updatedLanguages = settings.personal_info.languages.filter((_, i) => i !== index);
      updateNestedField('personal_info.languages', updatedLanguages);
    }
  }, [settings, updateNestedField]);

  const contextValue = {
    settings,
    loading,
    saveStatus,
    saveMessage,
    updateNestedField,
    handleSave,
    addHobby,
    removeHobby,
    newHobby,
    setNewHobby,
    addLanguage,
    removeLanguage,
    newLanguage,
    setNewLanguage,
    GENDER_OPTIONS,
    EDUCATION_OPTIONS,
    RELATIONSHIP_STATUS_OPTIONS,
    LANGUAGE_OPTIONS,
  };

  return (
    <SettingsContext.Provider value={contextValue}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};