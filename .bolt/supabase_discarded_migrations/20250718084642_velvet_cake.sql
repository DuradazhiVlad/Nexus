/*
  # Fix groups table structure and relationships

  1. Database Structure
    - Ensure proper UUID types for all foreign keys
    - Fix relationships between users and groups
    - Update RLS policies for groups functionality

  2. Security
    - Fix group access policies
    - Ensure proper user identification in group operations
*/

-- Ensure groups table has proper structure
ALTER TABLE groups 
ALTER COLUMN created_by TYPE uuid USING created_by::uuid;

-- Ensure group_members table has proper UUID types
ALTER TABLE group_members 
ALTER COLUMN user_id TYPE uuid USING user_id::uuid;

-- Ensure group_posts table has proper UUID types  
ALTER TABLE group_posts 
ALTER COLUMN user_id TYPE uuid USING user_id::uuid;

-- Update RLS policies for groups with proper user identification
DROP POLICY IF EXISTS "Users can view public groups" ON groups;
DROP POLICY IF EXISTS "Users can create groups" ON groups;
DROP POLICY IF EXISTS "Group admins can update groups" ON groups;

CREATE POLICY "Users can view public groups"
  ON groups
  FOR SELECT
  TO authenticated
  USING (
    privacy = 'public' OR
    id IN (
      SELECT gm.group_id FROM group_members gm
      JOIN users u ON u.id = gm.user_id
      WHERE u.email = auth.jwt() ->> 'email'
    )
  );

CREATE POLICY "Users can create groups"
  ON groups
  FOR INSERT
  TO authenticated
  WITH CHECK (
    created_by IN (SELECT id FROM users WHERE email = auth.jwt() ->> 'email')
  );

CREATE POLICY "Group admins can update groups"
  ON groups
  FOR UPDATE
  TO authenticated
  USING (
    id IN (
      SELECT gm.group_id FROM group_members gm
      JOIN users u ON u.id = gm.user_id
      WHERE u.email = auth.jwt() ->> 'email' AND gm.role = 'admin'
    )
  );

-- Update group_members policies
DROP POLICY IF EXISTS "Users can view group members" ON group_members;
DROP POLICY IF EXISTS "Group admins can manage members" ON group_members;
DROP POLICY IF EXISTS "Users can join groups" ON group_members;

CREATE POLICY "Users can view group members"
  ON group_members
  FOR SELECT
  TO authenticated
  USING (
    group_id IN (
      SELECT id FROM groups WHERE privacy = 'public'
    ) OR
    group_id IN (
      SELECT gm.group_id FROM group_members gm
      JOIN users u ON u.id = gm.user_id
      WHERE u.email = auth.jwt() ->> 'email'
    )
  );

CREATE POLICY "Users can join groups"
  ON group_members
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id IN (SELECT id FROM users WHERE email = auth.jwt() ->> 'email')
  );

CREATE POLICY "Users can leave groups"
  ON group_members
  FOR DELETE
  TO authenticated
  USING (
    user_id IN (SELECT id FROM users WHERE email = auth.jwt() ->> 'email')
  );

CREATE POLICY "Group admins can manage members"
  ON group_members
  FOR ALL
  TO authenticated
  USING (
    group_id IN (
      SELECT gm.group_id FROM group_members gm
      JOIN users u ON u.id = gm.user_id
      WHERE u.email = auth.jwt() ->> 'email' AND gm.role = 'admin'
    )
  );

-- Update group_posts policies
DROP POLICY IF EXISTS "Users can view group posts" ON group_posts;
DROP POLICY IF EXISTS "Group members can create posts" ON group_posts;
DROP POLICY IF EXISTS "Users can manage their own posts" ON group_posts;

CREATE POLICY "Users can view group posts"
  ON group_posts
  FOR SELECT
  TO authenticated
  USING (
    group_id IN (
      SELECT id FROM groups WHERE privacy = 'public'
    ) OR
    group_id IN (
      SELECT gm.group_id FROM group_members gm
      JOIN users u ON u.id = gm.user_id
      WHERE u.email = auth.jwt() ->> 'email'
    )
  );

CREATE POLICY "Group members can create posts"
  ON group_posts
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id IN (SELECT id FROM users WHERE email = auth.jwt() ->> 'email') AND
    group_id IN (
      SELECT gm.group_id FROM group_members gm
      JOIN users u ON u.id = gm.user_id
      WHERE u.email = auth.jwt() ->> 'email'
    )
  );

CREATE POLICY "Users can manage their own posts"
  ON group_posts
  FOR DELETE
  TO authenticated
  USING (
    user_id IN (SELECT id FROM users WHERE email = auth.jwt() ->> 'email')
  );

CREATE POLICY "Group admins can manage all posts"
  ON group_posts
  FOR DELETE
  TO authenticated
  USING (
    group_id IN (
      SELECT gm.group_id FROM group_members gm
      JOIN users u ON u.id = gm.user_id
      WHERE u.email = auth.jwt() ->> 'email' AND gm.role = 'admin'
    )
  );