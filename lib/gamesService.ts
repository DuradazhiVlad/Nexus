import { supabase } from '../src/lib/supabase';
import { DatabaseService } from './database';
import { Game, GameRating, GamePlay, GameCategory } from '../types/games';

export class GamesService {
  // Get all active games
  static async getAllGames(category?: GameCategory, searchQuery?: string): Promise<Game[]> {
    try {
      let query = supabase
        .from('games')
        .select(`
          *,
          developer:users!games_developer_id_fkey (
            name,
            lastName,
            avatar
          )
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (category && category !== 'other') {
        query = query.eq('category', category);
      }

      if (searchQuery && searchQuery.length >= 2) {
        query = query.ilike('title', `%${searchQuery}%`);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching games:', error);
      return [];
    }
  }

  // Get game by ID
  static async getGameById(gameId: string): Promise<Game | null> {
    try {
      const { data, error } = await supabase
        .from('games')
        .select(`
          *,
          developer:users!games_developer_id_fkey (
            name,
            lastName,
            avatar
          )
        `)
        .eq('id', gameId)
        .eq('is_active', true)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching game:', error);
      return null;
    }
  }

  // Create new game
  static async createGame(gameData: {
    title: string;
    description: string;
    thumbnail?: string;
    game_url: string;
    category: GameCategory;
  }): Promise<Game | null> {
    try {
      const currentUser = await DatabaseService.getCurrentUserProfile();
      if (!currentUser) return null;

      const { data: game, error } = await supabase
        .from('games')
        .insert([{
          ...gameData,
          developer_id: currentUser.id.toString(),
        }])
        .select(`
          *,
          developer:users!games_developer_id_fkey (
            name,
            lastName,
            avatar
          )
        `)
        .single();

      if (error) throw error;
      return game;
    } catch (error) {
      console.error('Error creating game:', error);
      return null;
    }
  }

  // Update game
  static async updateGame(gameId: string, updates: Partial<Game>): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('games')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', gameId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error updating game:', error);
      return false;
    }
  }

  // Delete game
  static async deleteGame(gameId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('games')
        .delete()
        .eq('id', gameId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting game:', error);
      return false;
    }
  }

  // Get games by developer
  static async getGamesByDeveloper(): Promise<Game[]> {
    try {
      const currentUser = await DatabaseService.getCurrentUserProfile();
      if (!currentUser) return [];

      const { data, error } = await supabase
        .from('games')
        .select(`
          *,
          developer:users!games_developer_id_fkey (
            name,
            lastName,
            avatar
          )
        `)
        .eq('developer_id', currentUser.id.toString())
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching developer games:', error);
      return [];
    }
  }

  // Record game play
  static async recordGamePlay(gameId: string, duration: number = 0): Promise<boolean> {
    try {
      const currentUser = await DatabaseService.getCurrentUserProfile();
      if (!currentUser) return false;

      const { error } = await supabase
        .from('game_plays')
        .insert([{
          game_id: gameId,
          user_id: currentUser.id.toString(),
          duration,
        }]);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error recording game play:', error);
      return false;
    }
  }

  // Rate game
  static async rateGame(gameId: string, rating: number, review: string = ''): Promise<boolean> {
    try {
      const currentUser = await DatabaseService.getCurrentUserProfile();
      if (!currentUser) return false;

      const { error } = await supabase
        .from('game_ratings')
        .upsert([{
          game_id: gameId,
          user_id: currentUser.id.toString(),
          rating,
          review,
        }]);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error rating game:', error);
      return false;
    }
  }

  // Get game ratings
  static async getGameRatings(gameId: string): Promise<GameRating[]> {
    try {
      const { data, error } = await supabase
        .from('game_ratings')
        .select(`
          *,
          user:users!game_ratings_user_id_fkey (
            name,
            lastName,
            avatar
          )
        `)
        .eq('game_id', gameId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching game ratings:', error);
      return [];
    }
  }

  // Get user's rating for a game
  static async getUserGameRating(gameId: string): Promise<GameRating | null> {
    try {
      const currentUser = await DatabaseService.getCurrentUserProfile();
      if (!currentUser) return null;

      const { data, error } = await supabase
        .from('game_ratings')
        .select('*')
        .eq('game_id', gameId)
        .eq('user_id', currentUser.id.toString())
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // No rating found
        }
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error fetching user game rating:', error);
      return null;
    }
  }

  // Get popular games
  static async getPopularGames(limit: number = 10): Promise<Game[]> {
    try {
      const { data, error } = await supabase
        .from('games')
        .select(`
          *,
          developer:users!games_developer_id_fkey (
            name,
            lastName,
            avatar
          )
        `)
        .eq('is_active', true)
        .order('play_count', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching popular games:', error);
      return [];
    }
  }

  // Get top rated games
  static async getTopRatedGames(limit: number = 10): Promise<Game[]> {
    try {
      const { data, error } = await supabase
        .from('games')
        .select(`
          *,
          developer:users!games_developer_id_fkey (
            name,
            lastName,
            avatar
          )
        `)
        .eq('is_active', true)
        .gt('rating', 0)
        .order('rating', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching top rated games:', error);
      return [];
    }
  }
}