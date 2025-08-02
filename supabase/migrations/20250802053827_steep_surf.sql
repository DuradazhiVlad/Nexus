-- Check and fix hobbies and languages structure
-- Execute this script in Supabase Dashboard SQL Editor

-- 1. Check current table structure for hobbies and languages columns
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'user_profiles' 
AND column_name IN ('hobbies', 'languages')
ORDER BY column_name;

-- 2. Add hobbies column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_profiles' AND column_name = 'hobbies'
    ) THEN
        ALTER TABLE user_profiles ADD COLUMN hobbies TEXT[] DEFAULT '{}';
        RAISE NOTICE 'Added hobbies column';
    ELSE
        RAISE NOTICE 'Hobbies column already exists';
    END IF;
END $$;

-- 3. Add languages column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_profiles' AND column_name = 'languages'
    ) THEN
        ALTER TABLE user_profiles ADD COLUMN languages TEXT[] DEFAULT '{}';
        RAISE NOTICE 'Added languages column';
    ELSE
        RAISE NOTICE 'Languages column already exists';
    END IF;
END $$;

-- 4. Update existing records with sample data if they're null or empty
UPDATE user_profiles 
SET 
    hobbies = ARRAY['Програмування', 'Подорожі', 'Спорт']
WHERE hobbies IS NULL OR hobbies = '{}' OR array_length(hobbies, 1) IS NULL;

UPDATE user_profiles 
SET 
    languages = ARRAY['Українська', 'Англійська']
WHERE languages IS NULL OR languages = '{}' OR array_length(languages, 1) IS NULL;

-- 5. Verify the structure and data
SELECT 
    id,
    name,
    last_name,
    hobbies,
    languages,
    array_length(hobbies, 1) as hobbies_count,
    array_length(languages, 1) as languages_count
FROM user_profiles 
WHERE auth_user_id = auth.uid()
LIMIT 1;

-- 6. Check all users to see the data
SELECT 
    COUNT(*) as total_users,
    COUNT(CASE WHEN hobbies IS NOT NULL AND array_length(hobbies, 1) > 0 THEN 1 END) as users_with_hobbies,
    COUNT(CASE WHEN languages IS NOT NULL AND array_length(languages, 1) > 0 THEN 1 END) as users_with_languages
FROM user_profiles;