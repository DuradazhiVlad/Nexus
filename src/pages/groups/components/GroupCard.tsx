import React from 'react';
import { Group } from '../types';
import { Users, FileText, Lock, Globe, MapPin, Calendar } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { uk } from 'date-fns/locale';

interface GroupCardProps {
  group: Group;
  viewMode: 'grid' | 'list';
  onJoin: (groupId: string) => void;
  onLeave: (groupId: string) => void;
  onView: (groupId: string) => void;
}

export function GroupCard({ group, viewMode, onJoin, onLeave, onView }: GroupCardProps) {
  const isMember = !!group.user_membership;
  const isPrivate = group.is_private;
  const lastActivity = group.last_activity ? new Date(group.last_activity) : null;
  
  const handleCardClick = () => {
    onView(group.id);
  };
  
  const handleJoinClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Зупиняємо перехід на сторінку групи
    onJoin(group.id);
  };
  
  const handleLeaveClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Зупиняємо перехід на сторінку групи
    onLeave(group.id);
  };

  return (
    <div
      onClick={handleCardClick}
      className={`
      bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 cursor-pointer
      ${viewMode === 'grid' ? 'p-6 flex flex-col' : 'p-4 flex items-start space-x-4'}
    `}>
      {/* Header & Avatar */}
      <div className={`${viewMode === 'grid' ? 'flex items-center justify-between mb-4' : 'flex-1 min-w-0 flex items-center space-x-3'}`}>
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-full bg-gray-200 flex-shrink-0">
            {group.avatar && <img src={group.avatar} alt={`${group.name} avatar`} className="w-full h-full rounded-full object-cover" />}
          </div>
          <div>
            <h3 className="text-xl font-semibold text-gray-900 truncate">{group.name}</h3>
            <p className="text-sm text-gray-500 truncate">{group.category || 'Без категорії'}</p>
          </div>
        </div>
        {isPrivate ? (
          <Lock className="w-5 h-5 text-gray-500" title="Приватна група" />
        ) : (
          <Globe className="w-5 h-5 text-green-600" title="Публічна група" />
        )}
      </div>

      {/* Description & Stats */}
      <div className={`${viewMode === 'grid' ? 'flex-grow' : 'flex-1 min-w-0 mt-2'}`}>
        <p className="text-sm text-gray-600 mb-4 line-clamp-2">
          {group.description || 'Опис відсутній.'}
        </p>
        
        <div className="flex items-center flex-wrap gap-x-4 gap-y-2 text-gray-500 text-sm mb-4">
          <div className="flex items-center space-x-1 whitespace-nowrap">
            <Users className="w-4 h-4" />
            <span>{group.member_count} учасників</span>
          </div>
          <div className="flex items-center space-x-1 whitespace-nowrap">
            <FileText className="w-4 h-4" />
            <span>{group.post_count} дописів</span>
          </div>
          {lastActivity && (
            <div className="flex items-center space-x-1 whitespace-nowrap">
              <Calendar className="w-4 h-4" />
              <span>Активність {formatDistanceToNow(lastActivity, { addSuffix: true, locale: uk })}</span>
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className={`
        ${viewMode === 'grid' ? 'w-full' : 'flex-shrink-0 flex items-center space-x-2'}
        border-t border-gray-200 pt-4 mt-4
      `}>
        {isMember ? (
          <button
            onClick={handleLeaveClick}
            className="flex-1 text-center py-2 px-4 rounded-md text-sm font-medium bg-red-500 text-white hover:bg-red-600 transition-colors"
          >
            Вийти
          </button>
        ) : (
          <button
            onClick={handleJoinClick}
            className="flex-1 text-center py-2 px-4 rounded-md text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors"
          >
            Приєднатися
          </button>
        )}
      </div>
    </div>
  );
}