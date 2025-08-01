/*
  # Complete Fix for Posts Database Issues
  
  This script comprehensively fixes the 403 error and post display issues by:
  1. Checking current database state
  2. Safely dropping and recreating foreign key constraints
  3. Fixing RLS policies to work correctly
  4. Ensuring proper table relationships
  5. Verifying the fixes work
*/

-- Step 1: Check current state
SELECT 'Current database state check' as step;

-- Check if tables exist
SELECT 
  table_name,
  CASE WHEN table_name IS NOT NULL THEN 'EXISTS' ELSE 'MISSING' END as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('posts', 'post_likes', 'post_comments', 'user_profiles');

-- Check current foreign key constraints
SELECT 
  tc.table_name,
  tc.constraint_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name IN ('posts', 'post_likes', 'post_comments');

-- Step 2: Safely drop existing foreign key constraints
SELECT 'Dropping existing foreign key constraints' as step;

DO $$ 
BEGIN
  -- Drop posts foreign key if it exists
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'posts_user_id_fkey' AND table_name = 'posts'
  ) THEN
    ALTER TABLE posts DROP CONSTRAINT posts_user_id_fkey;
    RAISE NOTICE 'Dropped posts_user_id_fkey constraint';
  ELSE
    RAISE NOTICE 'posts_user_id_fkey constraint does not exist';
  END IF;

  -- Drop post_likes foreign key if it exists
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'post_likes_user_id_fkey' AND table_name = 'post_likes'
  ) THEN
    ALTER TABLE post_likes DROP CONSTRAINT post_likes_user_id_fkey;
    RAISE NOTICE 'Dropped post_likes_user_id_fkey constraint';
  ELSE
    RAISE NOTICE 'post_likes_user_id_fkey constraint does not exist';
  END IF;

  -- Drop post_comments foreign key if it exists
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'post_comments_user_id_fkey' AND table_name = 'post_comments'
  ) THEN
    ALTER TABLE post_comments DROP CONSTRAINT post_comments_user_id_fkey;
    RAISE NOTICE 'Dropped post_comments_user_id_fkey constraint';
  ELSE
    RAISE NOTICE 'post_comments_user_id_fkey constraint does not exist';
  END IF;
END $$;

-- Step 3: Add correct foreign key constraints
SELECT 'Adding correct foreign key constraints' as step;

ALTER TABLE posts ADD CONSTRAINT posts_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES user_profiles(id) ON DELETE CASCADE;

ALTER TABLE post_likes ADD CONSTRAINT post_likes_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES user_profiles(id) ON DELETE CASCADE;

ALTER TABLE post_comments ADD CONSTRAINT post_comments_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES user_profiles(id) ON DELETE CASCADE;

-- Step 4: Drop existing RLS policies
SELECT 'Dropping existing RLS policies' as step;

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

-- Step 5: Create new RLS policies that work correctly
SELECT 'Creating new RLS policies' as step;

-- Posts policies
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

-- Step 6: Ensure RLS is enabled
SELECT 'Enabling RLS on tables' as step;

ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_comments ENABLE ROW LEVEL SECURITY;

-- Step 7: Verify the fixes
SELECT 'Verifying fixes' as step;

-- Verify foreign key constraints
SELECT 
  'Foreign key constraints verification' as check_type,
  tc.table_name,
  tc.constraint_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name IN ('posts', 'post_likes', 'post_comments')
ORDER BY tc.table_name, tc.constraint_name;

-- Show current policies
SELECT 
  'Current RLS policies' as check_type,
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

-- Step 8: Test data verification
SELECT 'Testing data access' as step;

-- Check if we can select from posts table
SELECT 
  'Posts table accessible' as test,
  COUNT(*) as post_count
FROM posts;

-- Check if we can select from user_profiles table
SELECT 
  'User profiles table accessible' as test,
  COUNT(*) as profile_count
FROM user_profiles;

-- Check sample post data with user info
SELECT 
  'Sample post data' as test,
  p.id,
  p.content,
  p.user_id,
  up.name,
  up.last_name
FROM posts p
LEFT JOIN user_profiles up ON p.user_id = up.id
LIMIT 5;

SELECT 'Database fix completed successfully!' as final_status; 