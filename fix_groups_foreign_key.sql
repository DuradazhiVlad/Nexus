/*
  # Виправлення foreign key constraint для groups.created_by
  
  Проблема: Supabase не може знайти зв'язок між groups та user_profiles
  Рішення: Перевірити та виправити foreign key constraint
*/

-- 1. Перевіримо поточні foreign key constraints
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

-- 2. Перевіримо чи існує таблиця user_profiles
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'user_profiles'
) as user_profiles_exists;

-- 3. Перевіримо структуру таблиці user_profiles
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'user_profiles'
ORDER BY ordinal_position;

-- 4. Видалимо старий foreign key constraint якщо він існує
ALTER TABLE groups DROP CONSTRAINT IF EXISTS groups_created_by_fkey;

-- 5. Додамо новий foreign key constraint
DO $$
BEGIN
    -- Перевіримо чи існує таблиця user_profiles
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_profiles') THEN
        -- Перевіримо чи існує колонка id в user_profiles
        IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'id') THEN
            -- Додаємо foreign key constraint
            ALTER TABLE groups 
            ADD CONSTRAINT groups_created_by_fkey 
            FOREIGN KEY (created_by) REFERENCES user_profiles(id) ON DELETE CASCADE;
            
            RAISE NOTICE 'Foreign key constraint groups_created_by_fkey added successfully';
        ELSE
            RAISE NOTICE 'Column id does not exist in user_profiles table';
        END IF;
    ELSE
        RAISE NOTICE 'Table user_profiles does not exist';
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
WHERE tc.table_name = 'groups'
    AND tc.constraint_type = 'FOREIGN KEY';

-- 7. Тестовий запит для перевірки
SELECT 
    g.id,
    g.name,
    g.created_by,
    up.name as creator_name,
    up.last_name as creator_last_name
FROM groups g
LEFT JOIN user_profiles up ON g.created_by = up.id
LIMIT 5; 