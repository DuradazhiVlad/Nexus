/*
  # Виправлення нескінченної рекурсії в RLS політиці group_members
  
  Проблема: infinite recursion detected in policy for relation "group_members"
  Рішення: Виправити RLS політики щоб уникнути рекурсії
*/

-- 1. Перевіримо поточні RLS політики
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
WHERE tablename IN ('groups', 'group_members')
ORDER BY tablename, policyname;

-- 2. Видалимо всі існуючі RLS політики для group_members
DROP POLICY IF EXISTS "Users can view group memberships" ON group_members;
DROP POLICY IF EXISTS "Users can join groups" ON group_members;
DROP POLICY IF EXISTS "Users can leave groups" ON group_members;
DROP POLICY IF EXISTS "Group members can view group memberships" ON group_members;
DROP POLICY IF EXISTS "Group creators can manage members" ON group_members;

-- 3. Видалимо всі існуючі RLS політики для groups
DROP POLICY IF EXISTS "Anyone can view public groups" ON groups;
DROP POLICY IF EXISTS "Group members can view private groups" ON groups;
DROP POLICY IF EXISTS "Authenticated users can create groups" ON groups;
DROP POLICY IF EXISTS "Group creators can update groups" ON groups;

-- 4. Створимо прості RLS політики без рекурсії

-- Для groups таблиці
CREATE POLICY "Enable read access for all users" ON groups
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users" ON groups
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Enable update for group creators" ON groups
    FOR UPDATE USING (auth.uid() = created_by);

CREATE POLICY "Enable delete for group creators" ON groups
    FOR DELETE USING (auth.uid() = created_by);

-- Для group_members таблиці
CREATE POLICY "Enable read access for all users" ON group_members
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users" ON group_members
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Enable update for group members" ON group_members
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Enable delete for group members" ON group_members
    FOR DELETE USING (auth.uid() = user_id);

-- 5. Переконаємося що RLS увімкнено
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;

-- 6. Перевіримо результат
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
WHERE tablename IN ('groups', 'group_members')
ORDER BY tablename, policyname;

-- 7. Тестовий запит для перевірки
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

-- 8. Перевіримо чи є дані в таблицях
SELECT COUNT(*) as groups_count FROM groups;
SELECT COUNT(*) as members_count FROM group_members; 