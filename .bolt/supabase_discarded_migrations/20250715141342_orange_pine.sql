/*
  # Fix registration issues

  1. Database Structure
    - Ensure users table has proper structure for registration
    - Fix any missing columns or constraints
    - Update RLS policies for registration

  2. Security
    - Allow user registration through proper policies
    - Ensure new users can create their profiles
*/

-- Ensure users table exists with all required columns
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  name text DEFAULT '',
  lastName text DEFAULT '',
  bio text DEFAULT '',
  city text DEFAULT '',
  birthDate date,
  avatar text,
  date timestamptz DEFAULT now(),
  notifications jsonb DEFAULT '{"email": true, "messages": true, "friendRequests": true}'::jsonb,
  privacy jsonb DEFAULT '{"profileVisibility": "public", "showBirthDate": true, "showEmail": false}'::jsonb
);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to recreate them
DROP POLICY IF EXISTS "Users can view their own profile" ON users;
DROP POLICY IF EXISTS "Users can view public profiles" ON users;
DROP POLICY IF EXISTS "Users can update their own profile" ON users;
DROP POLICY IF EXISTS "Users can insert their own profile" ON users;
DROP POLICY IF EXISTS "Allow registration" ON users;

-- Create policies that allow registration and profile management
CREATE POLICY "Users can insert their own profile"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (true); -- Allow any authenticated user to create a profile

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
    email = auth.jwt() ->> 'email'
  );

CREATE POLICY "Users can update their own profile"
  ON users
  FOR UPDATE
  TO authenticated
  USING (email = auth.jwt() ->> 'email')
  WITH CHECK (email = auth.jwt() ->> 'email');

-- Ensure unique index on email
CREATE UNIQUE INDEX IF NOT EXISTS users_email_unique_idx ON users(email);

-- Create or update media table
CREATE TABLE IF NOT EXISTS media (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('photo', 'video')),
  url text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create or update friends table
CREATE TABLE IF NOT EXISTS friends (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  friend_id uuid REFERENCES users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, friend_id)
);

-- Enable RLS on related tables
ALTER TABLE media ENABLE ROW LEVEL SECURITY;
ALTER TABLE friends ENABLE ROW LEVEL SECURITY;

-- Media policies
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

-- Friends policies
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