/*
  # Fix groups table RLS policy for INSERT operations

  1. Security
    - Drop existing problematic INSERT policy for groups table
    - Create new INSERT policy allowing authenticated users to create groups
    - Ensure created_by field matches authenticated user ID
    - Keep existing SELECT and UPDATE policies intact
*/

-- Drop existing INSERT policy if it exists
DROP POLICY IF EXISTS "Authenticated users can create groups" ON groups;
DROP POLICY IF EXISTS "Users can create groups" ON groups;

-- Create new INSERT policy for groups
CREATE POLICY "Allow authenticated users to create groups"
  ON groups
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

-- Ensure RLS is enabled
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;