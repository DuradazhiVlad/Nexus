-- Check posts table structure and foreign key relationships
-- This script will help identify why posts are not displaying

-- 1. Check if posts table exists and its structure
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'posts'
ORDER BY ordinal_position;

-- 2. Check foreign key constraints
SELECT 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    tc.constraint_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_name = 'posts';

-- 3. Check if user_profiles table exists
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'user_profiles'
ORDER BY ordinal_position;

-- 4. Check sample data in posts table
SELECT 
    id,
    user_id,
    content,
    created_at,
    likes_count,
    comments_count
FROM posts 
LIMIT 5;

-- 5. Check sample data in user_profiles table
SELECT 
    id,
    auth_user_id,
    name,
    last_name,
    email,
    created_at
FROM user_profiles 
LIMIT 5;

-- 6. Test the join between posts and user_profiles
SELECT 
    p.id as post_id,
    p.content,
    p.user_id,
    up.id as profile_id,
    up.name,
    up.last_name
FROM posts p
LEFT JOIN user_profiles up ON p.user_id = up.id
LIMIT 5;

-- 7. Check RLS policies on posts table
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
WHERE tablename = 'posts';

-- 8. Check if RLS is enabled on posts table
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'posts'; 