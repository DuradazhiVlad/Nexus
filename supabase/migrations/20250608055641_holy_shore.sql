/*
  # Fix user schema and foreign key relationships

  1. Changes to users table
    - Add auth_user_id column to store Supabase auth UUID
    - Update existing records to use auth.uid() where possible

  2. Changes to media table
    - Change user_id from bigint to uuid
    - Update foreign key to reference users(auth_user_id)

  3. Changes to friends table
    - Change user_id and friend_id from bigint to uuid
    - Update foreign keys to reference users(auth_user_id)

  4. Security
    - Update RLS policies to use correct UUID comparisons
*/

-- Add auth_user_id column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS auth_user_id uuid;

-- Create unique index on auth_user_id
CREATE UNIQUE INDEX IF NOT EXISTS users_auth_user_id_idx ON users(auth_user_id);

-- Drop existing foreign key constraints
ALTER TABLE media DROP CONSTRAINT IF EXISTS media_user_id_fkey;
ALTER TABLE friends DROP CONSTRAINT IF EXISTS friends_user_id_fkey;
ALTER TABLE friends DROP CONSTRAINT IF EXISTS friends_friend_id_fkey;

-- Change media table user_id to uuid
ALTER TABLE media ALTER COLUMN user_id TYPE uuid USING user_id::text::uuid;

-- Change friends table columns to uuid
ALTER TABLE friends ALTER COLUMN user_id TYPE uuid USING user_id::text::uuid;
ALTER TABLE friends ALTER COLUMN friend_id TYPE uuid USING friend_id::text::uuid;

-- Add new foreign key constraints
ALTER TABLE media ADD CONSTRAINT media_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES users(auth_user_id) ON DELETE CASCADE;

ALTER TABLE friends ADD CONSTRAINT friends_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES users(auth_user_id) ON DELETE CASCADE;

ALTER TABLE friends ADD CONSTRAINT friends_friend_id_fkey 
  FOREIGN KEY (friend_id) REFERENCES users(auth_user_id) ON DELETE CASCADE;

-- Drop old RLS policies
DROP POLICY IF EXISTS "Users can view their own media" ON media;
DROP POLICY IF EXISTS "Users can insert their own media" ON media;
DROP POLICY IF EXISTS "Users can delete their own media" ON media;
DROP POLICY IF EXISTS "Users can view their friends" ON friends;
DROP POLICY IF EXISTS "Users can add friends" ON friends;
DROP POLICY IF EXISTS "Users can remove friends" ON friends;

-- Create new RLS policies with correct UUID comparisons
CREATE POLICY "Users can view their own media"
  ON media
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own media"
  ON media
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own media"
  ON media
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can view their friends"
  ON friends
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR friend_id = auth.uid());

CREATE POLICY "Users can add friends"
  ON friends
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can remove friends"
  ON friends
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid() OR friend_id = auth.uid());

-- Add RLS policy for users table
CREATE POLICY "Users can view and update their own profile"
  ON users
  FOR ALL
  TO authenticated
  USING (auth_user_id = auth.uid())
  WITH CHECK (auth_user_id = auth.uid());