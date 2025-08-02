import React from 'react';
import { 
  Search, 
  Filter, 
  X, 
  Grid, 
  List,
  Sort,
  ArrowUpDown
} from 'lucide-react';
import { Filters, ViewMode } from '../types';

interface PeopleFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  filters: Filters;
  onFiltersChange: (filters: Filters) => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  showFilters: boolean;
  onToggleFilters: () => void;
  onResetFilters: () => void;
  activeFiltersCount: number;
}

export function PeopleFilters({
  searchQuery,
  onSearchChange,
  filters,
  onFiltersChange,
  viewMode,
  onViewModeChange,
  showFilters,
  onToggleFilters,
  onResetFilters,
  activeFiltersCount
}: PeopleFiltersProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
      {/* Search and Controls */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-4 flex-1">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Пошук користувачів..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Filters Toggle */}
          <button
            onClick={onToggleFilters}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              showFilters 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Filter size={16} />
            Фільтри
            {activeFiltersCount > 0 && (
              <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1">
                {activeFiltersCount}
              </span>
            )}
          </button>

          {/* Reset Filters */}
          {activeFiltersCount > 0 && (
            <button
              onClick={onResetFilters}
              className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              <X size={16} />
              Скинути
            </button>
          )}
        </div>

        {/* View Mode */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => onViewModeChange('grid')}
            className={`p-2 rounded-lg transition-colors ${
              viewMode === 'grid' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <Grid size={16} />
          </button>
          <button
            onClick={() => onViewModeChange('list')}
            className={`p-2 rounded-lg transition-colors ${
              viewMode === 'list' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <List size={16} />
          </button>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="border-t pt-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* City Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Місто
              </label>
              <input
                type="text"
                placeholder="Введіть місто..."
                value={filters.city}
                onChange={(e) => onFiltersChange({ ...filters, city: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Online Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Статус
              </label>
              <select
                value={filters.onlineStatus}
                onChange={(e) => onFiltersChange({ ...filters, onlineStatus: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">Всі</option>
                <option value="online">Онлайн</option>
                <option value="offline">Офлайн</option>
              </select>
            </div>

            {/* Friend Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Статус дружби
              </label>
              <select
                value={filters.friendStatus}
                onChange={(e) => onFiltersChange({ ...filters, friendStatus: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">Всі</option>
                <option value="friends">Друзі</option>
                <option value="not_friends">Не друзі</option>
                <option value="pending">Запити</option>
              </select>
            </div>

            {/* Sort By */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Сортування
              </label>
              <select
                value={filters.sortBy}
                onChange={(e) => onFiltersChange({ ...filters, sortBy: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="date">За датою</option>
                <option value="name">За іменем</option>
                <option value="city">За містом</option>
                <option value="lastSeen">За останнім входом</option>
                <option value="popularity">За популярністю</option>
              </select>
            </div>
          </div>

          {/* Additional Filters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Sort Order */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Порядок сортування
              </label>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => onFiltersChange({ ...filters, sortOrder: 'asc' })}
                  className={`px-3 py-2 rounded-lg transition-colors ${
                    filters.sortOrder === 'asc' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <ArrowUpDown size={16} />
                </button>
                <span className="text-sm text-gray-600">
                  {filters.sortOrder === 'asc' ? 'За зростанням' : 'За спаданням'}
                </span>
              </div>
            </div>

            {/* Has Avatar */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="hasAvatar"
                checked={filters.hasAvatar}
                onChange={(e) => onFiltersChange({ ...filters, hasAvatar: e.target.checked })}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="hasAvatar" className="ml-2 text-sm text-gray-700">
                Тільки з аватаром
              </label>
            </div>

            {/* Has Bio */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="hasBio"
                checked={filters.hasBio}
                onChange={(e) => onFiltersChange({ ...filters, hasBio: e.target.checked })}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="hasBio" className="ml-2 text-sm text-gray-700">
                Тільки з біографією
              </label>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 