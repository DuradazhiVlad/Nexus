-- Перевірка та виправлення таблиці user_profiles
-- Виконайте цей скрипт в Supabase Dashboard SQL Editor

-- 1. Перевіряємо структуру таблиці user_profiles
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'user_profiles'
ORDER BY ordinal_position;

-- 2. Перевіряємо, чи є дані в таблиці
SELECT COUNT(*) as total_users FROM user_profiles;

-- 3. Перевіряємо перші кілька записів
SELECT 
    id,
    auth_user_id,
    name,
    last_name,
    email,
    created_at
FROM user_profiles 
LIMIT 5;

-- 4. Якщо таблиця порожня, створюємо тестові дані
INSERT INTO user_profiles (
    auth_user_id,
    name,
    last_name,
    email,
    avatar,
    bio,
    city,
    birth_date,
    email_verified,
    created_at,
    updated_at,
    notifications,
    privacy
) VALUES 
(
    gen_random_uuid(),
    'Іван',
    'Петренко',
    'ivan.petrenko@example.com',
    NULL,
    'Привіт! Я Іван, люблю програмування та подорожі.',
    'Київ',
    '1990-05-15',
    true,
    NOW(),
    NOW(),
    '{"email": true, "messages": true, "friendRequests": true}'::jsonb,
    '{"profileVisibility": "public", "showBirthDate": true, "showEmail": false}'::jsonb
),
(
    gen_random_uuid(),
    'Марія',
    'Іваненко',
    'maria.ivanenko@example.com',
    NULL,
    'Привіт! Я Марія, дизайнер та художниця.',
    'Львів',
    '1988-12-03',
    true,
    NOW(),
    NOW(),
    '{"email": true, "messages": true, "friendRequests": true}'::jsonb,
    '{"profileVisibility": "public", "showBirthDate": true, "showEmail": false}'::jsonb
)
ON CONFLICT (email) DO NOTHING;

-- 5. Перевіряємо RLS політики
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
WHERE tablename = 'user_profiles';

-- 6. Якщо RLS політики відсутні, створюємо їх
DO $$
BEGIN
    -- Дозволити всім авторизованим користувачам переглядати профілі
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'user_profiles' 
        AND policyname = 'Allow authenticated users to view profiles'
    ) THEN
        CREATE POLICY "Allow authenticated users to view profiles"
        ON user_profiles FOR SELECT
        TO authenticated
        USING (true);
    END IF;

    -- Дозволити власнику профілю редагувати свій профіль
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'user_profiles' 
        AND policyname = 'Allow profile owner to update'
    ) THEN
        CREATE POLICY "Allow profile owner to update"
        ON user_profiles FOR UPDATE
        TO authenticated
        USING (auth_user_id = auth.uid())
        WITH CHECK (auth_user_id = auth.uid());
    END IF;

    -- Дозволити авторизованим користувачам створювати профілі
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'user_profiles' 
        AND policyname = 'Allow authenticated users to insert profiles'
    ) THEN
        CREATE POLICY "Allow authenticated users to insert profiles"
        ON user_profiles FOR INSERT
        TO authenticated
        WITH CHECK (auth_user_id = auth.uid());
    END IF;
END $$;

-- 7. Фінальна перевірка
SELECT 
    'Total users in user_profiles:' as info,
    COUNT(*) as count
FROM user_profiles
UNION ALL
SELECT 
    'Users with valid auth_user_id:' as info,
    COUNT(*) as count
FROM user_profiles 
WHERE auth_user_id IS NOT NULL
UNION ALL
SELECT 
    'Users with names:' as info,
    COUNT(*) as count
FROM user_profiles 
WHERE name IS NOT NULL AND name != ''; 