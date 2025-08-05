-- Тестування реєстрації та перевірка структури таблиць
-- Виконайте цей скрипт в Supabase Dashboard SQL Editor

-- 1. Перевіряємо структуру таблиці auth.users
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'users' AND table_schema = 'auth'
ORDER BY ordinal_position;

-- 2. Перевіряємо структуру таблиці user_profiles
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'user_profiles'
ORDER BY ordinal_position;

-- 3. Перевіряємо кількість користувачів в auth.users
SELECT COUNT(*) as auth_users_count FROM auth.users;

-- 4. Перевіряємо кількість профілів в user_profiles
SELECT COUNT(*) as user_profiles_count FROM user_profiles;

-- 5. Перевіряємо останні 5 записів в auth.users
SELECT 
    id,
    email,
    email_confirmed_at,
    created_at,
    raw_user_meta_data
FROM auth.users 
ORDER BY created_at DESC 
LIMIT 5;

-- 6. Перевіряємо останні 5 записів в user_profiles
SELECT 
    id,
    auth_user_id,
    name,
    last_name,
    email,
    created_at,
    hobbies,
    languages,
    notifications,
    privacy
FROM user_profiles 
ORDER BY created_at DESC 
LIMIT 5;

-- 7. Перевіряємо зв'язок між auth.users та user_profiles
SELECT 
    au.id as auth_user_id,
    au.email as auth_email,
    au.created_at as auth_created_at,
    up.id as profile_id,
    up.name as profile_name,
    up.last_name as profile_last_name,
    up.email as profile_email,
    up.created_at as profile_created_at
FROM auth.users au
LEFT JOIN user_profiles up ON au.id = up.auth_user_id
ORDER BY au.created_at DESC
LIMIT 10;

-- 8. Перевіряємо користувачів без профілів
SELECT 
    au.id,
    au.email,
    au.created_at
FROM auth.users au
LEFT JOIN user_profiles up ON au.id = up.auth_user_id
WHERE up.id IS NULL
ORDER BY au.created_at DESC;

-- 9. Перевіряємо профілі без auth користувачів (не повинно бути)
SELECT 
    up.id,
    up.auth_user_id,
    up.name,
    up.email
FROM user_profiles up
LEFT JOIN auth.users au ON up.auth_user_id = au.id
WHERE au.id IS NULL;

-- 10. Перевіряємо RLS політики для user_profiles
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

-- 11. Тестуємо створення нового користувача (симуляція)
-- Це тільки для тестування - не виконуйте в продакшені
DO $$
DECLARE
    test_user_id uuid := gen_random_uuid();
    test_email text := 'test@example.com';
BEGIN
    -- Вставляємо тестового користувача в auth.users
    INSERT INTO auth.users (
        id,
        email,
        encrypted_password,
        email_confirmed_at,
        created_at,
        updated_at,
        raw_user_meta_data
    ) VALUES (
        test_user_id,
        test_email,
        'encrypted_password_here',
        NOW(),
        NOW(),
        NOW(),
        '{"name": "Test User", "lastname": "Test Lastname"}'::jsonb
    );
    
    -- Вставляємо профіль користувача
    INSERT INTO user_profiles (
        auth_user_id,
        name,
        last_name,
        email,
        hobbies,
        languages,
        notifications,
        privacy,
        created_at,
        updated_at
    ) VALUES (
        test_user_id,
        'Test User',
        'Test Lastname',
        test_email,
        ARRAY['Програмування', 'Подорожі'],
        ARRAY['Українська', 'Англійська'],
        '{"email": true, "messages": true, "friendRequests": true}'::jsonb,
        '{"profileVisibility": "public", "showBirthDate": true, "showEmail": false}'::jsonb,
        NOW(),
        NOW()
    );
    
    RAISE NOTICE 'Test user created with ID: %', test_user_id;
    
    -- Перевіряємо створений запис
    SELECT 
        au.id,
        au.email,
        up.name,
        up.last_name,
        up.hobbies,
        up.languages
    FROM auth.users au
    JOIN user_profiles up ON au.id = up.auth_user_id
    WHERE au.id = test_user_id;
    
    -- Видаляємо тестового користувача
    DELETE FROM user_profiles WHERE auth_user_id = test_user_id;
    DELETE FROM auth.users WHERE id = test_user_id;
    
    RAISE NOTICE 'Test user cleaned up';
END $$; 