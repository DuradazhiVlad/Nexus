/*
  # Fix infinite recursion in group_members RLS policies

  1. Problem
    - RLS policies on group_members table are creating circular dependencies
    - Policies are referencing other tables that might reference back to group_members
    - This creates infinite recursion during SELECT operations

  2. Solution
    - Drop all existing RLS policies on group_members
    - Create simple, direct policies without complex subqueries
    - Use SECURITY DEFINER functions to bypass RLS when needed
    - Avoid any references to other tables that might create cycles

  3. Security
    - Users can only view memberships for groups they belong to
    - Users can only insert/delete their own memberships
    - No complex joins or subqueries that could cause recursion
*/

-- Drop all existing policies on group_members to start fresh
DROP POLICY IF EXISTS "Users can view group memberships" ON group_members;
DROP POLICY IF EXISTS "Users can join groups" ON group_members;
DROP POLICY IF EXISTS "Users can leave groups" ON group_members;
DROP POLICY IF EXISTS "Group members can view memberships" ON group_members;
DROP POLICY IF EXISTS "Users can insert their own membership" ON group_members;
DROP POLICY IF EXISTS "Users can delete their own membership" ON group_members;

-- Create a SECURITY DEFINER function to check if user is member of a group
-- This function bypasses RLS and can be used in policies
CREATE OR REPLACE FUNCTION is_member_of_group(_user_id uuid, _group_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM group_members gm
    WHERE gm.group_id = _group_id
    AND gm.user_id = _user_id
  );
$$;

-- Create simple, non-recursive policies
CREATE POLICY "Allow insert own membership"
  ON group_members
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = (
      SELECT id FROM user_profiles WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Allow view group memberships"
  ON group_members
  FOR SELECT
  TO authenticated
  USING (
    is_member_of_group(
      (SELECT id FROM user_profiles WHERE auth_user_id = auth.uid()),
      group_id
    )
  );

CREATE POLICY "Allow delete own membership"
  ON group_members
  FOR DELETE
  TO authenticated
  USING (
    user_id = (
      SELECT id FROM user_profiles WHERE auth_user_id = auth.uid()
    )
  );

-- Ensure RLS is enabled
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY; 