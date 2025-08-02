/*
  # Test Post Persistence
  
  This script tests the complete post creation and retrieval flow
  to identify why posts disappear on page refresh.
*/

-- Step 1: Check current user and profile
SELECT 'Step 1: Checking current user and profile' as step;

SELECT 
    auth.uid() as current_user_id,
    auth.email() as current_user_email;

-- Get current user's profile
SELECT 
    id,
    name,
    last_name,
    email,
    auth_user_id
FROM user_profiles 
WHERE auth_user_id = auth.uid()
LIMIT 1;

-- Step 2: Check existing posts for current user
SELECT 'Step 2: Checking existing posts' as step;

SELECT 
    p.id,
    p.content,
    p.created_at,
    p.user_id,
    up.name as author_name,
    up.auth_user_id
FROM posts p
JOIN user_profiles up ON p.user_id = up.id
WHERE up.auth_user_id = auth.uid()
ORDER BY p.created_at DESC
LIMIT 10;

-- Step 3: Test post creation
SELECT 'Step 3: Testing post creation' as step;

-- Insert a test post
INSERT INTO posts (user_id, content)
SELECT 
    up.id,
    'Test post for persistence check - ' || now()
FROM user_profiles up
WHERE up.auth_user_id = auth.uid()
LIMIT 1;

-- Step 4: Verify the test post was created
SELECT 'Step 4: Verifying test post creation' as step;

SELECT 
    p.id,
    p.content,
    p.created_at,
    p.user_id,
    up.name as author_name,
    up.auth_user_id
FROM posts p
JOIN user_profiles up ON p.user_id = up.id
WHERE up.auth_user_id = auth.uid()
ORDER BY p.created_at DESC
LIMIT 5;

-- Step 5: Test the exact query that the frontend uses
SELECT 'Step 5: Testing frontend query' as step;

-- This simulates the getUserPosts function query
SELECT 
    p.*,
    up.id as author_id,
    up.name as author_name,
    up.last_name as author_last_name,
    up.avatar as author_avatar,
    COUNT(pl.id) as likes_count,
    COUNT(pc.id) as comments_count
FROM posts p
JOIN user_profiles up ON p.user_id = up.id
LEFT JOIN post_likes pl ON p.id = pl.post_id
LEFT JOIN post_comments pc ON p.id = pc.post_id
WHERE up.auth_user_id = auth.uid()
GROUP BY p.id, up.id, up.name, up.last_name, up.avatar
ORDER BY p.created_at DESC
LIMIT 10;

-- Step 6: Check RLS policies
SELECT 'Step 6: Checking RLS policies' as step;

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

-- Step 7: Check foreign key constraints
SELECT 'Step 7: Checking foreign key constraints' as step;

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

-- Step 8: Clean up test post (optional)
SELECT 'Step 8: Cleaning up test post' as step;

-- Uncomment the following lines to clean up the test post
-- DELETE FROM posts 
-- WHERE content LIKE 'Test post for persistence check%'
-- AND user_id IN (SELECT id FROM user_profiles WHERE auth_user_id = auth.uid());

SELECT 'Post persistence test completed!' as result; 