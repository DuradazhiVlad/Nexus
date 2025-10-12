import React from "react";
import { useProfileEdit } from "../../context/ProfileEditContext";
import { Users, ArrowRight } from "lucide-react";

export const FriendsSection: React.FC = () => {
  const { profile } = useProfileEdit();
  if (!profile) return null;

  const friends = profile.friends || [];
  const friendsCount = friends.length;

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold flex items-center text-gray-800">
          <Users className="w-5 h-5 mr-2 text-blue-500" /> Друзі
        </h3>
        <button className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center transition-colors">
          Всі друзі <ArrowRight className="w-4 h-4 ml-1" />
        </button>
      </div>
      {friendsCount === 0 ? (
        <p className="text-base text-gray-500 text-center py-4">Немає друзів</p>
      ) : (
        <div className="text-center">
          <p className="text-2xl font-bold text-gray-800">{friendsCount}</p>
          <p className="text-sm text-gray-500">друзів</p>
        </div>
      )}
    </div>
  );
};
