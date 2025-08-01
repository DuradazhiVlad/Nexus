/*
  # Fix users table RLS policy for registration

  1. Security Updates
    - Drop existing problematic INSERT policy
    - Create new INSERT policy that allows users to create their own profile
    - Ensure policy allows insertion when auth_user_id matches authenticated user ID
    - Keep existing policies for SELECT and UPDATE operations
*/

-- Drop existing INSERT policy if it exists
DROP POLICY IF EXISTS "Users can insert their own profile" ON users;

-- Create new INSERT policy that allows authenticated users to insert their own profile
CREATE POLICY "Users can insert their own profile"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (auth_user_id = auth.uid());

-- Ensure RLS is enabled
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Verify other policies exist and are correct
DO $$
BEGIN
  -- Check if SELECT policy exists, if not create it
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'users' 
    AND policyname = 'Users can view their own profile'
  ) THEN
    CREATE POLICY "Users can view their own profile"
      ON users
      FOR SELECT
      TO authenticated
      USING (auth_user_id = auth.uid());
  END IF;

  -- Check if UPDATE policy exists, if not create it
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'users' 
    AND policyname = 'Users can update their own profile'
  ) THEN
    CREATE POLICY "Users can update their own profile"
      ON users
      FOR UPDATE
      TO authenticated
      USING (auth_user_id = auth.uid());
  END IF;
END $$;