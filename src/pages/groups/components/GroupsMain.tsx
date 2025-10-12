import React, { useState, useMemo } from 'react';
import { useGroups } from '../hooks/useGroups';
import { CreateGroupModal } from './CreateGroupModal';
import { X, Globe, Lock, List, LayoutGrid, Search, Plus, MapPin, Mail, FileText } from 'lucide-react';
import { GroupCard } from './GroupCard';
import { GroupFilters } from '../types';
import { GroupsFilters } from '../utils/groupsFilters';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

export function GroupsMain() {
  const { filteredGroups, loading, error, applyFilters, joinGroup, leaveGroup, createGroup } = useGroups();
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [currentFilters, setCurrentFilters] = useState<GroupFilters>({
    searchQuery: '',
    category: '',
    type: 'all',
    membership: 'all',
    sortBy: 'activity'
  });
  const [createGroupLoading, setCreateGroupLoading] = useState(false);

  const handleFilterChange = (newFilters: Partial<GroupFilters>) => {
    const updatedFilters = { ...currentFilters, ...newFilters };
    setCurrentFilters(updatedFilters);
    applyFilters(updatedFilters);
  };

  const handleCreateGroup = async (groupData: any) => {
    setCreateGroupLoading(true);
    try {
      const newGroup = await createGroup(groupData);
      if (newGroup) {
        toast.success('Група успішно створена!');
        setIsModalOpen(false);
      } else {
        toast.error('Не вдалося створити групу.');
      }
    } catch (e) {
      toast.error('Помилка при створенні групи.');
    } finally {
      setCreateGroupLoading(false);
    }
  };

  const handleViewGroup = (groupId: string) => {
    navigate(`/groups/${groupId}`);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-8rem)]">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Спільноти</h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md shadow-md transition-colors flex items-center"
        >
          <Plus className="w-5 h-5 mr-2" />
          Створити групу
        </button>
      </div>

      {/* Filters & View */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative flex-grow">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Пошук груп..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              value={currentFilters.searchQuery}
              onChange={(e) => handleFilterChange({ searchQuery: e.target.value })}
            />
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700 whitespace-nowrap">Сортувати за:</label>
            <select
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              value={currentFilters.sortBy}
              onChange={(e) => handleFilterChange({ sortBy: e.target.value as 'name' | 'members' | 'activity' | 'created' })}
            >
              <option value="activity">Активністю</option>
              <option value="members">Кількістю учасників</option>
              <option value="created">Датою створення</option>
              <option value="name">Назвою</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700 whitespace-nowrap">Тип:</label>
            <select
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              value={currentFilters.type}
              onChange={(e) => handleFilterChange({ type: e.target.value as 'all' | 'public' | 'private' })}
            >
              <option value="all">Усі</option>
              <option value="public">Публічні</option>
              <option value="private">Приватні</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700 whitespace-nowrap">Участь:</label>
            <select
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              value={currentFilters.membership}
              onChange={(e) => handleFilterChange({ membership: e.target.value as 'all' | 'member' | 'not_member' })}
            >
              <option value="all">Усі</option>
              <option value="member">Мої групи</option>
              <option value="not_member">Не в моїх</option>
            </select>
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-gray-200 text-gray-900' : 'text-gray-500 hover:bg-gray-100'}`}
              title="Перегляд сіткою"
            >
              <LayoutGrid className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-md transition-colors ${viewMode === 'list' ? 'bg-gray-200 text-gray-900' : 'text-gray-500 hover:bg-gray-100'}`}
              title="Перегляд списком"
            >
              <List className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Group List */}
      {error && <div className="text-center text-red-500 mb-4">{error}</div>}
      {filteredGroups.length === 0 && !loading && (
        <div className="text-center text-gray-500">
          Групи не знайдено. Спробуйте змінити фільтри.
        </div>
      )}

      <div className={`${viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}`}>
        {filteredGroups.map(group => (
          <GroupCard 
            key={group.id} 
            group={group} 
            viewMode={viewMode}
            onJoin={joinGroup}
            onLeave={leaveGroup}
            onView={handleViewGroup}
          />
        ))}
      </div>
      
      <CreateGroupModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateGroup}
        loading={createGroupLoading}
      />
    </div>
  );
}