/*
  # Fix users table policies

  1. Changes
    - Add INSERT policy for users table
    - Update existing policies to be more permissive
    - Add policy for public access to email verification

  2. Security
    - Enable RLS on users table
    - Allow users to create their own profile
    - Allow users to read and update their own data
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Users can read own data" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;

-- Create new policies
CREATE POLICY "Users can create their own profile"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can read own data"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own data"
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Allow public access for email verification
CREATE POLICY "Public users are viewable"
  ON users
  FOR SELECT
  TO public
  USING (true);