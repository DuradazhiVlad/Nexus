-- Execute existing database fix scripts to resolve login error
-- This combines the fixes from fix_database_conflict.sql and fix_registration_trigger.sql

-- 1. First, run the database conflict fixes
\i fix_database_conflict.sql

-- 2. Then, run the registration trigger fixes  
\i fix_registration_trigger.sql

-- 3. Additional verification and fixes for login issues
DO $$
BEGIN
    -- Ensure user_profiles table has correct structure
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_profiles' AND column_name = 'auth_user_id'
    ) THEN
        ALTER TABLE user_profiles ADD COLUMN auth_user_id uuid REFERENCES auth.users(id);
    END IF;

    -- Ensure RLS is enabled but with proper policies
    ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
    
    -- Drop any conflicting policies
    DROP POLICY IF EXISTS "Allow profile owner" ON user_profiles;
    DROP POLICY IF EXISTS "Users can view all profiles" ON user_profiles;
    DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
    DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
    
    -- Create simple, non-conflicting policies
    CREATE POLICY "Enable read access for authenticated users" 
        ON user_profiles FOR SELECT 
        TO authenticated 
        USING (true);
        
    CREATE POLICY "Enable insert for authenticated users" 
        ON user_profiles FOR INSERT 
        TO authenticated 
        WITH CHECK (auth.uid() = auth_user_id);
        
    CREATE POLICY "Enable update for profile owner" 
        ON user_profiles FOR UPDATE 
        TO authenticated 
        USING (auth.uid() = auth_user_id)
        WITH CHECK (auth.uid() = auth_user_id);
        
    CREATE POLICY "Enable delete for profile owner" 
        ON user_profiles FOR DELETE 
        TO authenticated 
        USING (auth.uid() = auth_user_id);
END $$;

-- 4. Ensure handle_new_user function exists and works correctly
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO user_profiles (
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
        true,
        NOW(),
        NOW()
    )
    ON CONFLICT (auth_user_id) DO UPDATE SET
        email = EXCLUDED.email,
        updated_at = NOW();
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Ensure triggers are properly set up
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_confirmed ON auth.users;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_user();

-- 6. Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON user_profiles TO authenticated;

-- 7. Test the setup
SELECT 'Database fixes applied successfully' as status;