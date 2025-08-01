/*
  # Fix posts table foreign key relationships

  1. Problem
    - Posts tables are referencing 'users' table but should reference 'user_profiles'
    - This causes 403 errors when querying posts because RLS policies check user_profiles
    - Need to align foreign keys with actual table structure

  2. Solution
    - Update all posts-related foreign keys to use user_profiles table
    - Ensure proper relationships between posts and user_profiles
    - Fix RLS policies to work correctly
*/

-- Drop existing foreign key constraints
ALTER TABLE IF EXISTS posts DROP CONSTRAINT IF EXISTS posts_user_id_fkey;
ALTER TABLE IF EXISTS post_likes DROP CONSTRAINT IF EXISTS post_likes_user_id_fkey;
ALTER TABLE IF EXISTS post_comments DROP CONSTRAINT IF EXISTS post_comments_user_id_fkey;

-- Add correct foreign key constraints
ALTER TABLE posts ADD CONSTRAINT posts_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES user_profiles(id) ON DELETE CASCADE;

ALTER TABLE post_likes ADD CONSTRAINT post_likes_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES user_profiles(id) ON DELETE CASCADE;

ALTER TABLE post_comments ADD CONSTRAINT post_comments_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES user_profiles(id) ON DELETE CASCADE;

-- Drop existing RLS policies
DROP POLICY IF EXISTS "Users can view all posts" ON posts;
DROP POLICY IF EXISTS "Users can create their own posts" ON posts;
DROP POLICY IF EXISTS "Users can update their own posts" ON posts;
DROP POLICY IF EXISTS "Users can delete their own posts" ON posts;

DROP POLICY IF EXISTS "Users can view all post likes" ON post_likes;
DROP POLICY IF EXISTS "Users can like posts" ON post_likes;
DROP POLICY IF EXISTS "Users can unlike posts" ON post_likes;

DROP POLICY IF EXISTS "Users can view all post comments" ON post_comments;
DROP POLICY IF EXISTS "Users can create comments" ON post_comments;
DROP POLICY IF EXISTS "Users can update their own comments" ON post_comments;
DROP POLICY IF EXISTS "Users can delete their own comments" ON post_comments;

-- Create new RLS policies that work correctly
CREATE POLICY "Users can view all posts" ON posts
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can create their own posts" ON posts
  FOR INSERT TO authenticated 
  WITH CHECK (
    user_id = (
      SELECT id FROM user_profiles WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own posts" ON posts
  FOR UPDATE TO authenticated 
  USING (
    user_id = (
      SELECT id FROM user_profiles WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own posts" ON posts
  FOR DELETE TO authenticated 
  USING (
    user_id = (
      SELECT id FROM user_profiles WHERE auth_user_id = auth.uid()
    )
  );

-- Post likes policies
CREATE POLICY "Users can view all post likes" ON post_likes
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can like posts" ON post_likes
  FOR INSERT TO authenticated 
  WITH CHECK (
    user_id = (
      SELECT id FROM user_profiles WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can unlike posts" ON post_likes
  FOR DELETE TO authenticated 
  USING (
    user_id = (
      SELECT id FROM user_profiles WHERE auth_user_id = auth.uid()
    )
  );

-- Post comments policies
CREATE POLICY "Users can view all post comments" ON post_comments
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can create comments" ON post_comments
  FOR INSERT TO authenticated 
  WITH CHECK (
    user_id = (
      SELECT id FROM user_profiles WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own comments" ON post_comments
  FOR UPDATE TO authenticated 
  USING (
    user_id = (
      SELECT id FROM user_profiles WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own comments" ON post_comments
  FOR DELETE TO authenticated 
  USING (
    user_id = (
      SELECT id FROM user_profiles WHERE auth_user_id = auth.uid()
    )
  );

-- Ensure RLS is enabled
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_comments ENABLE ROW LEVEL SECURITY; 