-- Виправлення конфлікту таблиць та RLS політик
-- Виконайте цей скрипт в Supabase Dashboard SQL Editor

-- 1. Спочатку видаляємо зайву таблицю users (якщо вона не використовується)
-- УВАГА: Це видалить всі дані з таблиці users!
-- Виконайте тільки якщо ви впевнені, що таблиця users не потрібна

-- Перевіряємо, чи є дані в таблиці users
SELECT COUNT(*) as users_count FROM public.users;

-- Якщо таблиця users порожня або не використовується, видаляємо її
-- DROP TABLE IF EXISTS public.users CASCADE;

-- 2. Видаляємо старі RLS політики для user_profiles
DROP POLICY IF EXISTS "Users can view all profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.user_profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.user_profiles;
DROP POLICY IF EXISTS "Enable update for users based on auth_user_id" ON public.user_profiles;

-- 3. Включаємо RLS для user_profiles
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- 4. Створюємо нові RLS політики для user_profiles
-- Політика для перегляду всіх профілів
CREATE POLICY "Users can view all profiles"
    ON public.user_profiles
    FOR SELECT
    TO authenticated
    USING (true);

-- Політика для створення профілю (тільки для себе)
CREATE POLICY "Users can insert own profile"
    ON public.user_profiles
    FOR INSERT
    TO authenticated
    WITH CHECK (auth_user_id = auth.uid());

-- Політика для оновлення профілю (тільки свого)
CREATE POLICY "Users can update own profile"
    ON public.user_profiles
    FOR UPDATE
    TO authenticated
    USING (auth_user_id = auth.uid())
    WITH CHECK (auth_user_id = auth.uid());

-- Політика для видалення профілю (тільки свого)
CREATE POLICY "Users can delete own profile"
    ON public.user_profiles
    FOR DELETE
    TO authenticated
    USING (auth_user_id = auth.uid());

-- 5. Перевіряємо структуру таблиці user_profiles
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'user_profiles' AND table_schema = 'public'
ORDER BY ordinal_position;

-- 6. Перевіряємо RLS політики
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
WHERE tablename = 'user_profiles'
ORDER BY policyname;

-- 7. Перевіряємо тригери
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'users' AND event_object_schema = 'auth';

-- 8. Перевіряємо функцію handle_new_user
SELECT 
    routine_name,
    routine_definition
FROM information_schema.routines 
WHERE routine_name = 'handle_new_user';

-- 9. Тестуємо створення користувача
DO $$
DECLARE
    test_user_id uuid := gen_random_uuid();
    test_email text := 'test-fix@example.com';
BEGIN
    -- Створюємо тестового користувача в auth.users
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
        crypt('testpassword123', gen_salt('bf')),
        NOW(),
        NOW(),
        NOW(),
        '{"name": "Test Fix User", "lastname": "Test Lastname"}'::jsonb
    );
    
    RAISE NOTICE 'Test user created: %', test_email;
    
    -- Перевіряємо, чи створився профіль автоматично
    SELECT 
        up.id,
        up.name,
        up.last_name,
        up.email,
        up.auth_user_id
    FROM user_profiles up
    WHERE up.auth_user_id = test_user_id;
    
    -- Видаляємо тестового користувача
    DELETE FROM user_profiles WHERE auth_user_id = test_user_id;
    DELETE FROM auth.users WHERE id = test_user_id;
    
    RAISE NOTICE 'Test user cleaned up';
END $$;

-- 10. Перевіряємо зв'язок між auth.users та user_profiles
SELECT 
    au.id as auth_user_id,
    au.email as auth_email,
    up.id as profile_id,
    up.name as profile_name,
    up.last_name as profile_last_name
FROM auth.users au
LEFT JOIN user_profiles up ON au.id = up.auth_user_id
ORDER BY au.created_at DESC
LIMIT 10;

-- 11. Перевіряємо користувачів без профілів
SELECT 
    au.id,
    au.email,
    au.created_at
FROM auth.users au
LEFT JOIN user_profiles up ON au.id = up.auth_user_id
WHERE up.id IS NULL
ORDER BY au.created_at DESC;

-- 12. Якщо є користувачі без профілів, створюємо їм профілі
DO $$
DECLARE
    user_record RECORD;
BEGIN
    FOR user_record IN 
        SELECT au.id, au.email, au.raw_user_meta_data
        FROM auth.users au
        LEFT JOIN user_profiles up ON au.id = up.auth_user_id
        WHERE up.id IS NULL
    LOOP
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
            user_record.id,
            COALESCE(user_record.raw_user_meta_data->>'name', user_record.raw_user_meta_data->>'full_name', split_part(user_record.email, '@', 1)),
            COALESCE(user_record.raw_user_meta_data->>'lastname', ''),
            user_record.email,
            ARRAY[]::text[],
            ARRAY[]::text[],
            '{"email": true, "messages": true, "friendRequests": true}'::jsonb,
            '{"profileVisibility": "public", "showBirthDate": true, "showEmail": false}'::jsonb,
            NOW(),
            NOW()
        );
        
        RAISE NOTICE 'Created profile for user: %', user_record.email;
    END LOOP;
END $$; 