/*
  # Fix Post Persistence Issue
  
  This script addresses the issue where posts are created but disappear on page refresh.
  The problem is likely due to:
  1. Incorrect foreign key relationships
  2. RLS policies not allowing proper access
  3. Missing or incorrect table structure
  
  This script will:
  1. Ensure posts table has correct structure
  2. Fix foreign key relationships
  3. Set up proper RLS policies
  4. Verify data integrity
*/

-- Step 1: Check current table structure
SELECT 'Checking current table structure' as step;

-- Check if posts table exists and has correct structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'posts' 
ORDER BY ordinal_position;

-- Check foreign key constraints
SELECT 
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
AND tc.table_name = 'posts';

-- Step 2: Fix foreign key relationships
SELECT 'Fixing foreign key relationships' as step;

-- Drop existing foreign key constraints if they exist
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

-- Add correct foreign key constraints
ALTER TABLE posts ADD CONSTRAINT posts_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES user_profiles(id) ON DELETE CASCADE;

ALTER TABLE post_likes ADD CONSTRAINT post_likes_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES user_profiles(id) ON DELETE CASCADE;

ALTER TABLE post_comments ADD CONSTRAINT post_comments_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES user_profiles(id) ON DELETE CASCADE;

-- Step 3: Fix RLS policies
SELECT 'Fixing RLS policies' as step;

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

-- Create new RLS policies
CREATE POLICY "Users can view all posts" ON posts
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can create their own posts" ON posts
  FOR INSERT TO authenticated 
  WITH CHECK (
    user_id IN (
      SELECT id FROM user_profiles WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own posts" ON posts
  FOR UPDATE TO authenticated 
  USING (
    user_id IN (
      SELECT id FROM user_profiles WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own posts" ON posts
  FOR DELETE TO authenticated 
  USING (
    user_id IN (
      SELECT id FROM user_profiles WHERE auth_user_id = auth.uid()
    )
  );

-- Post likes policies
CREATE POLICY "Users can view all post likes" ON post_likes
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can like posts" ON post_likes
  FOR INSERT TO authenticated 
  WITH CHECK (
    user_id IN (
      SELECT id FROM user_profiles WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can unlike posts" ON post_likes
  FOR DELETE TO authenticated 
  USING (
    user_id IN (
      SELECT id FROM user_profiles WHERE auth_user_id = auth.uid()
    )
  );

-- Post comments policies
CREATE POLICY "Users can view all post comments" ON post_comments
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can create comments" ON post_comments
  FOR INSERT TO authenticated 
  WITH CHECK (
    user_id IN (
      SELECT id FROM user_profiles WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own comments" ON post_comments
  FOR UPDATE TO authenticated 
  USING (
    user_id IN (
      SELECT id FROM user_profiles WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own comments" ON post_comments
  FOR DELETE TO authenticated 
  USING (
    user_id IN (
      SELECT id FROM user_profiles WHERE auth_user_id = auth.uid()
    )
  );

-- Step 4: Verify the fix
SELECT 'Verifying the fix' as step;

-- Check if we can query posts for the current user
SELECT 
    p.id,
    p.content,
    p.created_at,
    up.name as author_name,
    up.id as author_id
FROM posts p
JOIN user_profiles up ON p.user_id = up.id
WHERE up.auth_user_id = auth.uid()
ORDER BY p.created_at DESC
LIMIT 5;

-- Check foreign key relationships again
SELECT 
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
AND tc.table_name IN ('posts', 'post_likes', 'post_comments')
ORDER BY tc.table_name, kcu.column_name;

-- Step 5: Test post creation
SELECT 'Testing post creation' as step;

-- Insert a test post for the current user
INSERT INTO posts (user_id, content)
SELECT 
    up.id,
    'Test post to verify persistence - ' || now()
FROM user_profiles up
WHERE up.auth_user_id = auth.uid()
LIMIT 1;

-- Verify the test post was created
SELECT 
    p.id,
    p.content,
    p.created_at,
    up.name as author_name
FROM posts p
JOIN user_profiles up ON p.user_id = up.id
WHERE up.auth_user_id = auth.uid()
ORDER BY p.created_at DESC
LIMIT 3;

SELECT 'Post persistence fix completed successfully!' as result; 