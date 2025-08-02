-- Simple test for group tables functionality
-- This script tests basic operations without complex joins

-- 1. Check if tables exist
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('groups', 'group_members', 'group_posts', 'group_post_media')
ORDER BY table_name;

-- 2. Check table structures
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'groups'
ORDER BY ordinal_position;

-- 3. Check if RLS is enabled
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('groups', 'group_members', 'group_posts', 'group_post_media');

-- 4. Check RLS policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('groups', 'group_members', 'group_posts', 'group_post_media')
ORDER BY tablename, policyname;

-- 5. Test simple insert (if you have a user profile)
-- First, let's see if we have any user profiles
SELECT COUNT(*) as user_profiles_count FROM user_profiles LIMIT 1;

-- 6. Test simple select without joins
SELECT COUNT(*) as groups_count FROM groups;
SELECT COUNT(*) as group_members_count FROM group_members;
SELECT COUNT(*) as group_posts_count FROM group_posts;
SELECT COUNT(*) as group_post_media_count FROM group_post_media;

-- 7. Test foreign key constraints
SELECT 
    tc.table_name,
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
AND tc.table_schema = 'public'
AND tc.table_name IN ('groups', 'group_members', 'group_posts', 'group_post_media')
ORDER BY tc.table_name, kcu.column_name; 