-- Перевірка та додавання полів для профілю користувача
-- Виконайте цей скрипт в Supabase Dashboard SQL Editor

-- 1. Перевіряємо поточну структуру таблиці user_profiles
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'user_profiles'
ORDER BY ordinal_position;

-- 2. Додаємо відсутні поля якщо їх немає
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS education TEXT;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS hobbies TEXT[] DEFAULT '{}';
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS relationship_status TEXT;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS work TEXT;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS website TEXT;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS languages TEXT[] DEFAULT '{}';

-- 3. Перевіряємо оновлену структуру
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'user_profiles'
ORDER BY ordinal_position;

-- 4. Оновлюємо існуючі записи (додаємо тестові дані)
UPDATE user_profiles 
SET 
    education = 'Бакалавр',
    phone = '5875876987',
    hobbies = ARRAY['Програмування', 'Подорожі'],
    relationship_status = 'Одружений',
    work = 'Погана',
    website = 'duradazhivlad.github.io/Nexus',
    languages = ARRAY['Українська', 'Англійська']
WHERE id IN (SELECT id FROM user_profiles LIMIT 1);

-- 5. Перевіряємо результат
SELECT 
    id,
    name,
    last_name,
    email,
    bio,
    city,
    birth_date,
    education,
    phone,
    hobbies,
    relationship_status,
    work,
    website,
    languages
FROM user_profiles 
LIMIT 1; 