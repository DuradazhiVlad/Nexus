-- Test Groups Functionality
-- Run this in your Supabase SQL Editor to test the groups system

-- 1. Check if tables exist
SELECT 'Checking tables exist:' as info;
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('groups', 'group_members', 'group_posts', 'group_post_media')
ORDER BY table_name;

-- 2. Check table structures
SELECT 'Groups table structure:' as info;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'groups'
ORDER BY ordinal_position;

SELECT 'Group members table structure:' as info;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'group_members'
ORDER BY ordinal_position;

SELECT 'Group posts table structure:' as info;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'group_posts'
ORDER BY ordinal_position;

-- 3. Check foreign key constraints
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
  AND tc.table_name IN ('groups', 'group_members', 'group_posts', 'group_post_media');

-- 4. Check RLS policies
SELECT 'RLS policies for groups:' as info;
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename IN ('groups', 'group_members', 'group_posts', 'group_post_media')
ORDER BY tablename, policyname;

-- 5. Check if there are any existing groups
SELECT 'Existing groups:' as info;
SELECT id, name, description, is_public, member_count, post_count, created_at
FROM groups
ORDER BY created_at DESC;

-- 6. Check if there are any existing group members
SELECT 'Existing group members:' as info;
SELECT gm.group_id, g.name as group_name, gm.user_id, gm.role, gm.joined_at
FROM group_members gm
JOIN groups g ON g.id = gm.group_id
ORDER BY gm.joined_at DESC;

-- 7. Test creating a sample group (if you have a user profile)
-- Uncomment and modify the user_id below to test group creation
/*
INSERT INTO groups (name, description, is_public, created_by)
VALUES ('Test Group', 'This is a test group', true, 'your-user-profile-id-here')
RETURNING id, name, description, is_public, created_by;
*/

-- 8. Check indexes
SELECT 'Indexes on groups tables:' as info;
SELECT 
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes 
WHERE tablename IN ('groups', 'group_members', 'group_posts', 'group_post_media')
ORDER BY tablename, indexname; 