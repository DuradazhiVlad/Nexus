export interface Game {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  category: GameCategory;
  players: number;
  rating: number;
  url: string;
  gameType: 'web' | 'download';
  size?: string;
  requirements?: string[];
  tags: string[];
  isMultiplayer: boolean;
  developer: string;
  createdAt: string;
}

export interface GameRating {
  id: string;
  gameId: string;
  userId: string;
  rating: number;
  comment?: string;
  createdAt: string;
}

export type GameCategory = 
  | 'Аркада'
  | 'Головоломки'
  | 'Спорт'
  | 'Стратегія'
  | 'Пригоди'
  | 'Гонки'
  | 'Шутери'
  | 'RPG'
  | 'Симулятори'
  | 'Інше';