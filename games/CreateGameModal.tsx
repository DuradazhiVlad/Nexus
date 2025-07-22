import React, { useState } from 'react';
import { X, Upload, Link as LinkIcon } from 'lucide-react';
import { GameCategory } from '../../types/games';

interface CreateGameModalProps {
  onClose: () => void;
  onSubmit: (gameData: {
    title: string;
    description: string;
    thumbnail?: string;
    game_url: string;
    category: GameCategory;
  }) => void;
}

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

export function CreateGameModal({ onClose, onSubmit }: CreateGameModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [thumbnail, setThumbnail] = useState('');
  const [gameUrl, setGameUrl] = useState('');
  const [category, setCategory] = useState<GameCategory>('other');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !gameUrl.trim()) return;

    setLoading(true);
    try {
      await onSubmit({
        title: title.trim(),
        description: description.trim(),
        thumbnail: thumbnail.trim() || undefined,
        game_url: gameUrl.trim(),
        category,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Додати нову гру</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Назва гри *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Введіть назву гри"
              required
              maxLength={100}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Опис гри
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Розкажіть про вашу гру..."
              maxLength={500}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Категорія *
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as GameCategory)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              {categories.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              URL гри *
            </label>
            <div className="relative">
              <LinkIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="url"
                value={gameUrl}
                onChange={(e) => setGameUrl(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="https://example.com/game.html"
                required
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Посилання на HTML файл гри або веб-сторінку з грою
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Зображення гри (URL)
            </label>
            <div className="relative">
              <Upload className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="url"
                value={thumbnail}
                onChange={(e) => setThumbnail(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="https://example.com/thumbnail.jpg"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Посилання на зображення-превью гри (необов'язково)
            </p>
          </div>

          {thumbnail && (
            <div className="mt-4">
              <p className="text-sm font-medium text-gray-700 mb-2">Превью:</p>
              <img
                src={thumbnail}
                alt="Game thumbnail preview"
                className="w-full h-32 object-cover rounded-lg"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Скасувати
            </button>
            <button
              type="submit"
              disabled={loading || !title.trim() || !gameUrl.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Додавання...' : 'Додати гру'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}