-- Fix Hobbies and Languages Columns
-- Run this script in your Supabase SQL Editor

-- 1. Check current table structure
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
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS hobbies TEXT[] DEFAULT '{}';

-- 3. Add languages column if it doesn't exist
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS languages TEXT[] DEFAULT '{}';

-- 4. Update existing records with sample data if they're null
UPDATE user_profiles 
SET 
    hobbies = ARRAY['Програмування', 'Подорожі']
WHERE hobbies IS NULL OR hobbies = '{}';

UPDATE user_profiles 
SET 
    languages = ARRAY['Українська', 'Англійська']
WHERE languages IS NULL OR languages = '{}';

-- 5. Verify the structure again
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'user_profiles' 
AND column_name IN ('hobbies', 'languages')
ORDER BY column_name;

-- 6. Check sample data
SELECT 
    id,
    name,
    hobbies,
    languages
FROM user_profiles 
LIMIT 3;

-- 7. Test inserting a new record with hobbies and languages
INSERT INTO user_profiles (
    auth_user_id,
    name,
    email,
    hobbies,
    languages
) VALUES (
    'test-user-id',
    'Test User',
    'test@example.com',
    ARRAY['Спорт', 'Музика'],
    ARRAY['Українська', 'Англійська', 'Німецька']
) ON CONFLICT (auth_user_id) DO NOTHING;

-- 8. Verify the test record
SELECT 
    id,
    name,
    hobbies,
    languages
FROM user_profiles 
WHERE auth_user_id = 'test-user-id';

-- 9. Clean up test record
DELETE FROM user_profiles WHERE auth_user_id = 'test-user-id'; 