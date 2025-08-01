/*
  # Fix Posts Database Issues
  
  This script fixes the 403 error by:
  1. Updating foreign key constraints to reference user_profiles instead of users
  2. Fixing RLS policies to work correctly
  3. Ensuring proper table relationships
*/

-- Step 1: Drop existing foreign key constraints
ALTER TABLE IF EXISTS posts DROP CONSTRAINT IF EXISTS posts_user_id_fkey;
ALTER TABLE IF EXISTS post_likes DROP CONSTRAINT IF EXISTS post_likes_user_id_fkey;
ALTER TABLE IF EXISTS post_comments DROP CONSTRAINT IF EXISTS post_comments_user_id_fkey;

-- Step 2: Add correct foreign key constraints
ALTER TABLE posts ADD CONSTRAINT posts_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES user_profiles(id) ON DELETE CASCADE;

ALTER TABLE post_likes ADD CONSTRAINT post_likes_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES user_profiles(id) ON DELETE CASCADE;

ALTER TABLE post_comments ADD CONSTRAINT post_comments_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES user_profiles(id) ON DELETE CASCADE;

-- Step 3: Drop existing RLS policies
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

-- Step 4: Create new RLS policies that work correctly
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

-- Step 5: Ensure RLS is enabled
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_comments ENABLE ROW LEVEL SECURITY;

-- Step 6: Verify the fix
SELECT 
  'Foreign key constraints updated successfully' as status
WHERE EXISTS (
  SELECT 1 FROM information_schema.table_constraints 
  WHERE constraint_name = 'posts_user_id_fkey' 
  AND table_name = 'posts'
);

-- Step 7: Show current policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename IN ('posts', 'post_likes', 'post_comments')
ORDER BY tablename, policyname; 