-- Fix registration to work without email confirmation
-- Run this script in your Supabase SQL Editor

-- 1. Check current auth configuration
SELECT 
    key,
    value
FROM auth.config 
WHERE key IN ('enable_signup', 'enable_confirmations', 'jwt_exp', 'site_url');

-- 2. Disable email confirmations (if possible via SQL)
-- Note: This might need to be done in Supabase Dashboard Settings
UPDATE auth.config 
SET value = 'false' 
WHERE key = 'enable_confirmations';

-- 3. Check if handle_new_user function exists
SELECT 
    routine_name,
    routine_definition
FROM information_schema.routines 
WHERE routine_name = 'handle_new_user';

-- 4. Create or update handle_new_user function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Create user profile automatically when user signs up
    INSERT INTO public.user_profiles (
        auth_user_id,
        name,
        last_name,
        email,
        hobbies,
        languages,
        notifications,
        privacy,
        email_verified,
        created_at,
        updated_at
    ) VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
        COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
        NEW.email,
        ARRAY[]::text[],
        ARRAY[]::text[],
        '{"email": true, "messages": true, "friendRequests": true}'::jsonb,
        '{"profileVisibility": "public", "showBirthDate": true, "showEmail": false}'::jsonb,
        true, -- Set as verified since we're not using email confirmation
        NOW(),
        NOW()
    )
    ON CONFLICT (auth_user_id) DO UPDATE SET
        name = EXCLUDED.name,
        last_name = EXCLUDED.last_name,
        email = EXCLUDED.email,
        email_verified = true,
        updated_at = NOW();
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Create trigger for new user registration
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- 6. Ensure RLS policies allow profile creation
DROP POLICY IF EXISTS "Users can insert own profile" ON public.user_profiles;
CREATE POLICY "Users can insert own profile"
    ON public.user_profiles
    FOR INSERT
    TO authenticated
    WITH CHECK (auth_user_id = auth.uid());

-- Also allow the trigger function to insert profiles
DROP POLICY IF EXISTS "System can create profiles" ON public.user_profiles;
CREATE POLICY "System can create profiles"
    ON public.user_profiles
    FOR INSERT
    TO service_role
    WITH CHECK (true);

-- 7. Test the registration flow
DO $$
DECLARE
    test_user_id uuid := gen_random_uuid();
    test_email text := 'test-registration@example.com';
BEGIN
    -- Simulate user creation (like Supabase Auth would do)
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
        NOW(), -- Email is confirmed immediately
        NOW(),
        NOW(),
        '{"name": "Test Registration", "last_name": "User"}'::jsonb
    );
    
    RAISE NOTICE 'Test user created: %', test_email;
    
    -- Check if profile was created automatically
    SELECT 
        up.id,
        up.name,
        up.last_name,
        up.email,
        up.email_verified,
        up.hobbies,
        up.languages
    FROM user_profiles up
    WHERE up.auth_user_id = test_user_id;
    
    -- Clean up test data
    DELETE FROM user_profiles WHERE auth_user_id = test_user_id;
    DELETE FROM auth.users WHERE id = test_user_id;
    
    RAISE NOTICE 'Test user cleaned up';
END $$;

-- 8. Check final structure
SELECT 'User profiles table structure:' as info;
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'user_profiles'
ORDER BY ordinal_position;

-- 9. Check RLS policies
SELECT 'RLS policies for user_profiles:' as info;
SELECT 
    policyname,
    cmd,
    permissive,
    roles,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'user_profiles'
ORDER BY policyname;

-- 10. Verify triggers
SELECT 'Triggers on auth.users:' as info;
SELECT 
    trigger_name,
    event_manipulation,
    action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'users' AND event_object_schema = 'auth';