/*
  # Test Posts Functionality
  
  This script tests if posts are working correctly after the database fixes.
  Run this after applying the fix_posts_database_complete.sql script.
*/

-- Test 1: Check if we can access posts table
SELECT 'Test 1: Posts table access' as test_name;
SELECT COUNT(*) as total_posts FROM posts;

-- Test 2: Check if we can access user_profiles table
SELECT 'Test 2: User profiles table access' as test_name;
SELECT COUNT(*) as total_profiles FROM user_profiles;

-- Test 3: Check foreign key relationships
SELECT 'Test 3: Foreign key relationships' as test_name;
SELECT 
  p.id as post_id,
  p.content,
  p.user_id as post_user_id,
  up.id as profile_id,
  up.name,
  up.last_name
FROM posts p
LEFT JOIN user_profiles up ON p.user_id = up.id
LIMIT 5;

-- Test 4: Check RLS policies are working
SELECT 'Test 4: RLS policies verification' as test_name;
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd,
  permissive
FROM pg_policies 
WHERE tablename IN ('posts', 'post_likes', 'post_comments')
ORDER BY tablename, policyname;

-- Test 5: Check if posts have correct user_id values
SELECT 'Test 5: Post user_id validation' as test_name;
SELECT 
  p.user_id,
  COUNT(*) as post_count,
  CASE 
    WHEN up.id IS NOT NULL THEN 'VALID - User profile exists'
    ELSE 'INVALID - No matching user profile'
  END as status
FROM posts p
LEFT JOIN user_profiles up ON p.user_id = up.id
GROUP BY p.user_id, up.id
ORDER BY post_count DESC;

-- Test 6: Sample recent posts with full details
SELECT 'Test 6: Recent posts with details' as test_name;
SELECT 
  p.id,
  p.content,
  p.created_at,
  p.user_id,
  up.name,
  up.last_name,
  p.likes_count,
  p.comments_count
FROM posts p
LEFT JOIN user_profiles up ON p.user_id = up.id
ORDER BY p.created_at DESC
LIMIT 10;

-- Test 7: Check for any orphaned posts (posts without valid user profiles)
SELECT 'Test 7: Orphaned posts check' as test_name;
SELECT 
  COUNT(*) as orphaned_posts_count
FROM posts p
LEFT JOIN user_profiles up ON p.user_id = up.id
WHERE up.id IS NULL;

-- Test 8: Verify foreign key constraints
SELECT 'Test 8: Foreign key constraints' as test_name;
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
  AND tc.table_name IN ('posts', 'post_likes', 'post_comments')
ORDER BY tc.table_name, tc.constraint_name;

SELECT 'All tests completed!' as final_status; 