-- Fix infinite recursion in group_members RLS policies
-- Execute this script in Supabase Dashboard SQL Editor

-- Drop all existing policies on group_members to start fresh
DROP POLICY IF EXISTS "Users can view group memberships" ON group_members;
DROP POLICY IF EXISTS "Users can join groups" ON group_members;
DROP POLICY IF EXISTS "Users can leave groups" ON group_members;
DROP POLICY IF EXISTS "Group members can view memberships" ON group_members;
DROP POLICY IF EXISTS "Users can insert their own membership" ON group_members;
DROP POLICY IF EXISTS "Users can delete their own membership" ON group_members;
DROP POLICY IF EXISTS "Allow insert own membership" ON group_members;
DROP POLICY IF EXISTS "Allow view group memberships" ON group_members;
DROP POLICY IF EXISTS "Allow delete own membership" ON group_members;

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

-- Fix groups table policies
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

-- Ensure RLS is enabled for groups
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;

-- Fix foreign key constraints
ALTER TABLE group_members DROP CONSTRAINT IF EXISTS group_members_user_id_fkey;
ALTER TABLE groups DROP CONSTRAINT IF EXISTS groups_created_by_fkey;

-- Add new foreign key constraints that reference user_profiles
ALTER TABLE group_members 
ADD CONSTRAINT group_members_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES user_profiles(id) ON DELETE CASCADE;

ALTER TABLE groups 
ADD CONSTRAINT groups_created_by_fkey 
FOREIGN KEY (created_by) REFERENCES user_profiles(id) ON DELETE CASCADE; 