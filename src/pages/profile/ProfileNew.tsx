// src/pages/profile/ProfileNew.tsx
import React from 'react';
import { LeftColumn } from './components/LeftColumn/LeftColumn';
import { RightColumn } from './components/RightColumn';
import { ProfileEditProvider } from './context/ProfileEditContext';
import { Sidebar } from '../../components/Sidebar';
// =====================
// React-компонент
// =====================
export const ProfileNew: React.FC = () => {
  return (
    <ProfileEditProvider>
      <div className="lg:ml-64">
        <Sidebar />
        <div className="max-w-6xl mx-auto p-4 grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <LeftColumn />
          </div>
          <div className="lg:col-span-2">
            <RightColumn />
          </div>
        </div>
      </div>
    </ProfileEditProvider>
  );
};
