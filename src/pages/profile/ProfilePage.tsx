import React, { useState } from "react";
import { LeftColumn } from "./components/LeftColumn/LeftColumn";
import { useProfileEdit } from "./context/ProfileEditContext";
import { Users, Image, Video, Music2 } from "lucide-react";

// Компонент посту з анімацією тексту по буквах
const Post: React.FC<{ text: string }> = ({ text }) => {
  const [displayed, setDisplayed] = useState("");
  React.useEffect(() => {
    let index = 0;
    const interval = setInterval(() => {
      setDisplayed(text.slice(0, index + 1));
      index++;
      if (index >= text.length) clearInterval(interval);
    }, 20); // швидкість по буквах
    return () => clearInterval(interval);
  }, [text]);
  return <p className="text-gray-800">{displayed}</p>;
};

export const ProfilePage: React.FC = () => {
  const { profile, currentUser } = useProfileEdit();
  const [posts, setPosts] = useState<string[]>([]);
  const [newPost, setNewPost] = useState("");

  if (!profile) return null;

  const isOwner = currentUser?.id === profile.auth_user_id;

  const handleAddPost = () => {
    if (newPost.trim() === "") return;
    setPosts([newPost, ...posts]);
    setNewPost("");
  };

  return (
    <div className="flex flex-col md:flex-row space-y-6 md:space-y-0 md:space-x-6 p-4 bg-gray-50 min-h-screen">
      {/* Ліва колонка */}
      <div className="md:w-1/3 flex-shrink-0">
        <LeftColumn />
      </div>

      {/* Права колонка */}
      <div className="md:w-2/3 flex flex-col space-y-6">
        {/* Інформація про користувача */}
        <div className="bg-white rounded-lg shadow p-6 space-y-2">
          <h2 className="text-2xl font-bold">{profile.name} {profile.last_name}</h2>
          {profile.city && <p className="text-gray-600">Місто: {profile.city}</p>}
          {profile.online_status && (
            <p className={`text-sm font-medium ${profile.online_status === "online" ? "text-green-500" : "text-gray-400"}`}>
              {profile.online_status === "online" ? "Онлайн" : "Не в мережі"}
            </p>
          )}
          {profile.bio && <p className="text-gray-700">{profile.bio}</p>}
        </div>

        {/* Можливі знайомі */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-3">Можливі знайомі</h3>
          <div className="grid grid-cols-3 gap-3">
            {(profile.suggestedFriends || []).slice(0, 6).map((f: any) => (
              <div key={f.id} className="text-center cursor-pointer hover:scale-105 transition-transform" onClick={() => window.location.href = `/profile/${f.id}`}>
                <img src={f.avatar || "/default-avatar.png"} className="w-16 h-16 rounded-lg object-cover mx-auto" />
                <div className="mt-1 text-xs text-gray-800 truncate">{f.username}</div>
              </div>
            ))}
            {(profile.suggestedFriends || []).length === 0 && <p className="text-sm text-gray-500">Немає рекомендацій</p>}
          </div>
        </div>

        {/* Стінка постів */}
        <div className="bg-white rounded-lg shadow p-6 flex flex-col space-y-4">
          {isOwner && (
            <div className="flex flex-col space-y-2">
              <textarea
                className="border rounded p-2 w-full resize-none"
                rows={3}
                placeholder="Що у вас нового?"
                value={newPost}
                onChange={(e) => setNewPost(e.target.value)}
              />
              <button
                onClick={handleAddPost}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded shadow self-end"
              >
                Опублікувати
              </button>
            </div>
          )}

          <div className="space-y-4">
            {posts.length === 0 ? (
              <p className="text-gray-500 text-sm">Поки немає постів</p>
            ) : (
              posts.map((p, idx) => (
                <div key={idx} className="border-b pb-2">
                  <Post text={p} />
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
