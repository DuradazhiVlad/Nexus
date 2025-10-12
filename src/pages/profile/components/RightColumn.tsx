import React, { useState, useEffect } from "react";
import { useProfileEdit } from "../context/ProfileEditContext";
import { Users, Image, Video, FileText } from "lucide-react";
import { PostCreate } from "./posts/PostCreate";
import { SuggestedFriends } from "./SuggestedFriends";
import { PostList } from "./posts/PostList";
import { usePostList } from '../hooks/usePosts'; 

export const RightColumn: React.FC = () => {
  const { profile, currentUser } = useProfileEdit();
  // Перевіряємо, чи поточний користувач є власником профілю
  const isOwner = currentUser?.id === profile?.auth_user_id;
  
  // >>> ВИПРАВЛЕНО 1: Коректна деструктуризація з аліасами 
    // userPosts -> posts, loadingPosts -> loading, loadUserPosts -> loadUserPosts
  const { 
        userPosts: posts, 
        loadingPosts: loading, 
        loadUserPosts 
    } = usePostList(currentUser, profile); 
  // Примітка: Хук usePostList очікує (currentUser, profile), а не лише profile?.id

  const [suggestedFriends, setSuggestedFriends] = useState<any[]>([]);

  useEffect(() => {
    if (!profile) return;
    // Mock-дані для SuggestedFriends
    setSuggestedFriends([
      { id: "1", name: "Іван", last_name: "Іваненко", avatar: "/default-avatar.png" },
      { id: "2", name: "Марія", last_name: "Петрівна", avatar: "/default-avatar.png" },
      { id: "3", name: "Петро", last_name: "Сидоренко", avatar: "/default-avatar.png" },
      { id: "4", name: "Олена", last_name: "Коваль", avatar: "/default-avatar.png" },
      { id: "5", name: "Сергій", last_name: "Мельник", avatar: "/default-avatar.png" },
      { id: "6", name: "Катерина", last_name: "Шевченко", avatar: "/default-avatar.png" },
    ]);
  }, [profile]);

  // >>> ВИПРАВЛЕНО 2: Виклик коректної функції loadUserPosts
  const handlePostUpdate = () => {
        loadUserPosts();
  };

  if (!profile) return null;

  return (
    <div className="space-y-6 pr-4 md:pr-6 lg:pr-12">

      {/* Верхня частина профілю (без змін) */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold mb-2">
          {profile.name} {profile.last_name}
        </h2>
        <p className="text-gray-600">{profile.city}</p>
        <p
          className={`mt-1 text-sm font-semibold ${
            profile.online_status === "online" ? "text-green-500" : "text-gray-400"
          }`}
        >
          {profile.online_status === "online" ? "Онлайн" : "Офлайн"}
        </p>
        {profile.bio && <p className="mt-3 text-gray-700">{profile.bio}</p>}
      </div>

      {/* Основна інформація (без змін) */}
      <div className="bg-white rounded-lg shadow p-6 space-y-2">
        <h3 className="text-lg font-semibold mb-2">Основна інформація</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-gray-700">
          {profile.birth_date && (
            <div>
              <span className="font-semibold">Дата народження:</span> {profile.birth_date}
            </div>
          )}
          {profile.phone && (
            <div>
              <span className="font-semibold">Телефон:</span> {profile.phone}
            </div>
          )}
          {profile.education && (
            <div>
              <span className="font-semibold">Освіта:</span> {profile.education}
            </div>
          )}
          {profile.work && (
            <div>
              <span className="font-semibold">Робота:</span> {profile.work}
            </div>
          )}
          {profile.website && (
            <div>
              <span className="font-semibold">Сайт:</span> {profile.website}
            </div>
          )}
          {profile.languages?.length > 0 && (
            <div>
              <span className="font-semibold">Мови:</span> {profile.languages.join(", ")}
            </div>
          )}
          {profile.hobbies?.length > 0 && (
            <div>
              <span className="font-semibold">Хобі:</span> {profile.hobbies.join(", ")}
            </div>
          )}
          {profile.relationship_status && (
            <div>
              <span className="font-semibold">Статус стосунків:</span>{" "}
              {profile.relationship_status}
            </div>
          )}
        </div>
      </div>

      {/* Статистика (без змін) */}
      <div className="bg-white rounded-lg shadow p-6 grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
        <div className="p-4 bg-gray-50 rounded hover:bg-gray-100 cursor-pointer">
          <Users className="w-6 h-6 mx-auto text-blue-500" />
          <p className="mt-1 font-semibold">{profile.friendsCount ?? 0}</p>
          <p className="text-xs text-gray-500">Друзі</p>
        </div>
        <div className="p-4 bg-gray-50 rounded hover:bg-gray-100 cursor-pointer">
          <Image className="w-6 h-6 mx-auto text-green-500" />
          <p className="mt-1 font-semibold">{profile.photosCount ?? 0}</p>
          <p className="text-xs text-gray-500">Фото</p>
        </div>
        <div className="p-4 bg-gray-50 rounded hover:bg-gray-100 cursor-pointer">
          <Video className="w-6 h-6 mx-auto text-purple-500" />
          <p className="mt-1 font-semibold">{profile.videosCount ?? 0}</p>
          <p className="text-xs text-gray-500">Відео</p>
        </div>
        <div className="p-4 bg-gray-50 rounded hover:bg-gray-100 cursor-pointer">
          <FileText className="w-6 h-6 mx-auto text-yellow-500" />
          <p className="mt-1 font-semibold">{profile.postsCount ?? 0}</p>
          <p className="text-xs text-gray-500">Пости</p>
        </div>
      </div>

      {/* Можливі знайомі (без змін) */}
      <SuggestedFriends suggestedFriends={suggestedFriends} />

      {/* Пости */}
      <div className="bg-white rounded-lg shadow p-6 space-y-4">
        {isOwner && <PostCreate onAdded={handlePostUpdate} />} 
        
        <PostList 
            posts={posts} 
            loading={loading} 
            // Наразі `error` не експортується з `usePostList`, але додаємо його
            // на випадок, якщо ви його пізніше додасте в хук
            error={null} 
            isOwner={isOwner} 
            onPostUpdate={handlePostUpdate} 
        />
      </div>
    </div>
  );
};
