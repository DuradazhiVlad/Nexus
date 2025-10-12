import React from 'react';
import {
  Search,
  Filter,
  X,
  Grid,
  List,
  ArrowUpDown,
  Settings
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
    <div className="bg-white rounded-2xl p-6 shadow-xl border border-gray-100 mb-6">
      {/* Search and Controls */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px] max-w-lg">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Пошук користувачів..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-12 pr-6 py-3 border border-gray-300 rounded-3xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 text-gray-700 transition-all duration-300 placeholder-gray-400 hover:shadow-md focus:shadow-lg"
          />
        </div>

        <div className="flex items-center space-x-4">
          {/* Filters Toggle */}
          <div className="relative">
            <button
              onClick={onToggleFilters}
              className={`flex items-center justify-center p-3 rounded-2xl border transition-all duration-300 ${
                showFilters
                  ? 'bg-blue-600 text-white border-blue-600 shadow-lg'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100 hover:shadow-md'
              }`}
              title="Фільтри"
            >
              <Filter className="w-5 h-5" />
              {activeFiltersCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center border-2 border-white">
                  {activeFiltersCount}
                </span>
              )}
            </button>
          </div>

          {/* Reset Filters */}
          {activeFiltersCount > 0 && (
            <button
              onClick={onResetFilters}
              className="flex items-center gap-2 px-4 py-3 rounded-2xl text-gray-600 hover:text-gray-900 transition-colors duration-300 bg-gray-100 hover:bg-gray-200 text-sm font-medium"
            >
              <X size={18} />
              Скинути
            </button>
          )}

          {/* View Mode */}
          <div className="flex items-center bg-gray-100 rounded-2xl p-1 shadow-inner">
            <button
              onClick={() => onViewModeChange('grid')}
              className={`p-3 rounded-xl transition-all duration-200 ${
                viewMode === 'grid'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
              title="Сітка"
            >
              <Grid size={20} />
            </button>
            <button
              onClick={() => onViewModeChange('list')}
              className={`p-3 rounded-xl transition-all duration-200 ${
                viewMode === 'list'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
              title="Список"
            >
              <List size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* Filters Panel - Animated with dynamic height */}
      <div
        className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 transition-all duration-500 ease-in-out overflow-hidden ${
          showFilters ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        {/* City Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Місто
          </label>
          <input
            type="text"
            placeholder="Введіть місто..."
            value={filters.city}
            onChange={(e) => onFiltersChange({ ...filters, city: e.target.value })}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-800"
          />
        </div>

        {/* Online Status Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Статус
          </label>
          <select
            value={filters.onlineStatus}
            onChange={(e) => onFiltersChange({ ...filters, onlineStatus: e.target.value as any })}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-800 bg-white"
          >
            <option value="all">Всі</option>
            <option value="online">Онлайн</option>
            <option value="offline">Офлайн</option>
          </select>
        </div>

        {/* Friend Status Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Статус дружби
          </label>
          <select
            value={filters.friendStatus}
            onChange={(e) => onFiltersChange({ ...filters, friendStatus: e.target.value as any })}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-800 bg-white"
          >
            <option value="all">Всі</option>
            <option value="friends">Друзі</option>
            <option value="not_friends">Не друзі</option>
            <option value="sent">Запити надіслані</option>
            <option value="received">Запити отримані</option>
          </select>
        </div>

        {/* Sort By */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Сортування
          </label>
          <select
            value={filters.sortBy}
            onChange={(e) => onFiltersChange({ ...filters, sortBy: e.target.value as any })}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-800 bg-white"
          >
            <option value="date">За датою</option>
            <option value="name">За іменем</option>
            <option value="city">За містом</option>
            <option value="lastSeen">За останнім входом</option>
            <option value="popularity">За популярністю</option>
          </select>
        </div>

        {/* Checkboxes for additional filters */}
        <div className="col-span-1 md:col-span-2 lg:col-span-4 flex items-center flex-wrap gap-6 mt-2">
          {/* Sort Order */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => onFiltersChange({ ...filters, sortOrder: filters.sortOrder === 'asc' ? 'desc' : 'asc' })}
              className={`p-2 rounded-lg transition-colors duration-200 ${
                filters.sortOrder === 'asc'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              <ArrowUpDown size={20} />
            </button>
            <span className="text-sm text-gray-600">
              {filters.sortOrder === 'asc' ? 'За зростанням' : 'За спаданням'}
            </span>
          </div>

          {/* Has Avatar */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="hasAvatar"
              checked={filters.hasAvatar}
              onChange={(e) => onFiltersChange({ ...filters, hasAvatar: e.target.checked })}
              className="w-5 h-5 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
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
              className="w-5 h-5 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="hasBio" className="ml-2 text-sm text-gray-700">
              Тільки з біографією
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}