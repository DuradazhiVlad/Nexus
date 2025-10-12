import React from "react";
import { useProfileEdit } from "../../context/ProfileEditContext";
import { StickyNote, Settings } from "lucide-react";

export const AvatarSection: React.FC = () => {
  const { profile, currentUser } = useProfileEdit();
  if (!profile) return null;
  const isOwner = currentUser?.id === profile.auth_user_id;

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 flex flex-col items-center border border-gray-100">
      <div className="w-full h-80 overflow-hidden rounded-xl mb-4">
        <img
          src={profile.avatar || "/default-avatar.png"}
          alt="Аватар"
          className="w-full h-full object-cover"
        />
      </div>
      {isOwner && (
        <div className="w-full flex flex-col space-y-3">
          <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center">
            <StickyNote className="w-5 h-5 mr-2" /> Нотатки
          </button>
          <button className="w-full bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center">
            <Settings className="w-5 h-5 mr-2" /> Налаштування
          </button>
        </div>
      )}
    </div>
  );
};
