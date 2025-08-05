-- Тестування функціональності входу та скидання пароля
-- Виконайте цей скрипт в Supabase Dashboard SQL Editor

-- 1. Перевіряємо налаштування аутентифікації
SELECT 
    key,
    value
FROM auth.config 
WHERE key IN ('enable_signup', 'enable_confirmations', 'enable_password_reset');

-- 2. Перевіряємо email шаблони
SELECT 
    template_name,
    subject,
    content_html IS NOT NULL as has_html_content,
    content_text IS NOT NULL as has_text_content
FROM auth.email_templates 
WHERE template_name IN ('confirm_signup', 'reset_password', 'change_email');

-- 3. Перевіряємо останні спроби входу
SELECT 
    id,
    email,
    created_at,
    confirmed_at,
    last_sign_in_at,
    email_confirmed_at
FROM auth.users 
ORDER BY created_at DESC 
LIMIT 10;

-- 4. Перевіряємо токени скидання пароля
SELECT 
    id,
    user_id,
    token_hash,
    type,
    created_at,
    expires_at
FROM auth.refresh_tokens 
WHERE type = 'recovery'
ORDER BY created_at DESC 
LIMIT 5;

-- 5. Перевіряємо налаштування SMTP (якщо доступно)
-- Це може бути недоступно в Supabase Dashboard
SELECT 
    key,
    value
FROM auth.config 
WHERE key LIKE '%smtp%' OR key LIKE '%email%';

-- 6. Тестуємо створення користувача для тестування входу
DO $$
DECLARE
    test_user_id uuid := gen_random_uuid();
    test_email text := 'test-login@example.com';
    test_password_hash text := crypt('testpassword123', gen_salt('bf'));
BEGIN
    -- Створюємо тестового користувача
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
        test_password_hash,
        NOW(),
        NOW(),
        NOW(),
        '{"name": "Test Login User", "lastname": "Test Lastname"}'::jsonb
    );
    
    -- Створюємо профіль користувача
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
        'Test Login User',
        'Test Lastname',
        test_email,
        ARRAY['Тестування'],
        ARRAY['Українська'],
        '{"email": true, "messages": true, "friendRequests": true}'::jsonb,
        '{"profileVisibility": "public", "showBirthDate": true, "showEmail": false}'::jsonb,
        NOW(),
        NOW()
    );
    
    RAISE NOTICE 'Test user created for login testing: %', test_email;
    RAISE NOTICE 'Password: testpassword123';
    
    -- Перевіряємо створений запис
    SELECT 
        au.id,
        au.email,
        au.email_confirmed_at,
        up.name,
        up.last_name
    FROM auth.users au
    JOIN user_profiles up ON au.id = up.auth_user_id
    WHERE au.id = test_user_id;
    
    -- НЕ видаляємо тестового користувача - він потрібен для тестування
    -- DELETE FROM user_profiles WHERE auth_user_id = test_user_id;
    -- DELETE FROM auth.users WHERE id = test_user_id;
    
END $$;

-- 7. Перевіряємо RLS політики для аутентифікації
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
WHERE tablename IN ('users', 'user_profiles')
ORDER BY tablename, policyname;

-- 8. Перевіряємо функції аутентифікації
SELECT 
    routine_name,
    routine_type,
    data_type
FROM information_schema.routines 
WHERE routine_name LIKE '%auth%' OR routine_name LIKE '%login%' OR routine_name LIKE '%password%'
ORDER BY routine_name;

-- 9. Тестуємо функцію скидання пароля (симуляція)
DO $$
DECLARE
    test_user_id uuid;
    test_email text := 'test-login@example.com';
    recovery_token text := 'test-recovery-token-' || gen_random_uuid()::text;
BEGIN
    -- Знаходимо тестового користувача
    SELECT id INTO test_user_id FROM auth.users WHERE email = test_email;
    
    IF test_user_id IS NOT NULL THEN
        -- Створюємо токен скидання пароля
        INSERT INTO auth.refresh_tokens (
            id,
            user_id,
            token_hash,
            type,
            created_at,
            expires_at
        ) VALUES (
            gen_random_uuid(),
            test_user_id,
            crypt(recovery_token, gen_salt('bf')),
            'recovery',
            NOW(),
            NOW() + INTERVAL '1 hour'
        );
        
        RAISE NOTICE 'Recovery token created for user: %', test_email;
        RAISE NOTICE 'Token: %', recovery_token;
        
        -- Перевіряємо токен
        SELECT 
            rt.id,
            rt.type,
            rt.created_at,
            rt.expires_at,
            u.email
        FROM auth.refresh_tokens rt
        JOIN auth.users u ON rt.user_id = u.id
        WHERE rt.type = 'recovery' AND u.email = test_email
        ORDER BY rt.created_at DESC
        LIMIT 1;
        
    ELSE
        RAISE NOTICE 'Test user not found: %', test_email;
    END IF;
END $$;

-- 10. Перевіряємо статистику входів
SELECT 
    DATE(created_at) as date,
    COUNT(*) as new_users,
    COUNT(CASE WHEN email_confirmed_at IS NOT NULL THEN 1 END) as confirmed_users
FROM auth.users 
WHERE created_at >= NOW() - INTERVAL '7 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- 11. Перевіряємо активні сесії
SELECT 
    COUNT(*) as active_sessions,
    COUNT(DISTINCT user_id) as unique_users
FROM auth.sessions 
WHERE expires_at > NOW();

-- 12. Очищення тестових даних (виконайте після тестування)
-- DO $$
-- DECLARE
--     test_email text := 'test-login@example.com';
--     test_user_id uuid;
-- BEGIN
--     SELECT id INTO test_user_id FROM auth.users WHERE email = test_email;
--     
--     IF test_user_id IS NOT NULL THEN
--         DELETE FROM auth.refresh_tokens WHERE user_id = test_user_id;
--         DELETE FROM user_profiles WHERE auth_user_id = test_user_id;
--         DELETE FROM auth.users WHERE id = test_user_id;
--         RAISE NOTICE 'Test user cleaned up: %', test_email;
--     END IF;
-- END $$; 