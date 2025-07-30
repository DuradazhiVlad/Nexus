-- Перевірка повної структури таблиці user_profiles
-- Виконайте цей скрипт в Supabase Dashboard SQL Editor

-- 1. Перевіряємо повну структуру таблиці user_profiles
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default,
    character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'user_profiles'
ORDER BY ordinal_position;

-- 2. Перевіряємо приклад запису
SELECT 
    id,
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
FROM user_profiles 
LIMIT 1;

-- 3. Перевіряємо кількість записів
SELECT COUNT(*) as total_users FROM user_profiles;

-- 4. Перевіряємо унікальні значення в полях
SELECT 
    'auth_user_id' as field,
    COUNT(DISTINCT auth_user_id) as unique_values,
    COUNT(*) as total_records
FROM user_profiles
UNION ALL
SELECT 
    'email' as field,
    COUNT(DISTINCT email) as unique_values,
    COUNT(*) as total_records
FROM user_profiles;

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

-- 6. Перевіряємо індекси
SELECT 
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename = 'user_profiles'; 