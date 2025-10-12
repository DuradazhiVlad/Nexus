import React from "react";

interface Friend {
  id: string;
  name: string;
  last_name?: string;
  avatar?: string;
}

interface SuggestedFriendsProps {
  suggestedFriends: Friend[];
}

export const SuggestedFriends: React.FC<SuggestedFriendsProps> = ({ suggestedFriends }) => {
  if (!suggestedFriends || suggestedFriends.length === 0) return null;

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h3 className="text-lg font-semibold mb-3">Можливі знайомі</h3>
      <div className="flex space-x-4 overflow-x-auto py-2">
        {suggestedFriends.map((f) => (
          <div
            key={f.id}
            className="flex-shrink-0 w-40 bg-gray-50 rounded-lg cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => window.location.href = `/profile/${f.id}`}
          >
            <img
              src={f.avatar || "/default-avatar.png"}
              className="w-full h-24 object-cover rounded-t-lg"
              alt={f.name}
            />
            <div className="p-2 text-center">
              <p className="font-semibold text-gray-800 truncate">{f.name} {f.last_name}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
