/*
  # Fix infinite recursion in group_members RLS policies

  1. Problem
    - RLS policies on group_members table are creating circular dependencies
    - Policies are referencing other tables that might reference back to group_members
    - This creates infinite recursion during INSERT operations

  2. Solution
    - Drop all existing RLS policies on group_members
    - Create simple, direct policies without complex subqueries
    - Use only auth.uid() and direct column comparisons
    - Avoid any references to other tables that might create cycles

  3. Security
    - Users can only insert records for themselves
    - Users can only view/delete their own memberships
    - No complex joins or subqueries that could cause recursion
*/

-- Drop all existing policies on group_members to start fresh
DROP POLICY IF EXISTS "Users can join groups" ON group_members;
DROP POLICY IF EXISTS "Users can leave groups" ON group_members;
DROP POLICY IF EXISTS "Users can view group memberships" ON group_members;
DROP POLICY IF EXISTS "Users can view their own memberships" ON group_members;
DROP POLICY IF EXISTS "Users can insert their own membership" ON group_members;
DROP POLICY IF EXISTS "Users can delete their own membership" ON group_members;

-- Create simple, non-recursive policies
CREATE POLICY "Allow insert own membership"
  ON group_members
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow view own membership"
  ON group_members
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Allow delete own membership"
  ON group_members
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Ensure RLS is enabled
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;