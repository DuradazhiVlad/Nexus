import React from 'react';
import { Group } from '../types';
import { GroupCard } from './GroupCard';
import { Users, Search } from 'lucide-react';

interface GroupsListProps {
  groups: Group[];
  loading: boolean;
  viewMode: 'grid' | 'list';
  onJoinGroup: (groupId: string) => void;
  onLeaveGroup: (groupId: string) => void;
  onViewGroup: (groupId: string) => void;
  searchQuery: string;
}

export const GroupsList: React.FC<GroupsListProps> = ({
  groups,
  loading,
  viewMode,
  onJoinGroup,
  onLeaveGroup,
  onViewGroup,
  searchQuery
}) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Завантаження груп...</span>
      </div>
    );
  }

  if (groups.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          {searchQuery ? (
            <Search className="w-8 h-8 text-gray-400" />
          ) : (
            <Users className="w-8 h-8 text-gray-400" />
          )}
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          {searchQuery ? 'Групи не знайдено' : 'Немає груп'}
        </h3>
        <p className="text-gray-500 max-w-sm mx-auto">
          {searchQuery 
            ? `Не вдалося знайти групи за запитом "${searchQuery}". Спробуйте змінити пошуковий запит.`
            : 'Поки що немає створених груп. Створіть першу групу!'
          }
        </p>
      </div>
    );
  }

  return (
    <div className={`
      ${viewMode === 'grid' 
        ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' 
        : 'space-y-4'
      }
    `}>
      {groups.map((group) => (
        <GroupCard
          key={group.id}
          group={group}
          onJoin={onJoinGroup}
          onLeave={onLeaveGroup}
          onView={onViewGroup}
          viewMode={viewMode}
        />
      ))}
    </div>
  );
};