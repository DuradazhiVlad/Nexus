/*
  # Виправлення foreign key constraint для groups.created_by
  
  Проблема: Supabase не може знайти зв'язок між groups та user_profiles
  Рішення: Змінити foreign key constraint щоб посилатися на таблицю users
*/

-- 1. Перевіримо поточні foreign key constraints для groups
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
WHERE tc.table_name = 'groups'
    AND tc.constraint_type = 'FOREIGN KEY';

-- 2. Перевіримо чи існує таблиця users
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'users'
) as users_exists;

-- 3. Перевіримо структуру таблиці users
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'users'
ORDER BY ordinal_position;

-- 4. Видалимо старі foreign key constraints
ALTER TABLE groups DROP CONSTRAINT IF EXISTS groups_created_by_fkey;
ALTER TABLE group_members DROP CONSTRAINT IF EXISTS group_members_user_id_fkey;

-- 5. Додамо нові foreign key constraints що посилаються на users
DO $$
BEGIN
    -- Перевіримо чи існує таблиця users
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users') THEN
        -- Перевіримо чи існує колонка id в users
        IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'id') THEN
            -- Додаємо foreign key constraint для groups.created_by
            ALTER TABLE groups 
            ADD CONSTRAINT groups_created_by_fkey 
            FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE;
            
            -- Додаємо foreign key constraint для group_members.user_id
            ALTER TABLE group_members 
            ADD CONSTRAINT group_members_user_id_fkey 
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
            
            RAISE NOTICE 'Foreign key constraints added successfully to users table';
        ELSE
            RAISE NOTICE 'Column id does not exist in users table';
        END IF;
    ELSE
        RAISE NOTICE 'Table users does not exist';
    END IF;
END $$;

-- 6. Перевіримо результат
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
WHERE tc.table_name IN ('groups', 'group_members')
    AND tc.constraint_type = 'FOREIGN KEY';

-- 7. Тестовий запит для перевірки
SELECT 
    g.id,
    g.name,
    g.created_by,
    u.name as creator_name,
    u.lastname as creator_lastname
FROM groups g
LEFT JOIN users u ON g.created_by = u.id
LIMIT 5;

-- 8. Перевіримо чи є дані в таблиці users
SELECT COUNT(*) as users_count FROM users;

-- 9. Перевіримо чи є дані в таблиці groups
SELECT COUNT(*) as groups_count FROM groups; 