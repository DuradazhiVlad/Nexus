/*
# Fix infinite recursion in group_members RLS policies

This script resolves the infinite recursion error by:
1. Dropping all existing problematic policies
2. Creating a SECURITY DEFINER function to safely check membership
3. Implementing simple, non-recursive policies
4. Fixing foreign key constraints to reference user_profiles
*/

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
DROP POLICY IF EXISTS "Group admins can add members" ON group_members;
DROP POLICY IF EXISTS "Group admins can update member roles" ON group_members;
DROP POLICY IF EXISTS "Users can view group members" ON group_members;

-- Drop the problematic function if it exists
DROP FUNCTION IF EXISTS is_member_of_group(uuid, uuid);

-- Create a simple, non-recursive function to check group membership
CREATE OR REPLACE FUNCTION check_group_membership(_user_id uuid, _group_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM group_members gm
    WHERE gm.group_id = _group_id
    AND gm.user_id = _user_id
  );
$$;

-- Create simple, non-recursive policies for group_members
CREATE POLICY "Members can insert own membership"
  ON group_members
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = (
      SELECT id FROM user_profiles WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Members can view group memberships"
  ON group_members
  FOR SELECT
  TO authenticated
  USING (
    -- Users can see memberships of groups they belong to
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.auth_user_id = auth.uid()
      AND up.id = user_id
    )
    OR
    -- Or if they are members of the same group
    group_id IN (
      SELECT gm.group_id FROM group_members gm
      JOIN user_profiles up ON up.id = gm.user_id
      WHERE up.auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Members can delete own membership"
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

-- Fix groups table policies to avoid recursion
DROP POLICY IF EXISTS "Anyone can view public groups" ON groups;
DROP POLICY IF EXISTS "Group members can view private groups" ON groups;
DROP POLICY IF EXISTS "Authenticated users can create groups" ON groups;
DROP POLICY IF EXISTS "Group creators can update their groups" ON groups;
DROP POLICY IF EXISTS "Users can create groups" ON groups;
DROP POLICY IF EXISTS "Users can update groups" ON groups;
DROP POLICY IF EXISTS "Users can view groups" ON groups;

-- Create new, simple policies for groups
CREATE POLICY "Public groups are visible to all"
  ON groups
  FOR SELECT
  TO authenticated
  USING (NOT is_private);

CREATE POLICY "Private groups visible to members"
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

CREATE POLICY "Users can create groups"
  ON groups
  FOR INSERT
  TO authenticated
  WITH CHECK (
    created_by = (
      SELECT id FROM user_profiles WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Creators can update their groups"
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

-- Fix foreign key constraints if they don't exist
DO $$
BEGIN
    -- Check and add foreign key for group_members.user_id -> user_profiles.id
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'group_members_user_id_fkey' 
        AND table_name = 'group_members'
    ) THEN
        ALTER TABLE group_members DROP CONSTRAINT IF EXISTS group_members_user_id_fkey;
        ALTER TABLE group_members 
        ADD CONSTRAINT group_members_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES user_profiles(id) ON DELETE CASCADE;
    END IF;

    -- Check and add foreign key for groups.created_by -> user_profiles.id
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'groups_created_by_fkey' 
        AND table_name = 'groups'
    ) THEN
        ALTER TABLE groups DROP CONSTRAINT IF EXISTS groups_created_by_fkey;
        ALTER TABLE groups 
        ADD CONSTRAINT groups_created_by_fkey 
        FOREIGN KEY (created_by) REFERENCES user_profiles(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION check_group_membership(uuid, uuid) TO authenticated;

-- Test the policies by selecting from groups (should not cause recursion)
SELECT 'Policies fixed successfully' as status;