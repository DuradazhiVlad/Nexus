/*
  # Тестування функціональності груп

  1. Перевірка структури таблиць
  2. Тестування створення групи
  3. Тестування приєднання до групи
  4. Перевірка запитів
*/

-- 1. Перевірка структури таблиці groups
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'groups'
ORDER BY ordinal_position;

-- 2. Перевірка структури таблиці group_members
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'group_members'
ORDER BY ordinal_position;

-- 3. Перевірка foreign key constraints
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
WHERE tc.table_name IN ('group_members', 'groups')
    AND tc.constraint_type = 'FOREIGN KEY';

-- 4. Перевірка існуючих груп
SELECT 
    g.id,
    g.name,
    g.description,
    g.is_private,
    g.member_count,
    g.post_count,
    g.category,
    g.is_active,
    g.created_at,
    g.last_activity,
    up.name as creator_name,
    up.last_name as creator_last_name
FROM groups g
LEFT JOIN user_profiles up ON g.created_by = up.id
ORDER BY g.created_at DESC
LIMIT 10;

-- 5. Перевірка членів груп
SELECT 
    gm.group_id,
    g.name as group_name,
    gm.user_id,
    up.name as member_name,
    up.last_name as member_last_name,
    gm.role,
    gm.joined_at
FROM group_members gm
JOIN groups g ON gm.group_id = g.id
JOIN user_profiles up ON gm.user_id = up.id
ORDER BY gm.joined_at DESC
LIMIT 10;

-- 6. Тестовий запит для отримання груп з інформацією про створника
SELECT 
    g.*,
    up.name as creator_name,
    up.last_name as creator_last_name,
    up.avatar as creator_avatar
FROM groups g
LEFT JOIN user_profiles up ON g.created_by = up.id
WHERE g.is_active = true
ORDER BY g.last_activity DESC;

-- 7. Тестовий запит для отримання членства користувача
-- (замініть 'USER_ID_HERE' на реальний ID користувача)
SELECT 
    gm.group_id,
    g.name as group_name,
    gm.role,
    gm.joined_at
FROM group_members gm
JOIN groups g ON gm.group_id = g.id
WHERE gm.user_id = 'USER_ID_HERE';

-- 8. Перевірка індексів
SELECT 
    indexname,
    tablename,
    indexdef
FROM pg_indexes
WHERE tablename IN ('groups', 'group_members')
ORDER BY tablename, indexname;

-- 9. Перевірка RLS політик
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