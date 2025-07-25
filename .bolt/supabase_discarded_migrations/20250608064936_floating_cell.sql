/*
  # Fix users table structure and dependencies

  1. Changes to users table
    - Fix data types for foreign key relationships
    - Update column types to match application expectations
    - Add missing constraints

  2. Security
    - Update RLS policies to work with correct data types
    - Ensure proper user identification

  3. Data consistency
    - Fix any type mismatches between auth.users and public.users
*/

-- First, let's check if we need to update the users table structure
-- Update users table to use UUID for id to match auth.users
DO $$
BEGIN
  -- Check if id column is not UUID type
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' 
    AND column_name = 'id' 
    AND data_type != 'uuid'
  ) THEN
    -- Drop existing foreign key constraints
    ALTER TABLE IF EXISTS media DROP CONSTRAINT IF EXISTS media_user_id_fkey;
    ALTER TABLE IF EXISTS friends DROP CONSTRAINT IF EXISTS friends_user_id_fkey;
    ALTER TABLE IF EXISTS friends DROP CONSTRAINT IF EXISTS friends_friend_id_fkey;
    
    -- Change id column to UUID and set it as primary key
    ALTER TABLE users DROP CONSTRAINT IF EXISTS users_pkey;
    ALTER TABLE users ALTER COLUMN id TYPE uuid USING gen_random_uuid();
    ALTER TABLE users ADD PRIMARY KEY (id);
    
    -- Update media table to use UUID
    ALTER TABLE IF EXISTS media ALTER COLUMN user_id TYPE uuid USING gen_random_uuid();
    
    -- Update friends table to use UUID
    ALTER TABLE IF EXISTS friends ALTER COLUMN user_id TYPE uuid USING gen_random_uuid();
    ALTER TABLE IF EXISTS friends ALTER COLUMN friend_id TYPE uuid USING gen_random_uuid();
    
    -- Recreate foreign key constraints
    ALTER TABLE media ADD CONSTRAINT media_user_id_fkey 
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
    ALTER TABLE friends ADD CONSTRAINT friends_user_id_fkey 
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
    ALTER TABLE friends ADD CONSTRAINT friends_friend_id_fkey 
      FOREIGN KEY (friend_id) REFERENCES users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Ensure users table has all required columns with correct types
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS lastName text DEFAULT '',
ADD COLUMN IF NOT EXISTS bio text DEFAULT '',
ADD COLUMN IF NOT EXISTS city text DEFAULT '',
ADD COLUMN IF NOT EXISTS birthDate date,
ADD COLUMN IF NOT EXISTS avatar text,
ADD COLUMN IF NOT EXISTS date timestamptz DEFAULT now(),
ADD COLUMN IF NOT EXISTS notifications jsonb DEFAULT '{"email": true, "messages": true, "friendRequests": true}'::jsonb,
ADD COLUMN IF NOT EXISTS privacy jsonb DEFAULT '{"profileVisibility": "public", "showBirthDate": true, "showEmail": false}'::jsonb;

-- Update RLS policies to use correct UUID comparison
DROP POLICY IF EXISTS "Users can view their own media" ON media;
DROP POLICY IF EXISTS "Users can insert their own media" ON media;
DROP POLICY IF EXISTS "Users can delete their own media" ON media;
DROP POLICY IF EXISTS "Users can view their friends" ON friends;
DROP POLICY IF EXISTS "Users can add friends" ON friends;
DROP POLICY IF EXISTS "Users can remove friends" ON friends;

-- Recreate media policies with proper UUID handling
CREATE POLICY "Users can view their own media"
  ON media
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = media.user_id 
      AND users.email = auth.jwt() ->> 'email'
    )
  );

CREATE POLICY "Users can insert their own media"
  ON media
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = media.user_id 
      AND users.email = auth.jwt() ->> 'email'
    )
  );

CREATE POLICY "Users can delete their own media"
  ON media
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = media.user_id 
      AND users.email = auth.jwt() ->> 'email'
    )
  );

-- Recreate friends policies with proper UUID handling
CREATE POLICY "Users can view their friends"
  ON friends
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE (users.id = friends.user_id OR users.id = friends.friend_id)
      AND users.email = auth.jwt() ->> 'email'
    )
  );

CREATE POLICY "Users can add friends"
  ON friends
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = friends.user_id 
      AND users.email = auth.jwt() ->> 'email'
    )
  );

CREATE POLICY "Users can remove friends"
  ON friends
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE (users.id = friends.user_id OR users.id = friends.friend_id)
      AND users.email = auth.jwt() ->> 'email'
    )
  );

-- Add RLS policy for users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile"
  ON users
  FOR SELECT
  TO authenticated
  USING (email = auth.jwt() ->> 'email');

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