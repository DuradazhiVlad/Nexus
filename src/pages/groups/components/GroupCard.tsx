import React from 'react';
import { Group } from '../types';
import { GroupsFilters } from '../utils/groupsFilters';
import { 
  Users, 
  Lock, 
  Globe, 
  Calendar,
  MapPin,
  UserPlus,
  UserMinus,
  Eye,
  MessageCircle,
  Star,
  TrendingUp,
  Clock,
  Award
} from 'lucide-react';

interface GroupCardProps {
  group: Group;
  onJoin: (groupId: string) => void;
  onLeave: (groupId: string) => void;
  onView: (groupId: string) => void;
  viewMode: 'grid' | 'list';
}

export function GroupCard({ group, onJoin, onLeave, onView, viewMode }: GroupCardProps) {
  const isPrivate = GroupsFilters.isPrivateGroup(group);
  const isMember = GroupsFilters.isUserMember(group);
  const userRole = GroupsFilters.getUserRole(group);

  const handleJoin = () => {
    onJoin(group.id);
  };

  const handleLeave = () => {
    onLeave(group.id);
  };

  const handleView = () => {
    onView(group.id);
  };

  const getInitials = (name: string) => {
    return GroupsFilters.getInitials(name);
  };

  const formatDate = (dateString: string) => {
    return GroupsFilters.formatDate(dateString);
  };

  if (viewMode === 'list') {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {/* Avatar */}
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
              {group.avatar ? (
                <img src={group.avatar} alt={group.name} className="w-12 h-12 rounded-full object-cover" />
              ) : (
                getInitials(group.name)
              )}
            </div>

            {/* Group Info */}
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <h3 className="text-lg font-semibold text-gray-900">{group.name}</h3>
                {isPrivate ? (
                  <Lock className="w-4 h-4 text-gray-500" />
                ) : (
                  <Globe className="w-4 h-4 text-gray-500" />
                )}
                {group.is_verified && (
                  <Award className="w-4 h-4 text-yellow-500" />
                )}
              </div>
              
              {group.description && (
                <p className="text-gray-600 text-sm mt-1 line-clamp-2">{group.description}</p>
              )}
              
              <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                {group.category && (
                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                    {group.category}
                  </span>
                )}
                {group.location && (
                  <div className="flex items-center space-x-1">
                    <MapPin className="w-3 h-3" />
                    <span>{group.location}</span>
                  </div>
                )}
                <div className="flex items-center space-x-1">
                  <Users className="w-3 h-3" />
                  <span>{group.member_count || 0} учасників</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Clock className="w-3 h-3" />
                  <span>{formatDate(group.created_at)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-2">
            {isMember ? (
              <button
                onClick={handleLeave}
                className="flex items-center space-x-1 px-3 py-1.5 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors"
              >
                <UserMinus className="w-4 h-4" />
                <span>Покинути</span>
              </button>
            ) : (
              <button
                onClick={handleJoin}
                className="flex items-center space-x-1 px-3 py-1.5 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-colors"
              >
                <UserPlus className="w-4 h-4" />
                <span>Приєднатися</span>
              </button>
            )}
            
            <button
              onClick={handleView}
              className="flex items-center space-x-1 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-700 hover:bg-gray-50 rounded-md transition-colors"
            >
              <Eye className="w-4 h-4" />
              <span>Переглянути</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Grid view
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <h3 className="text-lg font-semibold text-gray-900">{group.name}</h3>
          {isPrivate ? (
            <Lock className="w-4 h-4 text-gray-500" />
          ) : (
            <Globe className="w-4 h-4 text-gray-500" />
          )}
          {group.is_verified && (
            <Award className="w-4 h-4 text-yellow-500" />
          )}
        </div>
      </div>

      {/* Avatar */}
      <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-xl mx-auto mb-3">
        {group.avatar ? (
          <img src={group.avatar} alt={group.name} className="w-16 h-16 rounded-full object-cover" />
        ) : (
          getInitials(group.name)
        )}
      </div>

      {/* Description */}
      {group.description && (
        <p className="text-gray-600 text-sm text-center mb-3 line-clamp-3">{group.description}</p>
      )}

      {/* Stats */}
      <div className="flex items-center justify-center space-x-4 mb-3 text-sm text-gray-500">
        <div className="flex items-center space-x-1">
          <Users className="w-3 h-3" />
          <span>{group.member_count || 0}</span>
        </div>
        <div className="flex items-center space-x-1">
          <MessageCircle className="w-3 h-3" />
          <span>{group.post_count || 0}</span>
        </div>
      </div>

      {/* Category & Location */}
      <div className="flex flex-wrap gap-1 mb-3 justify-center">
        {group.category && (
          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
            {group.category}
          </span>
        )}
        {group.location && (
          <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded-full text-xs flex items-center space-x-1">
            <MapPin className="w-3 h-3" />
            <span>{group.location}</span>
          </span>
        )}
      </div>

      {/* Created date */}
      <div className="text-xs text-gray-500 text-center mb-3">
        Створено {formatDate(group.created_at)}
      </div>

      {/* Actions */}
      <div className="flex space-x-2">
        {isMember ? (
          <button
            onClick={handleLeave}
            className="flex-1 flex items-center justify-center space-x-1 px-3 py-2 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors"
          >
            <UserMinus className="w-4 h-4" />
            <span>Покинути</span>
          </button>
        ) : (
          <button
            onClick={handleJoin}
            className="flex-1 flex items-center justify-center space-x-1 px-3 py-2 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-colors"
          >
            <UserPlus className="w-4 h-4" />
            <span>Приєднатися</span>
          </button>
        )}
        
        <button
          onClick={handleView}
          className="flex-1 flex items-center justify-center space-x-1 px-3 py-2 text-sm text-gray-600 hover:text-gray-700 hover:bg-gray-50 rounded-md transition-colors"
        >
          <Eye className="w-4 h-4" />
          <span>Переглянути</span>
        </button>
      </div>
    </div>
  );
} 