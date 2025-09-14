import React, { useState } from 'react';
import { MessageSquare, Image, Video, Users, Calendar } from 'lucide-react';
import { CreatePostForm } from './CreatePostForm';
import { PostsSection } from './PostsSection';

interface ProfileTabsProps {
  profile: any;
  postContent: string;
  setPostContent: (content: string) => void;
  postMediaUrl: string;
  setPostMediaUrl: (url: string) => void;
  postMediaType: 'image' | 'video' | null;
  setPostMediaType: (type: 'image' | 'video' | null) => void;
  creatingPost: boolean;
  showEmojiPicker: boolean;
  setShowEmojiPicker: (show: boolean) => void;
  showMediaInput: boolean;
  setShowMediaInput: (show: boolean) => void;
  characterCount: number;
  MAX_CHARACTERS: number;
  EMOJIS: string[];
  addEmoji: (emoji: string) => void;
  handleCreatePost: () => void;
  loadingPosts: boolean;
  userPosts: any[];
  currentUser: any;
  setUserPosts: (posts: any[]) => void;
}

type TabType = 'posts' | 'photos' | 'videos' | 'friends' | 'info';

export function ProfileTabs({
  profile,
  postContent,
  setPostContent,
  postMediaUrl,
  setPostMediaUrl,
  postMediaType,
  setPostMediaType,
  creatingPost,
  showEmojiPicker,
  setShowEmojiPicker,
  showMediaInput,
  setShowMediaInput,
  characterCount,
  MAX_CHARACTERS,
  EMOJIS,
  addEmoji,
  handleCreatePost,
  loadingPosts,
  userPosts,
  currentUser,
  setUserPosts,
}: ProfileTabsProps) {
  const [activeTab, setActiveTab] = useState<TabType>('posts');

  const tabs = [
    {
      id: 'posts' as TabType,
      label: 'Записи',
      icon: MessageSquare,
      count: userPosts?.length || 0,
    },
    {
      id: 'photos' as TabType,
      label: 'Фотографії',
      icon: Image,
      count: 0, // TODO: Add photos count
    },
    {
      id: 'videos' as TabType,
      label: 'Відео',
      icon: Video,
      count: 0, // TODO: Add videos count
    },
    {
      id: 'friends' as TabType,
      label: 'Друзі',
      icon: Users,
      count: profile?.friends_count || 0,
    },
    {
      id: 'info' as TabType,
      label: 'Інформація',
      icon: Calendar,
      count: null,
    },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'posts':
        return (
          <div className="space-y-6">
            <CreatePostForm
              profile={profile}
              postContent={postContent}
              setPostContent={setPostContent}
              postMediaUrl={postMediaUrl}
              setPostMediaUrl={setPostMediaUrl}
              postMediaType={postMediaType}
              setPostMediaType={setPostMediaType}
              creatingPost={creatingPost}
              showEmojiPicker={showEmojiPicker}
              setShowEmojiPicker={setShowEmojiPicker}
              showMediaInput={showMediaInput}
              setShowMediaInput={setShowMediaInput}
              characterCount={characterCount}
              MAX_CHARACTERS={MAX_CHARACTERS}
              EMOJIS={EMOJIS}
              addEmoji={addEmoji}
              handleCreatePost={handleCreatePost}
            />
            <PostsSection
              loadingPosts={loadingPosts}
              userPosts={userPosts}
              currentUser={currentUser}
              profile={profile}
              setUserPosts={setUserPosts}
            />
          </div>
        );
      case 'photos':
        return (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="text-center py-12">
              <Image className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Фотографії</h3>
              <p className="text-gray-500">Тут будуть відображатися фотографії користувача</p>
            </div>
          </div>
        );
      case 'videos':
        return (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="text-center py-12">
              <Video className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Відео</h3>
              <p className="text-gray-500">Тут будуть відображатися відео користувача</p>
            </div>
          </div>
        );
      case 'friends':
        return (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="text-center py-12">
              <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Друзі</h3>
              <p className="text-gray-500">Тут будуть відображатися друзі користувача</p>
            </div>
          </div>
        );
      case 'info':
        return (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900">Детальна інформація</h3>
              
              {profile?.bio && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Про себе</h4>
                  <p className="text-gray-600">{profile.bio}</p>
                </div>
              )}
              
              {profile?.city && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Місто</h4>
                  <p className="text-gray-600">{profile.city}</p>
                </div>
              )}
              
              {profile?.birth_date && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Дата народження</h4>
                  <p className="text-gray-600">
                    {new Date(profile.birth_date).toLocaleDateString('uk-UA', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                </div>
              )}
              
              {profile?.created_at && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Дата реєстрації</h4>
                  <p className="text-gray-600">
                    {new Date(profile.created_at).toLocaleDateString('uk-UA', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                </div>
              )}
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Tabs Navigation */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="flex border-b border-gray-200">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex items-center gap-2 px-6 py-4 text-sm font-medium transition-colors
                  border-b-2 -mb-px
                  ${
                    isActive
                      ? 'border-blue-500 text-blue-600 bg-blue-50'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }
                `}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
                {tab.count !== null && (
                  <span className={`
                    px-2 py-1 text-xs rounded-full
                    ${
                      isActive
                        ? 'bg-blue-100 text-blue-600'
                        : 'bg-gray-100 text-gray-500'
                    }
                  `}>
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      {renderTabContent()}
    </div>
  );
}