-- Populate Hobbies and Languages for Current User
-- Run this script in your Supabase SQL Editor

-- First, let's see what the current user's profile looks like
SELECT 
    id,
    name,
    email,
    hobbies,
    languages,
    created_at
FROM user_profiles 
WHERE auth_user_id = auth.uid()
LIMIT 1;

-- Update the current user's profile with sample hobbies and languages
UPDATE user_profiles 
SET 
    hobbies = ARRAY['Програмування', 'Подорожі', 'Спорт', 'Музика'],
    languages = ARRAY['Українська', 'Англійська', 'Німецька'],
    updated_at = NOW()
WHERE auth_user_id = auth.uid();

-- Verify the update
SELECT 
    id,
    name,
    email,
    hobbies,
    languages,
    updated_at
FROM user_profiles 
WHERE auth_user_id = auth.uid()
LIMIT 1;

-- Check the data types to make sure they're arrays
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'user_profiles'
AND column_name IN ('hobbies', 'languages')
ORDER BY column_name; 