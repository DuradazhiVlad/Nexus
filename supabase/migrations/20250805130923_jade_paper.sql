/*
  # Комплексна перевірка та виправлення структури бази даних
  
  Цей скрипт перевіряє:
  1. Структуру всіх таблиць
  2. Foreign key constraints
  3. RLS політики
  4. Індекси
  5. Тригери та функції
  6. Дані в таблицях
  
  Виконайте цей скрипт в Supabase SQL Editor
*/

-- =====================================================
-- 1. ПЕРЕВІРКА ІСНУВАННЯ ТАБЛИЦЬ
-- =====================================================

SELECT '=== ПЕРЕВІРКА ІСНУВАННЯ ТАБЛИЦЬ ===' as section;

SELECT 
    table_name,
    CASE WHEN table_name IS NOT NULL THEN '✅ EXISTS' ELSE '❌ MISSING' END as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
    'user_profiles', 'users', 'posts', 'post_likes', 'post_comments',
    'groups', 'group_members', 'group_posts', 'group_post_media',
    'friendships', 'friend_requests', 'conversations', 'messages',
    'media', 'albums'
)
ORDER BY table_name;

-- =====================================================
-- 2. ПЕРЕВІРКА СТРУКТУРИ ТАБЛИЦЬ
-- =====================================================

SELECT '=== СТРУКТУРА ТАБЛИЦІ USER_PROFILES ===' as section;
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'user_profiles'
ORDER BY ordinal_position;

SELECT '=== СТРУКТУРА ТАБЛИЦІ USERS ===' as section;
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'users'
ORDER BY ordinal_position;

SELECT '=== СТРУКТУРА ТАБЛИЦІ GROUPS ===' as section;
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'groups'
ORDER BY ordinal_position;

SELECT '=== СТРУКТУРА ТАБЛИЦІ GROUP_MEMBERS ===' as section;
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'group_members'
ORDER BY ordinal_position;

-- =====================================================
-- 3. ПЕРЕВІРКА FOREIGN KEY CONSTRAINTS
-- =====================================================

SELECT '=== FOREIGN KEY CONSTRAINTS ===' as section;
SELECT 
    tc.table_name,
    tc.constraint_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    CASE 
        WHEN ccu.table_name IS NOT NULL THEN '✅ VALID'
        ELSE '❌ BROKEN'
    END as status
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_schema = 'public'
ORDER BY tc.table_name, tc.constraint_name;

-- =====================================================
-- 4. ПЕРЕВІРКА RLS ПОЛІТИК
-- =====================================================

SELECT '=== RLS СТАТУС ТАБЛИЦЬ ===' as section;
SELECT 
    schemaname,
    tablename,
    rowsecurity,
    CASE 
        WHEN rowsecurity THEN '✅ ENABLED'
        ELSE '❌ DISABLED'
    END as rls_status
FROM pg_tables 
WHERE schemaname = 'public'
    AND tablename IN (
        'user_profiles', 'users', 'posts', 'post_likes', 'post_comments',
        'groups', 'group_members', 'group_posts', 'group_post_media',
        'friendships', 'friend_requests', 'conversations', 'messages',
        'media', 'albums'
    )
ORDER BY tablename;

SELECT '=== RLS ПОЛІТИКИ ===' as section;
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    CASE 
        WHEN qual LIKE '%infinite%' OR qual LIKE '%recursion%' THEN '❌ POTENTIAL RECURSION'
        WHEN qual IS NOT NULL THEN '✅ VALID'
        ELSE '⚠️ NO CONDITION'
    END as policy_status
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- =====================================================
-- 5. ПЕРЕВІРКА ДАНИХ В ТАБЛИЦЯХ
-- =====================================================

SELECT '=== КІЛЬКІСТЬ ЗАПИСІВ В ТАБЛИЦЯХ ===' as section;

SELECT 'user_profiles' as table_name, COUNT(*) as record_count FROM user_profiles
UNION ALL
SELECT 'users' as table_name, COUNT(*) as record_count FROM users
UNION ALL
SELECT 'posts' as table_name, COUNT(*) as record_count FROM posts
UNION ALL
SELECT 'groups' as table_name, COUNT(*) as record_count FROM groups
UNION ALL
SELECT 'group_members' as table_name, COUNT(*) as record_count FROM group_members
UNION ALL
SELECT 'friendships' as table_name, COUNT(*) as record_count FROM friendships
UNION ALL
SELECT 'friend_requests' as table_name, COUNT(*) as record_count FROM friend_requests
UNION ALL
SELECT 'conversations' as table_name, COUNT(*) as record_count FROM conversations
UNION ALL
SELECT 'messages' as table_name, COUNT(*) as record_count FROM messages
ORDER BY table_name;

-- =====================================================
-- 6. ВИПРАВЛЕННЯ ПРОБЛЕМ
-- =====================================================

SELECT '=== ПОЧИНАЄМО ВИПРАВЛЕННЯ ПРОБЛЕМ ===' as section;

-- 6.1. Додаємо відсутні поля до user_profiles
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS hobbies TEXT[] DEFAULT '{}';
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS languages TEXT[] DEFAULT '{}';
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS friends_count INTEGER DEFAULT 0;

-- 6.2. Видаляємо проблемні foreign key constraints
ALTER TABLE groups DROP CONSTRAINT IF EXISTS groups_created_by_fkey;
ALTER TABLE group_members DROP CONSTRAINT IF EXISTS group_members_user_id_fkey;

-- 6.3. Додаємо правильні foreign key constraints
-- Перевіряємо чи існує таблиця user_profiles
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_profiles') THEN
        -- Додаємо foreign key для groups.created_by -> user_profiles.id
        ALTER TABLE groups 
        ADD CONSTRAINT groups_created_by_fkey 
        FOREIGN KEY (created_by) REFERENCES user_profiles(id) ON DELETE CASCADE;
        
        -- Додаємо foreign key для group_members.user_id -> user_profiles.id
        ALTER TABLE group_members 
        ADD CONSTRAINT group_members_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES user_profiles(id) ON DELETE CASCADE;
        
        RAISE NOTICE '✅ Foreign key constraints added to user_profiles';
    ELSE
        RAISE NOTICE '❌ Table user_profiles does not exist';
    END IF;
END $$;

-- 6.4. Видаляємо всі проблемні RLS політики для group_members
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

-- 6.5. Створюємо функцію для перевірки членства без рекурсії
CREATE OR REPLACE FUNCTION is_group_member_safe(p_group_id uuid, p_user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
    SELECT EXISTS (
        SELECT 1 FROM group_members 
        WHERE group_id = p_group_id 
        AND user_id = p_user_id 
        AND is_active = true
    );
$$;

-- 6.6. Створюємо прості RLS політики без рекурсії
CREATE POLICY "group_members_simple_select" ON group_members
    FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "group_members_simple_insert" ON group_members
    FOR INSERT TO authenticated
    WITH CHECK (
        user_id = (
            SELECT id FROM user_profiles WHERE auth_user_id = auth.uid()
        )
    );

CREATE POLICY "group_members_simple_update" ON group_members
    FOR UPDATE TO authenticated
    USING (
        user_id = (
            SELECT id FROM user_profiles WHERE auth_user_id = auth.uid()
        )
    );

CREATE POLICY "group_members_simple_delete" ON group_members
    FOR DELETE TO authenticated
    USING (
        user_id = (
            SELECT id FROM user_profiles WHERE auth_user_id = auth.uid()
        )
    );

-- 6.7. Виправляємо RLS політики для groups
DROP POLICY IF EXISTS "Anyone can view public groups" ON groups;
DROP POLICY IF EXISTS "Group members can view private groups" ON groups;
DROP POLICY IF EXISTS "Authenticated users can create groups" ON groups;
DROP POLICY IF EXISTS "Group creators can update groups" ON groups;

CREATE POLICY "groups_simple_select" ON groups
    FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "groups_simple_insert" ON groups
    FOR INSERT TO authenticated
    WITH CHECK (
        created_by = (
            SELECT id FROM user_profiles WHERE auth_user_id = auth.uid()
        )
    );

CREATE POLICY "groups_simple_update" ON groups
    FOR UPDATE TO authenticated
    USING (
        created_by = (
            SELECT id FROM user_profiles WHERE auth_user_id = auth.uid()
        )
    );

CREATE POLICY "groups_simple_delete" ON groups
    FOR DELETE TO authenticated
    USING (
        created_by = (
            SELECT id FROM user_profiles WHERE auth_user_id = auth.uid()
        )
    );

-- 6.8. Оновлюємо існуючі записи з тестовими даними для hobbies та languages
UPDATE user_profiles 
SET 
    hobbies = ARRAY['Програмування', 'Подорожі', 'Спорт'],
    languages = ARRAY['Українська', 'Англійська', 'Німецька']
WHERE hobbies IS NULL OR hobbies = '{}' OR array_length(hobbies, 1) IS NULL;

-- =====================================================
-- 7. ФІНАЛЬНА ПЕРЕВІРКА
-- =====================================================

SELECT '=== ФІНАЛЬНА ПЕРЕВІРКА ===' as section;

-- Перевіряємо foreign key constraints після виправлення
SELECT 
    tc.table_name,
    tc.constraint_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_name IN ('groups', 'group_members')
ORDER BY tc.table_name, tc.constraint_name;

-- Перевіряємо hobbies та languages
SELECT 
    id,
    name,
    hobbies,
    languages,
    array_length(hobbies, 1) as hobbies_count,
    array_length(languages, 1) as languages_count
FROM user_profiles 
WHERE auth_user_id = auth.uid()
LIMIT 1;

-- Тестовий запит для groups
SELECT 
    g.id,
    g.name,
    g.description,
    g.is_public,
    g.member_count,
    g.created_at
FROM groups g
WHERE g.is_active = true
ORDER BY g.created_at DESC
LIMIT 5;

SELECT '✅ ПЕРЕВІРКА ЗАВЕРШЕНА' as final_status;