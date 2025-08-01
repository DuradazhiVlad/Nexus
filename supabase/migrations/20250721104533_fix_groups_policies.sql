/*
  # Fix groups table RLS policies

  1. Problem
    - Groups policies are referencing 'users' table but should reference 'user_profiles'
    - This causes 400 Bad Request errors when querying groups
    - Need to align policies with actual table structure

  2. Solution
    - Update all groups policies to use user_profiles table
    - Ensure proper foreign key relationships
    - Fix any circular dependencies
*/

-- Drop existing policies on groups
DROP POLICY IF EXISTS "Anyone can view public groups" ON groups;
DROP POLICY IF EXISTS "Group members can view private groups" ON groups;
DROP POLICY IF EXISTS "Authenticated users can create groups" ON groups;
DROP POLICY IF EXISTS "Group creators can update their groups" ON groups;

-- Create new policies that work with user_profiles table
CREATE POLICY "Anyone can view public groups"
  ON groups
  FOR SELECT
  TO authenticated
  USING (NOT is_private);

CREATE POLICY "Group members can view private groups"
  ON groups
  FOR SELECT
  TO authenticated
  USING (
    is_private AND EXISTS (
      SELECT 1 FROM group_members gm
      JOIN user_profiles up ON up.id = gm.user_id
      WHERE gm.group_id = groups.id 
      AND up.auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Authenticated users can create groups"
  ON groups
  FOR INSERT
  TO authenticated
  WITH CHECK (
    created_by = (
      SELECT id FROM user_profiles WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Group creators can update their groups"
  ON groups
  FOR UPDATE
  TO authenticated
  USING (
    created_by = (
      SELECT id FROM user_profiles WHERE auth_user_id = auth.uid()
    )
  );

-- Ensure RLS is enabled
ALTER TABLE groups ENABLE ROW LEVEL SECURITY; 