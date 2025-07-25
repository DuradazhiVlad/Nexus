/*
  # Update users table and create related tables

  1. Changes to users table
    - Add new columns for profile information:
      - bio (text)
      - city (text)
      - birthDate (date)
      - avatar (text)
      - notifications (jsonb)
      - privacy (jsonb)

  2. New Tables
    - media
      - id (uuid, primary key)
      - user_id (bigint, foreign key)
      - type (text)
      - url (text)
      - created_at (timestamp)
    
    - friends
      - id (uuid, primary key)
      - user_id (bigint, foreign key)
      - friend_id (bigint, foreign key)
      - created_at (timestamp)

  3. Security
    - Enable RLS on new tables
    - Add policies for authenticated users
*/

-- Update users table with new columns
ALTER TABLE users
ADD COLUMN IF NOT EXISTS bio text DEFAULT '',
ADD COLUMN IF NOT EXISTS city text DEFAULT '',
ADD COLUMN IF NOT EXISTS birthDate date,
ADD COLUMN IF NOT EXISTS avatar text,
ADD COLUMN IF NOT EXISTS notifications jsonb DEFAULT '{"email": true, "messages": true, "friendRequests": true}'::jsonb,
ADD COLUMN IF NOT EXISTS privacy jsonb DEFAULT '{"profileVisibility": "public", "showBirthDate": true, "showEmail": false}'::jsonb;

-- Create media table
CREATE TABLE IF NOT EXISTS media (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id bigint REFERENCES users(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('photo', 'video')),
  url text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create friends table
CREATE TABLE IF NOT EXISTS friends (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id bigint REFERENCES users(id) ON DELETE CASCADE,
  friend_id bigint REFERENCES users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, friend_id)
);

-- Enable RLS
ALTER TABLE media ENABLE ROW LEVEL SECURITY;
ALTER TABLE friends ENABLE ROW LEVEL SECURITY;

-- Media policies
CREATE POLICY "Users can view their own media"
  ON media
  FOR SELECT
  TO authenticated
  USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can insert their own media"
  ON media
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can delete their own media"
  ON media
  FOR DELETE
  TO authenticated
  USING (auth.uid()::text = user_id::text);

-- Friends policies
CREATE POLICY "Users can view their friends"
  ON friends
  FOR SELECT
  TO authenticated
  USING (auth.uid()::text = user_id::text OR auth.uid()::text = friend_id::text);

CREATE POLICY "Users can add friends"
  ON friends
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can remove friends"
  ON friends
  FOR DELETE
  TO authenticated
  USING (auth.uid()::text = user_id::text OR auth.uid()::text = friend_id::text);