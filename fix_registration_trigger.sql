-- Виправлення реєстрації та створення тригерів
-- Виконайте цей скрипт в Supabase Dashboard SQL Editor

-- 1. Створюємо функцію handle_new_user
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Створюємо профіль користувача в таблиці user_profiles
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
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
        COALESCE(NEW.raw_user_meta_data->>'lastname', ''),
        NEW.email,
        ARRAY[]::text[],
        ARRAY[]::text[],
        '{"email": true, "messages": true, "friendRequests": true}'::jsonb,
        '{"profileVisibility": "public", "showBirthDate": true, "showEmail": false}'::jsonb,
        NOW(),
        NOW()
    )
    ON CONFLICT (auth_user_id) DO NOTHING;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Видаляємо старі тригери якщо вони існують
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_confirmed ON auth.users;

-- 3. Створюємо тригер для створення профілю при реєстрації
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_user();

-- 4. Створюємо тригер для підтвердження email
CREATE TRIGGER on_auth_user_confirmed
    AFTER UPDATE ON auth.users
    FOR EACH ROW
    WHEN (OLD.email_confirmed_at IS NULL AND NEW.email_confirmed_at IS NOT NULL)
    EXECUTE FUNCTION handle_new_user();

-- 5. Перевіряємо структуру таблиці user_profiles
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'user_profiles'
ORDER BY ordinal_position;

-- 6. Перевіряємо RLS політики для user_profiles
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

-- 7. Створюємо RLS політики для user_profiles якщо їх немає
DO $$
BEGIN
    -- Дозволити користувачам переглядати всі профілі
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'user_profiles' AND policyname = 'Users can view all profiles'
    ) THEN
        CREATE POLICY "Users can view all profiles"
            ON user_profiles FOR SELECT
            TO authenticated
            USING (true);
    END IF;

    -- Дозволити користувачам оновлювати свій профіль
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'user_profiles' AND policyname = 'Users can update own profile'
    ) THEN
        CREATE POLICY "Users can update own profile"
            ON user_profiles FOR UPDATE
            TO authenticated
            USING (auth_user_id = auth.uid())
            WITH CHECK (auth_user_id = auth.uid());
    END IF;

    -- Дозволити користувачам створювати свій профіль
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'user_profiles' AND policyname = 'Users can insert own profile'
    ) THEN
        CREATE POLICY "Users can insert own profile"
            ON user_profiles FOR INSERT
            TO authenticated
            WITH CHECK (auth_user_id = auth.uid());
    END IF;
END $$;

-- 8. Перевіряємо тригери
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'users' AND event_object_schema = 'auth';

-- 9. Тестуємо функцію (симуляція)
DO $$
DECLARE
    test_user_id uuid := gen_random_uuid();
    test_email text := 'test@example.com';
BEGIN
    -- Вставляємо тестового користувача
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
    
    RAISE NOTICE 'Test user created with ID: %', test_user_id;
    
    -- Перевіряємо, чи створився профіль
    SELECT 
        up.id,
        up.name,
        up.last_name,
        up.email,
        up.hobbies,
        up.languages
    FROM user_profiles up
    WHERE up.auth_user_id = test_user_id;
    
    -- Видаляємо тестового користувача
    DELETE FROM user_profiles WHERE auth_user_id = test_user_id;
    DELETE FROM auth.users WHERE id = test_user_id;
    
    RAISE NOTICE 'Test user cleaned up';
END $$; 