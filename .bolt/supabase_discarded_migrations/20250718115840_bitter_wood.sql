/*
  # Create games system

  1. New Tables
    - games
      - id (uuid, primary key)
      - title (text)
      - description (text)
      - thumbnail (text)
      - game_url (text)
      - category (text)
      - developer_id (uuid, foreign key to users)
      - created_at (timestamp)
      - updated_at (timestamp)
      - is_active (boolean)
      - play_count (integer)
      - rating (numeric)
    
    - game_ratings
      - id (uuid, primary key)
      - game_id (uuid, foreign key to games)
      - user_id (uuid, foreign key to users)
      - rating (integer 1-5)
      - review (text)
      - created_at (timestamp)
    
    - game_plays
      - id (uuid, primary key)
      - game_id (uuid, foreign key to games)
      - user_id (uuid, foreign key to users)
      - played_at (timestamp)
      - duration (integer in seconds)

  2. Security
    - Enable RLS on all tables
    - Add policies for game access and management
*/

-- Create games table
CREATE TABLE IF NOT EXISTS games (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text DEFAULT '',
  thumbnail text,
  game_url text NOT NULL,
  category text DEFAULT 'other',
  developer_id uuid REFERENCES users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  is_active boolean DEFAULT true,
  play_count integer DEFAULT 0,
  rating numeric(3,2) DEFAULT 0.0
);

-- Create game_ratings table
CREATE TABLE IF NOT EXISTS game_ratings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id uuid REFERENCES games(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  rating integer CHECK (rating >= 1 AND rating <= 5),
  review text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  UNIQUE(game_id, user_id)
);

-- Create game_plays table
CREATE TABLE IF NOT EXISTS game_plays (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id uuid REFERENCES games(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  played_at timestamptz DEFAULT now(),
  duration integer DEFAULT 0
);

-- Enable RLS
ALTER TABLE games ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_plays ENABLE ROW LEVEL SECURITY;

-- Games policies
CREATE POLICY "Anyone can view active games"
  ON games
  FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "Developers can create games"
  ON games
  FOR INSERT
  TO authenticated
  WITH CHECK (
    developer_id IN (SELECT id FROM users WHERE email = auth.jwt() ->> 'email')
  );

CREATE POLICY "Developers can update their own games"
  ON games
  FOR UPDATE
  TO authenticated
  USING (
    developer_id IN (SELECT id FROM users WHERE email = auth.jwt() ->> 'email')
  )
  WITH CHECK (
    developer_id IN (SELECT id FROM users WHERE email = auth.jwt() ->> 'email')
  );

CREATE POLICY "Developers can delete their own games"
  ON games
  FOR DELETE
  TO authenticated
  USING (
    developer_id IN (SELECT id FROM users WHERE email = auth.jwt() ->> 'email')
  );

-- Game ratings policies
CREATE POLICY "Anyone can view game ratings"
  ON game_ratings
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can rate games"
  ON game_ratings
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id IN (SELECT id FROM users WHERE email = auth.jwt() ->> 'email')
  );

CREATE POLICY "Users can update their own ratings"
  ON game_ratings
  FOR UPDATE
  TO authenticated
  USING (
    user_id IN (SELECT id FROM users WHERE email = auth.jwt() ->> 'email')
  )
  WITH CHECK (
    user_id IN (SELECT id FROM users WHERE email = auth.jwt() ->> 'email')
  );

CREATE POLICY "Users can delete their own ratings"
  ON game_ratings
  FOR DELETE
  TO authenticated
  USING (
    user_id IN (SELECT id FROM users WHERE email = auth.jwt() ->> 'email')
  );

-- Game plays policies
CREATE POLICY "Users can view their own plays"
  ON game_plays
  FOR SELECT
  TO authenticated
  USING (
    user_id IN (SELECT id FROM users WHERE email = auth.jwt() ->> 'email')
  );

CREATE POLICY "Users can record their plays"
  ON game_plays
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id IN (SELECT id FROM users WHERE email = auth.jwt() ->> 'email')
  );

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_games_category ON games(category);
CREATE INDEX IF NOT EXISTS idx_games_developer_id ON games(developer_id);
CREATE INDEX IF NOT EXISTS idx_games_created_at ON games(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_games_play_count ON games(play_count DESC);
CREATE INDEX IF NOT EXISTS idx_games_rating ON games(rating DESC);
CREATE INDEX IF NOT EXISTS idx_game_ratings_game_id ON game_ratings(game_id);
CREATE INDEX IF NOT EXISTS idx_game_plays_game_id ON game_plays(game_id);
CREATE INDEX IF NOT EXISTS idx_game_plays_user_id ON game_plays(user_id);

-- Function to update game rating
CREATE OR REPLACE FUNCTION update_game_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE games 
  SET rating = (
    SELECT COALESCE(AVG(rating), 0) 
    FROM game_ratings 
    WHERE game_id = COALESCE(NEW.game_id, OLD.game_id)
  )
  WHERE id = COALESCE(NEW.game_id, OLD.game_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create trigger for rating updates
DROP TRIGGER IF EXISTS trigger_update_game_rating ON game_ratings;
CREATE TRIGGER trigger_update_game_rating
  AFTER INSERT OR UPDATE OR DELETE ON game_ratings
  FOR EACH ROW EXECUTE FUNCTION update_game_rating();

-- Function to update play count
CREATE OR REPLACE FUNCTION update_play_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE games 
  SET play_count = play_count + 1 
  WHERE id = NEW.game_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for play count updates
DROP TRIGGER IF EXISTS trigger_update_play_count ON game_plays;
CREATE TRIGGER trigger_update_play_count
  AFTER INSERT ON game_plays
  FOR EACH ROW EXECUTE FUNCTION update_play_count();