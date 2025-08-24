import React from 'react';
import { DatingFilters as DatingFiltersType } from '../types';
import { RotateCcw } from 'lucide-react';

interface DatingFiltersProps {
  filters: DatingFiltersType;
  onFiltersChange: (filters: DatingFiltersType) => void;
  onResetFilters: () => void;
}

export function DatingFilters({ filters, onFiltersChange, onResetFilters }: DatingFiltersProps) {
  const handleFilterChange = (key: keyof DatingFiltersType, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value
    });
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">
          Фільтри пошуку
        </h3>
        <button
          onClick={onResetFilters}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
          Скинути
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Gender Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Стать
          </label>
          <select
            value={filters.gender}
            onChange={(e) => handleFilterChange('gender', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">Всі</option>
            <option value="male">Чоловіки</option>
            <option value="female">Жінки</option>
            <option value="other">Інше</option>
          </select>
        </div>

        {/* Age Range */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Вік від {filters.minAge} до {filters.maxAge} років
          </label>
          <div className="space-y-2">
            <div>
              <label className="text-xs text-gray-500">Від:</label>
              <input
                type="range"
                min="18"
                max="65"
                value={filters.minAge}
                onChange={(e) => handleFilterChange('minAge', parseInt(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500">До:</label>
              <input
                type="range"
                min="18"
                max="65"
                value={filters.maxAge}
                onChange={(e) => handleFilterChange('maxAge', parseInt(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
              />
            </div>
          </div>
        </div>

        {/* City Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Місто
          </label>
          <input
            type="text"
            value={filters.city}
            onChange={(e) => handleFilterChange('city', e.target.value)}
            placeholder="Введіть назву міста"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Has Photo Filter */}
        <div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={filters.hasPhoto}
              onChange={(e) => handleFilterChange('hasPhoto', e.target.checked)}
              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
            />
            <span className="text-sm font-medium text-gray-700">
              Тільки з фото
            </span>
          </label>
        </div>

        {/* Sort By */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Сортування
          </label>
          <select
            value={filters.sortBy}
            onChange={(e) => handleFilterChange('sortBy', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="newest">Нові користувачі</option>
            <option value="name">За ім'ям</option>
            <option value="age">За віком</option>
          </select>
        </div>
      </div>

      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
          border: 2px solid #ffffff;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .slider::-moz-range-thumb {
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
          border: 2px solid #ffffff;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .slider::-webkit-slider-track {
          height: 8px;
          background: #e5e7eb;
          border-radius: 4px;
        }

        .slider::-moz-range-track {
          height: 8px;
          background: #e5e7eb;
          border-radius: 4px;
          border: none;
        }
      `}</style>
    </div>
  );
}