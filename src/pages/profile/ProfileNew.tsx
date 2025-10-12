// src/pages/profile/ProfileNew.tsx
import React from "react";
import { LeftColumn } from "./components/LeftColumn/LeftColumn";
import { RightColumn } from "./components/RightColumn";
import { ProfileEditProvider } from "./context/ProfileEditContext";

export const ProfileNew: React.FC = () => {
  return (
    <ProfileEditProvider>
      <div className="bg-gray-100 min-h-screen py-6">
        <div className="container mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Ліва колонка */}
          <div className="lg:col-span-1 space-y-6">
            <LeftColumn />
          </div>

          {/* Права колонка */}
          <div className="lg:col-span-2 space-y-6">
            <RightColumn />
          </div>
        </div>
      </div>
    </ProfileEditProvider>
  );
};
