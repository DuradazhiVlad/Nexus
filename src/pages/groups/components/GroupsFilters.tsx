import React from 'react';
import { GroupFilters } from '../types';
import { GroupsFilters as GroupsFiltersUtil } from '../utils/groupsFilters';
import { 
  Search, 
  Filter, 
  X,
  Grid,
  List,
  SlidersHorizontal
} from 'lucide-react';

interface GroupsFiltersProps {
  filters: GroupFilters;
  onFiltersChange: (filters: GroupFilters) => void;
  viewMode: 'grid' | 'list';
  onViewModeChange: (mode: 'grid' | 'list') => void;
  activeFiltersCount: number;
  onResetFilters: () => void;
}

const categories = [
  'Технології',
  'Спорт',
  'Мистецтво',
  'Музика',
  'Освіта',
  'Бізнес',
  'Подорожі',
  'Кулінарія',
  'Фотографія',
  'Ігри',
  'Книги',
  'Здоров\'я',
  'Мода',
  'Інше'
];

export function GroupsFilters({ 
  filters, 
  onFiltersChange, 
  viewMode, 
  onViewModeChange,
  activeFiltersCount,
  onResetFilters 
}: GroupsFiltersProps) {
  const handleSearchChange = (value: string) => {
    onFiltersChange({ ...filters, searchQuery: value });
  };

  const handleCategoryChange = (value: string) => {
    onFiltersChange({ ...filters, categoryFilter: value });
  };

  const handleTypeChange = (value: 'all' | 'public' | 'private') => {
    onFiltersChange({ ...filters, typeFilter: value });
  };

  const handleMembershipChange = (value: 'all' | 'member' | 'not_member') => {
    onFiltersChange({ ...filters, membershipFilter: value });
  };

  const handleSortChange = (value: 'name' | 'members' | 'activity' | 'created') => {
    onFiltersChange({ ...filters, sortBy: value });
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Фільтри та пошук</h2>
        <div className="flex items-center space-x-2">
          {/* View Mode Toggle */}
          <div className="flex items-center bg-gray-100 rounded-md p-1">
            <button
              onClick={() => onViewModeChange('grid')}
              className={`p-2 rounded-md transition-colors ${
                viewMode === 'grid' 
                  ? 'bg-white text-blue-600 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => onViewModeChange('list')}
              className={`p-2 rounded-md transition-colors ${
                viewMode === 'list' 
                  ? 'bg-white text-blue-600 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          {/* Reset Filters */}
          {activeFiltersCount > 0 && (
            <button
              onClick={onResetFilters}
              className="flex items-center space-x-1 px-3 py-2 text-sm text-gray-600 hover:text-gray-700 hover:bg-gray-50 rounded-md transition-colors"
            >
              <X className="w-4 h-4" />
              <span>Скинути ({activeFiltersCount})</span>
            </button>
          )}
        </div>
      </div>

      {/* Search */}
      <div className="mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Пошук груп..."
            value={filters.searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      {/* Filters Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Category Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Категорія
          </label>
          <select
            value={filters.categoryFilter}
            onChange={(e) => handleCategoryChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Всі категорії</option>
            {categories.map(category => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>

        {/* Type Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Тип групи
          </label>
          <select
            value={filters.typeFilter}
            onChange={(e) => handleTypeChange(e.target.value as 'all' | 'public' | 'private')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">Всі групи</option>
            <option value="public">Публічні</option>
            <option value="private">Приватні</option>
          </select>
        </div>

        {/* Membership Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Членство
          </label>
          <select
            value={filters.membershipFilter}
            onChange={(e) => handleMembershipChange(e.target.value as 'all' | 'member' | 'not_member')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">Всі групи</option>
            <option value="member">Мої групи</option>
            <option value="not_member">Не мої групи</option>
          </select>
        </div>

        {/* Sort Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Сортування
          </label>
          <select
            value={filters.sortBy}
            onChange={(e) => handleSortChange(e.target.value as 'name' | 'members' | 'activity' | 'created')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="activity">За активністю</option>
            <option value="name">За назвою</option>
            <option value="members">За кількістю учасників</option>
            <option value="created">За датою створення</option>
          </select>
        </div>
      </div>
    </div>
  );
} 