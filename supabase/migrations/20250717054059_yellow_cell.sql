/*
  # Fix Groups RLS Policy with Users Reference

  1. Security Changes
    - Drop existing INSERT policies that may be blocking group creation
    - Create new INSERT policy that properly references users table
    - Policy allows authenticated users to create groups where created_by matches their user record

  2. Policy Logic
    - Uses auth.uid() to get current authenticated user ID
    - References users table to match auth_user_id with created_by field
    - Ensures users can only create groups under their own user record
*/

-- Drop existing INSERT policies for groups table
DROP POLICY IF EXISTS "Allow authenticated users to create groups" ON groups;
DROP POLICY IF EXISTS "Users can create groups" ON groups;
DROP POLICY IF EXISTS "Allow insert own groups" ON groups;

-- Create new INSERT policy that properly references users table
CREATE POLICY "Allow authenticated users to create groups"
  ON groups
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = (
      SELECT auth_user_id 
      FROM public.users 
      WHERE id = created_by
    )
  );

-- Ensure RLS is enabled
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;