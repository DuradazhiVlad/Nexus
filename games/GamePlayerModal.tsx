import React, { useState, useEffect } from 'react';
import { X, Star, MessageSquare, RotateCcw, Maximize2, Play } from 'lucide-react';
import { Game, GameRating } from '../../types/games';
import { GamesService } from '../lib/gamesService';

interface GamePlayerModalProps {
  game: Game;
  onClose: () => void;
}

export function GamePlayerModal({ game, onClose }: GamePlayerModalProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [userRating, setUserRating] = useState<GameRating | null>(null);
  const [ratings, setRatings] = useState<GameRating[]>([]);
  const [newRating, setNewRating] = useState(0);
  const [newReview, setNewReview] = useState('');
  const [showRatingForm, setShowRatingForm] = useState(false);
  const [gameStartTime] = useState(Date.now());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadRatings();
    loadUserRating();
    recordGamePlay();
  }, [game.id]);

  const loadRatings = async () => {
    const gameRatings = await GamesService.getGameRatings(game.id);
    setRatings(gameRatings);
  };

  const loadUserRating = async () => {
    const rating = await GamesService.getUserGameRating(game.id);
    setUserRating(rating);
    if (rating) {
      setNewRating(rating.rating);
      setNewReview(rating.review);
    }
  };

  const recordGamePlay = async () => {
    await GamesService.recordGamePlay(game.id);
  };

  const handleRatingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newRating === 0) return;

    setLoading(true);
    const success = await GamesService.rateGame(game.id, newRating, newReview);
    if (success) {
      await loadRatings();
      await loadUserRating();
      setShowRatingForm(false);
    }
    setLoading(false);
  };

  const handleClose = async () => {
    // Record play duration
    const duration = Math.floor((Date.now() - gameStartTime) / 1000);
    if (duration > 10) { // Only record if played for more than 10 seconds
      await GamesService.recordGamePlay(game.id, duration);
    }
    onClose();
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const renderStars = (rating: number, interactive: boolean = false, onRate?: (rating: number) => void) => {
    return (
      <div className="flex">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type={interactive ? 'button' : undefined}
            onClick={interactive && onRate ? () => onRate(star) : undefined}
            className={`${interactive ? 'cursor-pointer hover:scale-110' : 'cursor-default'} transition-transform`}
            disabled={!interactive}
          >
            <Star
              size={20}
              className={`${
                star <= rating
                  ? 'text-yellow-400 fill-current'
                  : 'text-gray-300'
              }`}
            />
          </button>
        ))}
      </div>
    );
  };

  return (
    <div className={`fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 ${isFullscreen ? 'p-0' : 'p-4'}`}>
      <div className={`bg-white rounded-lg shadow-xl ${isFullscreen ? 'w-full h-full rounded-none' : 'w-full max-w-6xl h-[90vh]'} flex flex-col`}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center">
            <h2 className="text-xl font-semibold text-gray-900 mr-4">{game.title}</h2>
            <div className="flex items-center text-sm text-gray-600">
              <Star size={16} className="mr-1 text-yellow-400 fill-current" />
              <span>{game.rating.toFixed(1)} ({ratings.length} відгуків)</span>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={toggleFullscreen}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
              title={isFullscreen ? 'Вийти з повноекранного режиму' : 'Повноекранний режим'}
            >
              <Maximize2 size={20} />
            </button>
            <button
              onClick={() => window.location.reload()}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
              title="Перезапустити гру"
            >
              <RotateCcw size={20} />
            </button>
            <button
              onClick={handleClose}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Game Content */}
        <div className="flex-1 flex">
          {/* Game Frame */}
          <div className="flex-1 bg-gray-100">
            <iframe
              src={game.game_url}
              className="w-full h-full border-0"
              title={game.title}
              allowFullScreen
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-pointer-lock"
            />
          </div>

          {/* Sidebar - hide in fullscreen */}
          {!isFullscreen && (
            <div className="w-80 border-l border-gray-200 bg-gray-50 overflow-y-auto">
              <div className="p-4 space-y-6">
                {/* Game Info */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Про гру</h3>
                  <p className="text-sm text-gray-600 mb-3">
                    {game.description || 'Немає опису'}
                  </p>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Розробник:</span>
                      <span className="text-gray-900">
                        {game.developer?.name} {game.developer?.lastName}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Категорія:</span>
                      <span className="text-gray-900">{game.category}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Зіграно:</span>
                      <span className="text-gray-900">{game.play_count} разів</span>
                    </div>
                  </div>
                </div>

                {/* Rating Section */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-gray-900">Оцінка</h3>
                    {!userRating && (
                      <button
                        onClick={() => setShowRatingForm(true)}
                        className="text-sm text-blue-600 hover:text-blue-700"
                      >
                        Оцінити
                      </button>
                    )}
                  </div>

                  {showRatingForm && (
                    <form onSubmit={handleRatingSubmit} className="mb-4 p-3 bg-white rounded-lg border">
                      <div className="mb-3">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Ваша оцінка:
                        </label>
                        {renderStars(newRating, true, setNewRating)}
                      </div>
                      <div className="mb-3">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Відгук (необов'язково):
                        </label>
                        <textarea
                          value={newReview}
                          onChange={(e) => setNewReview(e.target.value)}
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Поділіться враженнями від гри..."
                        />
                      </div>
                      <div className="flex justify-end space-x-2">
                        <button
                          type="button"
                          onClick={() => setShowRatingForm(false)}
                          className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
                        >
                          Скасувати
                        </button>
                        <button
                          type="submit"
                          disabled={loading || newRating === 0}
                          className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50"
                        >
                          {loading ? 'Збереження...' : 'Зберегти'}
                        </button>
                      </div>
                    </form>
                  )}

                  {userRating && (
                    <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-900">Ваша оцінка:</span>
                        <button
                          onClick={() => setShowRatingForm(true)}
                          className="text-sm text-blue-600 hover:text-blue-700"
                        >
                          Змінити
                        </button>
                      </div>
                      {renderStars(userRating.rating)}
                      {userRating.review && (
                        <p className="text-sm text-gray-600 mt-2">{userRating.review}</p>
                      )}
                    </div>
                  )}
                </div>

                {/* Reviews */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                    <MessageSquare size={18} className="mr-2" />
                    Відгуки ({ratings.length})
                  </h3>
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {ratings.length > 0 ? (
                      ratings.map((rating) => (
                        <div key={rating.id} className="p-3 bg-white rounded-lg border">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center">
                              <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center mr-2">
                                {rating.user?.avatar ? (
                                  <img
                                    src={rating.user.avatar}
                                    alt={rating.user.name}
                                    className="w-full h-full rounded-full object-cover"
                                  />
                                ) : (
                                  <span className="text-xs text-gray-600">
                                    {rating.user?.name?.[0]?.toUpperCase()}
                                  </span>
                                )}
                              </div>
                              <span className="text-sm font-medium text-gray-900">
                                {rating.user?.name} {rating.user?.lastName}
                              </span>
                            </div>
                            {renderStars(rating.rating)}
                          </div>
                          {rating.review && (
                            <p className="text-sm text-gray-600">{rating.review}</p>
                          )}
                          <p className="text-xs text-gray-400 mt-2">
                            {new Date(rating.created_at).toLocaleDateString('uk-UA')}
                          </p>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-gray-500 text-center py-4">
                        Поки немає відгуків
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}