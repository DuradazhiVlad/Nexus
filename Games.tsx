import React, { useState, useEffect } from 'react';
import { Sidebar } from '../components/Sidebar';
import { GamesService } from '../lib/gamesService';
import { Game, GameCategory } from '../types/games';
import { 
  Search, 
  Plus, 
  Play, 
  Star, 
  Users, 
  Filter,
  Gamepad2,
  TrendingUp,
  Award
} from 'lucide-react';
import { GameCard } from '../components/games/GameCard';
import { CreateGameModal } from '../components/games/CreateGameModal';
import { GamePlayerModal } from '../components/games/GamePlayerModal';
import { useNavigate } from 'react-router-dom';

const categories: { value: GameCategory; label: string }[] = [
  { value: 'action', label: 'Екшн' },
  { value: 'puzzle', label: 'Головоломки' },
  { value: 'strategy', label: 'Стратегія' },
  { value: 'arcade', label: 'Аркада' },
  { value: 'adventure', label: 'Пригоди' },
  { value: 'simulation', label: 'Симулятори' },
  { value: 'sports', label: 'Спорт' },
  { value: 'racing', label: 'Гонки' },
  { value: 'other', label: 'Інше' },
];

export function Games() {
  const [games, setGames] = useState<Game[]>([]);
  const [popularGames, setPopularGames] = useState<Game[]>([]);
  const [topRatedGames, setTopRatedGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<GameCategory | ''>('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'popular' | 'top-rated'>('all');
  const navigate = useNavigate();

  useEffect(() => {
    loadGames();
    loadPopularGames();
    loadTopRatedGames();
  }, []);

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      loadGames();
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [searchQuery, selectedCategory]);

  const loadGames = async () => {
    try {
      setLoading(true);
      const gamesList = await GamesService.getAllGames(
        selectedCategory as GameCategory, 
        searchQuery
      );
      setGames(gamesList);
    } catch (error) {
      console.error('Error loading games:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadPopularGames = async () => {
    try {
      const popular = await GamesService.getPopularGames(6);
      setPopularGames(popular);
    } catch (error) {
      console.error('Error loading popular games:', error);
    }
  };

  const loadTopRatedGames = async () => {
    try {
      const topRated = await GamesService.getTopRatedGames(6);
      setTopRatedGames(topRated);
    } catch (error) {
      console.error('Error loading top rated games:', error);
    }
  };

  const handleCreateGame = async (gameData: {
    title: string;
    description: string;
    thumbnail?: string;
    game_url: string;
    category: GameCategory;
  }) => {
    const newGame = await GamesService.createGame(gameData);
    if (newGame) {
      setGames(prev => [newGame, ...prev]);
      setShowCreateModal(false);
    }
  };

  const handlePlayGame = (game: Game) => {
    setSelectedGame(game);
  };

  const getCurrentGames = () => {
    switch (activeTab) {
      case 'popular':
        return popularGames;
      case 'top-rated':
        return topRatedGames;
      default:
        return games;
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 ml-64 p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center">
              <Gamepad2 className="h-8 w-8 text-blue-600 mr-3" />
              <h1 className="text-3xl font-bold text-gray-900">Ігри</h1>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus size={20} className="mr-2" />
              Додати гру
            </button>
          </div>

          {/* Tabs */}
          <div className="flex space-x-1 mb-6 bg-gray-100 p-1 rounded-lg w-fit">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'all'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Всі ігри
            </button>
            <button
              onClick={() => setActiveTab('popular')}
              className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'popular'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <TrendingUp size={16} className="mr-1" />
              Популярні
            </button>
            <button
              onClick={() => setActiveTab('top-rated')}
              className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'top-rated'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Award size={16} className="mr-1" />
              Найкращі
            </button>
          </div>

          {/* Search and Filters - only show for 'all' tab */}
          {activeTab === 'all' && (
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Пошук ігор..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value as GameCategory)}
                  className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="">Всі категорії</option>
                  {categories.map((category) => (
                    <option key={category.value} value={category.value}>
                      {category.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Games Grid */}
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Завантаження ігор...</p>
            </div>
          ) : getCurrentGames().length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {getCurrentGames().map((game) => (
                <GameCard
                  key={game.id}
                  game={game}
                  onPlay={() => handlePlayGame(game)}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Gamepad2 className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                {searchQuery || selectedCategory ? 'Ігри не знайдено' : 'Немає ігор'}
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchQuery || selectedCategory
                  ? 'Спробуйте змінити пошуковий запит або фільтр'
                  : 'Додайте першу гру для спільноти'
                }
              </p>
              {!searchQuery && !selectedCategory && (
                <div className="mt-6">
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                  >
                    <Plus className="-ml-1 mr-2 h-5 w-5" />
                    Додати гру
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {showCreateModal && (
        <CreateGameModal
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreateGame}
        />
      )}

      {selectedGame && (
        <GamePlayerModal
          game={selectedGame}
          onClose={() => setSelectedGame(null)}
        />
      )}
    </div>
  );
}