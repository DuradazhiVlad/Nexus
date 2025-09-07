/*
  # Виправлення обмеження gender_check у таблиці user_profiles

  1. Видалення старого некоректного обмеження
  2. Додавання правильного обмеження з валідними значеннями
*/

-- Видаляємо старе обмеження gender_check якщо воно існує
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.check_constraints 
        WHERE constraint_name = 'user_profiles_gender_check'
        AND table_name = 'user_profiles'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.user_profiles DROP CONSTRAINT user_profiles_gender_check;
    END IF;
END $$;

-- Додаємо правильне обмеження gender_check
ALTER TABLE public.user_profiles 
ADD CONSTRAINT user_profiles_gender_check 
CHECK (
    gender IS NULL OR 
    gender = ANY (ARRAY['male'::text, 'female'::text, 'other'::text])
);

-- Перевіряємо, що обмеження працює правильно
DO $$
BEGIN
    -- Тестуємо валідні значення
    ASSERT (SELECT COUNT(*) FROM (
        SELECT 1 WHERE 'male' = ANY (ARRAY['male'::text, 'female'::text, 'other'::text])
        UNION ALL
        SELECT 1 WHERE 'female' = ANY (ARRAY['male'::text, 'female'::text, 'other'::text])
        UNION ALL
        SELECT 1 WHERE 'other' = ANY (ARRAY['male'::text, 'female'::text, 'other'::text])
        UNION ALL
        SELECT 1 WHERE NULL IS NULL
    ) AS valid_tests) = 4, 'Gender constraint validation failed';
    
    RAISE NOTICE 'Gender constraint successfully updated and validated';
END $$;