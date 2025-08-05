-- Fix registration triggers and user profile creation
-- This migration ensures proper user profile creation during registration

-- 1. Create handle_new_user function
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Create user profile in user_profiles table
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

-- 2. Drop existing triggers if they exist
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_confirmed ON auth.users;

-- 3. Create trigger for profile creation during registration
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_user();

-- 4. Create trigger for email confirmation
CREATE TRIGGER on_auth_user_confirmed
    AFTER UPDATE ON auth.users
    FOR EACH ROW
    WHEN (OLD.email_confirmed_at IS NULL AND NEW.email_confirmed_at IS NOT NULL)
    EXECUTE FUNCTION handle_new_user();

-- 5. Ensure RLS policies for user_profiles
DO $$
BEGIN
    -- Allow users to view all profiles
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'user_profiles' AND policyname = 'Users can view all profiles'
    ) THEN
        CREATE POLICY "Users can view all profiles"
            ON user_profiles FOR SELECT
            TO authenticated
            USING (true);
    END IF;

    -- Allow users to update their own profile
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

    -- Allow users to insert their own profile
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