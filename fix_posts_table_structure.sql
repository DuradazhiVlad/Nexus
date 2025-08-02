-- Fix posts table structure to use auth.users instead of user_profiles
-- Run this in your Supabase SQL Editor

-- 1. Drop existing foreign key constraints
ALTER TABLE posts DROP CONSTRAINT IF EXISTS posts_user_id_fkey;
ALTER TABLE post_likes DROP CONSTRAINT IF EXISTS post_likes_user_id_fkey;
ALTER TABLE post_comments DROP CONSTRAINT IF EXISTS post_comments_user_id_fkey;

-- 2. Add correct foreign key constraints
ALTER TABLE posts ADD CONSTRAINT posts_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE post_likes ADD CONSTRAINT post_likes_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE post_comments ADD CONSTRAINT post_comments_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- 3. Update RLS policies to use auth.uid() instead of profile IDs
DROP POLICY IF EXISTS "Users can create their own posts" ON posts;
DROP POLICY IF EXISTS "Users can update their own posts" ON posts;
DROP POLICY IF EXISTS "Users can delete their own posts" ON posts;

CREATE POLICY "Users can create their own posts" ON posts
FOR INSERT TO authenticated 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own posts" ON posts
FOR UPDATE TO authenticated 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own posts" ON posts
FOR DELETE TO authenticated 
USING (auth.uid() = user_id);

-- 4. Update post_likes policies
DROP POLICY IF EXISTS "Users can like posts" ON post_likes;
DROP POLICY IF EXISTS "Users can unlike their own likes" ON post_likes;

CREATE POLICY "Users can like posts" ON post_likes
FOR INSERT TO authenticated 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unlike their own likes" ON post_likes
FOR DELETE TO authenticated 
USING (auth.uid() = user_id);

-- 5. Update post_comments policies
DROP POLICY IF EXISTS "Users can comment on posts" ON post_comments;
DROP POLICY IF EXISTS "Users can delete their own comments" ON post_comments;

CREATE POLICY "Users can comment on posts" ON post_comments
FOR INSERT TO authenticated 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments" ON post_comments
FOR DELETE TO authenticated 
USING (auth.uid() = user_id);

-- 6. Verify the changes
SELECT 'Posts table structure:' as info;
SELECT 
  column_name,
  data_type,
  is_nullable,
  constraint_name
FROM information_schema.columns 
LEFT JOIN information_schema.table_constraints 
  ON columns.table_name = table_constraints.table_name
WHERE columns.table_name = 'posts'
ORDER BY ordinal_position;

SELECT 'Foreign key constraints:' as info;
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
  AND tc.table_name IN ('posts', 'post_likes', 'post_comments'); 