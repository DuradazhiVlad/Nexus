/*
  # Екстрене виправлення RLS рекурсії для groups
  
  Проблема: infinite recursion detected in policy for relation "group_members"
  Рішення: Тимчасово вимкнути RLS, потім створити правильні політики
*/

-- 1. Тимчасово вимкнемо RLS для тестування
ALTER TABLE groups DISABLE ROW LEVEL SECURITY;
ALTER TABLE group_members DISABLE ROW LEVEL SECURITY;

-- 2. Видалимо всі існуючі політики
DROP POLICY IF EXISTS "Users can view group memberships" ON group_members;
DROP POLICY IF EXISTS "Users can join groups" ON group_members;
DROP POLICY IF EXISTS "Users can leave groups" ON group_members;
DROP POLICY IF EXISTS "Group members can view group memberships" ON group_members;
DROP POLICY IF EXISTS "Group creators can manage members" ON group_members;
DROP POLICY IF EXISTS "Enable read access for all users" ON group_members;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON group_members;
DROP POLICY IF EXISTS "Enable update for group members" ON group_members;
DROP POLICY IF EXISTS "Enable delete for group members" ON group_members;

DROP POLICY IF EXISTS "Anyone can view public groups" ON groups;
DROP POLICY IF EXISTS "Group members can view private groups" ON groups;
DROP POLICY IF EXISTS "Authenticated users can create groups" ON groups;
DROP POLICY IF EXISTS "Group creators can update groups" ON groups;
DROP POLICY IF EXISTS "Enable read access for all users" ON groups;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON groups;
DROP POLICY IF EXISTS "Enable update for group creators" ON groups;
DROP POLICY IF EXISTS "Enable delete for group creators" ON groups;

-- 3. Перевіримо що політики видалені
SELECT 
    schemaname,
    tablename,
    policyname
FROM pg_policies
WHERE tablename IN ('groups', 'group_members')
ORDER BY tablename, policyname;

-- 4. Тестовий запит без RLS
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

-- 5. Перевіримо дані
SELECT COUNT(*) as groups_count FROM groups;
SELECT COUNT(*) as members_count FROM group_members;

-- 6. Якщо все працює, створимо прості політики
-- Увімкнемо RLS знову
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;

-- 7. Створимо максимально прості політики
CREATE POLICY "groups_select_policy" ON groups
    FOR SELECT USING (true);

CREATE POLICY "groups_insert_policy" ON groups
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "groups_update_policy" ON groups
    FOR UPDATE USING (auth.uid() = created_by);

CREATE POLICY "groups_delete_policy" ON groups
    FOR DELETE USING (auth.uid() = created_by);

CREATE POLICY "group_members_select_policy" ON group_members
    FOR SELECT USING (true);

CREATE POLICY "group_members_insert_policy" ON group_members
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "group_members_update_policy" ON group_members
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "group_members_delete_policy" ON group_members
    FOR DELETE USING (auth.uid() = user_id);

-- 8. Перевіримо нові політики
SELECT 
    schemaname,
    tablename,
    policyname,
    cmd,
    qual
FROM pg_policies
WHERE tablename IN ('groups', 'group_members')
ORDER BY tablename, policyname;

-- 9. Фінальний тест
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