import React from 'react';
import { Game } from '../types/games';
import { Play, Star, Users, Eye } from 'lucide-react';

interface GameCardProps {
  game: Game;
  onPlay: () => void;
}

export function GameCard({ game, onPlay }: GameCardProps) {
  const getCategoryLabel = (category: string) => {
    const categories: Record<string, string> = {
      action: 'Екшн',
      puzzle: 'Головоломки',
      strategy: 'Стратегія',
      arcade: 'Аркада',
      adventure: 'Пригоди',
      simulation: 'Симулятори',
      sports: 'Спорт',
      racing: 'Гонки',
      other: 'Інше',
    };
    return categories[category] || category;
  };

  const formatPlayCount = (count: number) => {
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}k`;
    }
    return count.toString();
  };

  return (
    <div className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden group">
      {/* Thumbnail */}
      <div className="relative h-48 bg-gradient-to-br from-blue-500 to-purple-600 overflow-hidden">
        {game.thumbnail ? (
          <img
            src={game.thumbnail}
            alt={game.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Play className="text-white opacity-50" size={48} />
          </div>
        )}
        
        {/* Play overlay */}
        <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={onPlay}
            className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Play size={20} className="mr-2" />
            Грати
          </button>
        </div>

        {/* Category badge */}
        <div className="absolute top-3 left-3">
          <span className="px-2 py-1 bg-black bg-opacity-50 text-white text-xs rounded-full">
            {getCategoryLabel(game.category)}
          </span>
        </div>

        {/* Rating badge */}
        {game.rating > 0 && (
          <div className="absolute top-3 right-3">
            <div className="flex items-center px-2 py-1 bg-black bg-opacity-50 text-white text-xs rounded-full">
              <Star size={12} className="mr-1 fill-current text-yellow-400" />
              {game.rating.toFixed(1)}
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 mb-2 line-clamp-1">
          {game.title}
        </h3>
        
        <p className="text-gray-600 text-sm mb-3 line-clamp-2">
          {game.description || 'Немає опису'}
        </p>

        {/* Developer */}
        <div className="flex items-center mb-3">
          <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center mr-2">
            {game.developer?.avatar ? (
              <img
                src={game.developer.avatar}
                alt={game.developer.name}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              <span className="text-xs text-gray-600">
                {game.developer?.name?.[0]?.toUpperCase()}
              </span>
            )}
          </div>
          <span className="text-sm text-gray-600">
            {game.developer?.name} {game.developer?.lastName}
          </span>
        </div>

        {/* Stats */}
        <div className="flex items-center justify-between text-sm text-gray-500">
          <div className="flex items-center">
            <Eye size={16} className="mr-1" />
            <span>{formatPlayCount(game.play_count)} грали</span>
          </div>
          <span>{new Date(game.created_at).toLocaleDateString('uk-UA')}</span>
        </div>

        {/* Play button */}
        <button
          onClick={onPlay}
          className="w-full mt-4 flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Play size={18} className="mr-2" />
          Грати зараз
        </button>
      </div>
    </div>
  );
}