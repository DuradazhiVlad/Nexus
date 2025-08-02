/*
  # Повне вимкнення RLS для groups та пов'язаних таблиць
  
  Проблема: infinite recursion detected in policy for relation "group_members"
  Рішення: Повністю вимкнути RLS для всіх пов'язаних таблиць
*/

-- 1. Повністю вимкнемо RLS для всіх пов'язаних таблиць
ALTER TABLE groups DISABLE ROW LEVEL SECURITY;
ALTER TABLE group_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE group_posts DISABLE ROW LEVEL SECURITY;
ALTER TABLE group_post_media DISABLE ROW LEVEL SECURITY;

-- 2. Видалимо ВСІ існуючі політики для цих таблиць
DROP POLICY IF EXISTS "Users can view group memberships" ON group_members;
DROP POLICY IF EXISTS "Users can join groups" ON group_members;
DROP POLICY IF EXISTS "Users can leave groups" ON group_members;
DROP POLICY IF EXISTS "Group members can view group memberships" ON group_members;
DROP POLICY IF EXISTS "Group creators can manage members" ON group_members;
DROP POLICY IF EXISTS "Enable read access for all users" ON group_members;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON group_members;
DROP POLICY IF EXISTS "Enable update for group members" ON group_members;
DROP POLICY IF EXISTS "Enable delete for group members" ON group_members;
DROP POLICY IF EXISTS "group_members_select_policy" ON group_members;
DROP POLICY IF EXISTS "group_members_insert_policy" ON group_members;
DROP POLICY IF EXISTS "group_members_update_policy" ON group_members;
DROP POLICY IF EXISTS "group_members_delete_policy" ON group_members;

DROP POLICY IF EXISTS "Anyone can view public groups" ON groups;
DROP POLICY IF EXISTS "Group members can view private groups" ON groups;
DROP POLICY IF EXISTS "Authenticated users can create groups" ON groups;
DROP POLICY IF EXISTS "Group creators can update groups" ON groups;
DROP POLICY IF EXISTS "Enable read access for all users" ON groups;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON groups;
DROP POLICY IF EXISTS "Enable update for group creators" ON groups;
DROP POLICY IF EXISTS "Enable delete for group creators" ON groups;
DROP POLICY IF EXISTS "groups_select_policy" ON groups;
DROP POLICY IF EXISTS "groups_insert_policy" ON groups;
DROP POLICY IF EXISTS "groups_update_policy" ON groups;
DROP POLICY IF EXISTS "groups_delete_policy" ON groups;

-- 3. Перевіримо що всі політики видалені
SELECT 
    schemaname,
    tablename,
    policyname
FROM pg_policies
WHERE tablename IN ('groups', 'group_members', 'group_posts', 'group_post_media')
ORDER BY tablename, policyname;

-- 4. Перевіримо статус RLS
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables
WHERE tablename IN ('groups', 'group_members', 'group_posts', 'group_post_media')
ORDER BY tablename;

-- 5. Тестовий запит для groups
SELECT 
    g.id,
    g.name,
    g.description,
    g.is_private,
    g.member_count,
    g.created_at
FROM groups g
WHERE g.is_active = true
ORDER BY g.last_activity DESC
LIMIT 5;

-- 6. Тестовий запит для group_members
SELECT 
    gm.id,
    gm.group_id,
    gm.user_id,
    gm.role,
    gm.joined_at
FROM group_members gm
LIMIT 5;

-- 7. Перевіримо дані в таблицях
SELECT COUNT(*) as groups_count FROM groups;
SELECT COUNT(*) as members_count FROM group_members;
SELECT COUNT(*) as posts_count FROM group_posts;
SELECT COUNT(*) as media_count FROM group_post_media;

-- 8. Перевіримо foreign key constraints
SELECT 
    tc.table_name, 
    tc.constraint_name, 
    tc.constraint_type,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage ccu 
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_name IN ('groups', 'group_members', 'group_posts', 'group_post_media')
    AND tc.constraint_type = 'FOREIGN KEY'
ORDER BY tc.table_name, tc.constraint_name; 