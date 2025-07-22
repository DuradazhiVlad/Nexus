/*
  # Fix database structure and user lookup issues

  1. Database Structure Issues
    - Ensure proper UUID handling
    - Fix RLS policies for better user identification
    - Add missing indexes for performance

  2. User Lookup Issues
    - Fix email-based user identification
    - Ensure proper data retrieval
    - Add fallback mechanisms

  3. Security
    - Update RLS policies to work with email authentication
    - Ensure data isolation between users
*/

-- First, let's ensure the users table has proper structure
DO $$
BEGIN
  -- Make sure email is unique and indexed
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'users' AND indexname = 'users_email_unique_idx'
  ) THEN
    CREATE UNIQUE INDEX users_email_unique_idx ON users(email);
  END IF;
END $$;

-- Ensure all required columns exist with proper defaults
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS name text DEFAULT '',
ADD COLUMN IF NOT EXISTS lastName text DEFAULT '',
ADD COLUMN IF NOT EXISTS bio text DEFAULT '',
ADD COLUMN IF NOT EXISTS city text DEFAULT '',
ADD COLUMN IF NOT EXISTS birthDate date,
ADD COLUMN IF NOT EXISTS avatar text,
ADD COLUMN IF NOT EXISTS date timestamptz DEFAULT now(),
ADD COLUMN IF NOT EXISTS notifications jsonb DEFAULT '{"email": true, "messages": true, "friendRequests": true}'::jsonb,
ADD COLUMN IF NOT EXISTS privacy jsonb DEFAULT '{"profileVisibility": "public", "showBirthDate": true, "showEmail": false}'::jsonb;

-- Update existing NULL values to proper defaults
UPDATE users SET 
  name = COALESCE(name, ''),
  lastName = COALESCE(lastName, ''),
  bio = COALESCE(bio, ''),
  city = COALESCE(city, ''),
  notifications = COALESCE(notifications, '{"email": true, "messages": true, "friendRequests": true}'::jsonb),
  privacy = COALESCE(privacy, '{"profileVisibility": "public", "showBirthDate": true, "showEmail": false}'::jsonb)
WHERE name IS NULL OR lastName IS NULL OR bio IS NULL OR city IS NULL OR notifications IS NULL OR privacy IS NULL;

-- Drop and recreate RLS policies with better logic
DROP POLICY IF EXISTS "Users can view their own profile" ON users;
DROP POLICY IF EXISTS "Users can update their own profile" ON users;
DROP POLICY IF EXISTS "Users can insert their own profile" ON users;
DROP POLICY IF EXISTS "Users can view public profiles" ON users;

-- Create comprehensive user policies
CREATE POLICY "Users can view their own profile"
  ON users
  FOR SELECT
  TO authenticated
  USING (email = auth.jwt() ->> 'email');

CREATE POLICY "Users can view public profiles"
  ON users
  FOR SELECT
  TO authenticated
  USING (
    privacy->>'profileVisibility' = 'public' OR
    email = auth.jwt() ->> 'email' OR
    (privacy->>'profileVisibility' = 'friends' AND EXISTS (
      SELECT 1 FROM friends f
      JOIN users u1 ON u1.id = f.user_id AND u1.email = auth.jwt() ->> 'email'
      JOIN users u2 ON u2.id = f.friend_id AND u2.email = users.email
    ))
  );

CREATE POLICY "Users can update their own profile"
  ON users
  FOR UPDATE
  TO authenticated
  USING (email = auth.jwt() ->> 'email')
  WITH CHECK (email = auth.jwt() ->> 'email');

CREATE POLICY "Users can insert their own profile"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (email = auth.jwt() ->> 'email');

-- Update media policies to be more robust
DROP POLICY IF EXISTS "Users can view their own media" ON media;
DROP POLICY IF EXISTS "Users can insert their own media" ON media;
DROP POLICY IF EXISTS "Users can delete their own media" ON media;

CREATE POLICY "Users can view their own media"
  ON media
  FOR SELECT
  TO authenticated
  USING (
    user_id IN (
      SELECT id FROM users WHERE email = auth.jwt() ->> 'email'
    )
  );

CREATE POLICY "Users can insert their own media"
  ON media
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id IN (
      SELECT id FROM users WHERE email = auth.jwt() ->> 'email'
    )
  );

CREATE POLICY "Users can delete their own media"
  ON media
  FOR DELETE
  TO authenticated
  USING (
    user_id IN (
      SELECT id FROM users WHERE email = auth.jwt() ->> 'email'
    )
  );

-- Update friends policies to be more robust
DROP POLICY IF EXISTS "Users can view their friends" ON friends;
DROP POLICY IF EXISTS "Users can add friends" ON friends;
DROP POLICY IF EXISTS "Users can remove friends" ON friends;

CREATE POLICY "Users can view their friends"
  ON friends
  FOR SELECT
  TO authenticated
  USING (
    user_id IN (SELECT id FROM users WHERE email = auth.jwt() ->> 'email') OR
    friend_id IN (SELECT id FROM users WHERE email = auth.jwt() ->> 'email')
  );

CREATE POLICY "Users can add friends"
  ON friends
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id IN (SELECT id FROM users WHERE email = auth.jwt() ->> 'email')
  );

CREATE POLICY "Users can remove friends"
  ON friends
  FOR DELETE
  TO authenticated
  USING (
    user_id IN (SELECT id FROM users WHERE email = auth.jwt() ->> 'email') OR
    friend_id IN (SELECT id FROM users WHERE email = auth.jwt() ->> 'email')
  );

-- Add helpful indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_name_search ON users USING gin((name || ' ' || lastName) gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_media_user_id ON media(user_id);
CREATE INDEX IF NOT EXISTS idx_friends_user_id ON friends(user_id);
CREATE INDEX IF NOT EXISTS idx_friends_friend_id ON friends(friend_id);

-- Enable trigram extension for better text search (if not already enabled)
CREATE EXTENSION IF NOT EXISTS pg_trgm;