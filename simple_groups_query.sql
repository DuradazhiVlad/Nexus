-- Simple test queries for groups functionality
-- These queries avoid complex joins that might cause recursion issues

-- 1. Test basic groups query without joins
SELECT 
    id,
    name,
    description,
    is_public,
    created_at,
    member_count,
    post_count
FROM groups 
WHERE is_public = true
ORDER BY created_at DESC
LIMIT 10;

-- 2. Test groups with simple join to user_profiles
SELECT 
    g.id,
    g.name,
    g.description,
    g.is_public,
    g.created_at,
    g.member_count,
    g.post_count,
    up.name as creator_name,
    up.last_name as creator_last_name
FROM groups g
LEFT JOIN user_profiles up ON g.created_by = up.id
WHERE g.is_public = true
ORDER BY g.created_at DESC
LIMIT 10;

-- 3. Test group members query
SELECT 
    gm.group_id,
    gm.user_id,
    gm.role,
    gm.joined_at,
    gm.is_active
FROM group_members gm
WHERE gm.is_active = true
LIMIT 10;

-- 4. Test user's group memberships
-- Replace 'your-user-profile-id' with an actual user profile ID
SELECT 
    g.id as group_id,
    g.name as group_name,
    g.is_public,
    gm.role,
    gm.joined_at
FROM groups g
JOIN group_members gm ON g.id = gm.group_id
WHERE gm.user_id = '7f6fa11b-153e-4640-861a-ff088146dc66'  -- Replace with actual user ID
AND gm.is_active = true
ORDER BY gm.joined_at DESC;

-- 5. Test public groups that user is NOT a member of
-- This is the query that was causing the "null" issue
SELECT 
    g.id,
    g.name,
    g.description,
    g.is_public,
    g.created_at
FROM groups g
WHERE g.is_public = true
AND g.id NOT IN (
    SELECT gm.group_id 
    FROM group_members gm 
    WHERE gm.user_id = '7f6fa11b-153e-4640-861a-ff088146dc66'  -- Replace with actual user ID
    AND gm.is_active = true
)
ORDER BY g.created_at DESC
LIMIT 10; 