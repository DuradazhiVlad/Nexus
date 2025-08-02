import React from 'react';
import { ViewMode } from '../types';
import { 
  FileText, 
  Users, 
  Image, 
  Info,
  MessageSquare,
  Heart,
  Calendar
} from 'lucide-react';

interface UserTabsProps {
  activeTab: ViewMode;
  onTabChange: (tab: ViewMode) => void;
  postsCount: number;
  friendsCount: number;
  photosCount: number;
}

export function UserTabs({
  activeTab,
  onTabChange,
  postsCount,
  friendsCount,
  photosCount
}: UserTabsProps) {
  const tabs = [
    {
      id: 'posts' as ViewMode,
      label: 'Пости',
      icon: FileText,
      count: postsCount
    },
    {
      id: 'friends' as ViewMode,
      label: 'Друзі',
      icon: Users,
      count: friendsCount
    },
    {
      id: 'photos' as ViewMode,
      label: 'Фото',
      icon: Image,
      count: photosCount
    },
    {
      id: 'about' as ViewMode,
      label: 'Про себе',
      icon: Info,
      count: null
    }
  ];

  return (
    <div className="bg-white rounded-lg shadow-sm border mb-6">
      <div className="flex border-b">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                isActive
                  ? 'border-blue-500 text-blue-600 bg-blue-50'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Icon size={16} />
              {tab.label}
              {tab.count !== null && (
                <span className="ml-1 px-2 py-0.5 text-xs bg-gray-200 text-gray-600 rounded-full">
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
} 