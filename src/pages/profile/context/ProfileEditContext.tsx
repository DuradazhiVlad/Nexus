import React, { createContext, useContext } from 'react';
// Припускаємо, що useProfile знаходиться у src/pages/profile/hooks/useProfile
import { useProfile } from '../hooks/useProfile';
// Припускаємо, що EditFormData знаходиться у src/pages/profile/types
import { EditFormData } from '../types'; 

interface ProfileEditContextType {
  profile: any; // Зверніть увагу: краще використовувати UserProfile або інший явний тип
  loading: boolean;
  error: string | null;
  success: string | null;
  isEditing: boolean;
  saving: boolean;
  currentUser: any; // Зверніть увагу: краще використовувати UserProfile або інший явний тип
  editForm: EditFormData;
  setEditForm: React.Dispatch<React.SetStateAction<EditFormData>>;
  setError: React.Dispatch<React.SetStateAction<string | null>>;
  setSuccess: React.Dispatch<React.SetStateAction<string | null>>;
  setIsEditing: React.Dispatch<React.SetStateAction<boolean>>;
  saveProfile: () => Promise<void>;
  handleAvatarChange: (avatarUrl: string) => void;
  addHobby: () => void;
  removeHobby: (hobby: string) => void;
  addLanguage: () => void;
  removeLanguage: (language: string) => void;
  updateEditForm: (field: keyof EditFormData, value: any) => void;
  updateNestedField: (parentField: keyof EditFormData, childField: string, value: any) => void;
  cancelEdit: () => void;
  loadProfile: () => Promise<void>;
  refreshProfile: () => void;
}

const ProfileEditContext = createContext<ProfileEditContextType | undefined>(undefined);

export const ProfileEditProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Використовуємо хук для отримання всієї логіки та стану
  const profileHook = useProfile();

  // Показуємо завантаження на рівні провайдера, якщо хук завантажується
  if (profileHook.loading) {
     return (
        <div className="flex items-center justify-center min-h-screen">
            <svg className="animate-spin h-8 w-8 text-blue-500" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="ml-3 text-gray-600">Завантаження профілю...</p>
        </div>
    );
  }

  return (
    <ProfileEditContext.Provider value={profileHook}>
      {children}
    </ProfileEditContext.Provider>
  );
};

export const useProfileEdit = () => {
  const context = useContext(ProfileEditContext);
  if (!context) throw new Error('useProfileEdit must be used within a ProfileEditProvider');
  return context;
};
