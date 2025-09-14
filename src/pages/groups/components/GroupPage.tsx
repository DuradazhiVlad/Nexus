// src/pages/groups/GroupPage.tsx
import React, { useState } from "react";
import { Users, Globe, Lock, MapPin, Link, Mail } from "lucide-react";
import { GroupCard } from "../../components/GroupCard";
import { CreatePostForm } from "../../components/CreatePostForm";
import { PostsSection } from "../../components/PostsSection";

interface GroupPageProps {
  group: {
    id: string;
    name: string;
    description: string;
    is_private: boolean;
    category?: string;
    location?: string;
    website?: string;
    contactemail?: string;
    cover?: string;
    avatar?: string;
    rules?: string[];
    members?: { id: string; name: string; avatar?: string }[];
  };
  currentUserId?: string;
  isMember?: boolean;
  onJoinGroup?: () => void;
  onLeaveGroup?: () => void;
}

export function GroupPage({
  group,
  currentUserId,
  isMember = false,
  onJoinGroup,
  onLeaveGroup,
}: GroupPageProps) {
  const [activeTab, setActiveTab] = useState<"posts" | "media" | "events">(
    "posts"
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Cover */}
      <div className="relative h-64 bg-gray-200">
        {group.cover && (
          <img
            src={group.cover}
            alt="Cover"
            className="w-full h-full object-cover"
          />
        )}
        <div className="absolute inset-0 bg-black/30 flex flex-col justify-end">
          <div className="p-6 text-white">
            <h1 className="text-3xl font-bold">{group.name}</h1>
            <div className="flex items-center gap-4 mt-2 text-sm">
              {group.is_private ? (
                <span className="flex items-center gap-1">
                  <Lock className="w-4 h-4" /> Приватна
                </span>
              ) : (
                <span className="flex items-center gap-1">
                  <Globe className="w-4 h-4" /> Відкрита
                </span>
              )}
              <span className="flex items-center gap-1">
                <Users className="w-4 h-4" /> {group.members?.length || 0} учасників
              </span>
            </div>

            {/* Кнопки */}
            <div className="mt-4">
              {isMember ? (
                <button
                  onClick={onLeaveGroup}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
                >
                  Вийти з групи
                </button>
              ) : (
                <button
                  onClick={onJoinGroup}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Приєднатися
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto p-6 flex gap-8">
        {/* Left Sidebar */}
        <div className="w-80 shrink-0 space-y-6">
          {/* Аватар */}
          <div className="bg-white shadow rounded-lg p-4 text-center">
            {group.avatar ? (
              <img
                src={group.avatar}
                alt={group.name}
                className="w-32 h-32 rounded-xl mx-auto object-cover"
              />
            ) : (
              <div className="w-32 h-32 mx-auto rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-3xl font-bold">
                {group.name[0].toUpperCase()}
              </div>
            )}
            <p className="mt-3 text-gray-600">{group.description}</p>
          </div>

          {/* Info */}
          <div className="bg-white shadow rounded-lg p-4 space-y-2">
            {group.category && (
              <p>
                <strong>Категорія:</strong> {group.category}
              </p>
            )}
            {group.location && (
              <p className="flex items-center gap-1">
                <MapPin className="w-4 h-4 text-gray-500" />
                {group.location}
              </p>
            )}
            {group.website && (
              <p className="flex items-center gap-1">
                <Link className="w-4 h-4 text-gray-500" />
                <a
                  href={group.website}
                  target="_blank"
                  className="text-blue-600 hover:underline"
                >
                  {group.website}
                </a>
              </p>
            )}
            {group.contactemail && (
              <p className="flex items-center gap-1">
                <Mail className="w-4 h-4 text-gray-500" />
                {group.contactemail}
              </p>
            )}
          </div>

          {/* Rules */}
          {group.rules && group.rules.length > 0 && (
            <div className="bg-white shadow rounded-lg p-4">
              <h3 className="font-semibold mb-2">Правила</h3>
              <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                {group.rules.map((rule, i) => (
                  <li key={i}>{rule}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Members */}
          {group.members && group.members.length > 0 && (
            <div className="bg-white shadow rounded-lg p-4">
              <h3 className="font-semibold mb-2">Учасники</h3>
              <div className="flex flex-wrap gap-2">
                {group.members.slice(0, 8).map((m) => (
                  <img
                    key={m.id}
                    src={m.avatar || "/default-avatar.png"}
                    alt={m.name}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ))}
              </div>
              {group.members.length > 8 && (
                <p className="text-sm text-gray-500 mt-2">
                  +{group.members.length - 8} ще
                </p>
              )}
            </div>
          )}
        </div>

        {/* Right Content */}
        <div className="flex-1 space-y-6">
          {/* Tabs */}
          <div className="bg-white shadow rounded-lg p-4 flex gap-6 border-b">
            <button
              className={`pb-2 ${
                activeTab === "posts"
                  ? "border-b-2 border-blue-600 font-semibold"
                  : "text-gray-600"
              }`}
              onClick={() => setActiveTab("posts")}
            >
              Пости
            </button>
            <button
              className={`pb-2 ${
                activeTab === "media"
                  ? "border-b-2 border-blue-600 font-semibold"
                  : "text-gray-600"
              }`}
              onClick={() => setActiveTab("media")}
            >
              Медіа
            </button>
            <button
              className={`pb-2 ${
                activeTab === "events"
                  ? "border-b-2 border-blue-600 font-semibold"
                  : "text-gray-600"
              }`}
              onClick={() => setActiveTab("events")}
            >
              Події
            </button>
          </div>

          {/* Tab Content */}
          {activeTab === "posts" && (
            <div>
              {isMember && (
                <CreatePostForm
                  onCreate={(data) =>
                    console.log("Створити пост у групі", data)
                  }
                />
              )}
              <PostsSection posts={[]} />
            </div>
          )}

          {activeTab === "media" && (
            <div className="bg-white shadow rounded-lg p-6">
              <p className="text-gray-600">Тут буде медіа-контент групи</p>
            </div>
          )}

          {activeTab === "events" && (
            <div className="bg-white shadow rounded-lg p-6">
              <p className="text-gray-600">Тут будуть події групи</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
