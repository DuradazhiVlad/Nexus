/*
  # Додавання полів для знайомств

  1. Додавання поля статі (gender)
  2. Додавання поля активного пошуку (looking_for_relationship)
  3. Оновлення існуючих записів
*/

-- Додаємо колонки для знайомств
DO $$ 
BEGIN
    -- Перевіряємо та додаємо колонку gender
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'user_profiles' 
                   AND column_name = 'gender' 
                   AND table_schema = 'public') THEN
        ALTER TABLE public.user_profiles ADD COLUMN gender text CHECK (gender IN ('male', 'female', 'other'));
        RAISE NOTICE 'Added gender column';
    END IF;
    
    -- Перевіряємо та додаємо колонку looking_for_relationship
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'user_profiles' 
                   AND column_name = 'looking_for_relationship' 
                   AND table_schema = 'public') THEN
        ALTER TABLE public.user_profiles ADD COLUMN looking_for_relationship boolean DEFAULT false;
        RAISE NOTICE 'Added looking_for_relationship column';
    END IF;
    
    -- Перевіряємо та додаємо колонку age (для фільтрації в знайомствах)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'user_profiles' 
                   AND column_name = 'age' 
                   AND table_schema = 'public') THEN
        ALTER TABLE public.user_profiles ADD COLUMN age integer;
        RAISE NOTICE 'Added age column';
    END IF;
END $$;

-- Створюємо індекси для нових колонок
CREATE INDEX IF NOT EXISTS idx_user_profiles_gender ON public.user_profiles(gender);
CREATE INDEX IF NOT EXISTS idx_user_profiles_looking_for_relationship ON public.user_profiles(looking_for_relationship);
CREATE INDEX IF NOT EXISTS idx_user_profiles_age ON public.user_profiles(age);

-- Створюємо функцію для отримання користувачів для знайомств
CREATE OR REPLACE FUNCTION get_dating_users(
  user_gender text DEFAULT NULL,
  min_age integer DEFAULT 18,
  max_age integer DEFAULT 100,
  limit_count integer DEFAULT 20
)
RETURNS TABLE (
  id uuid,
  auth_user_id uuid,
  name text,
  last_name text,
  avatar text,
  age integer,
  gender text,
  city text,
  bio text,
  created_at timestamptz
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    up.id,
    up.auth_user_id,
    up.name,
    up.last_name,
    up.avatar,
    up.age,
    up.gender,
    up.city,
    up.bio,
    up.created_at
  FROM user_profiles up
  WHERE 
    up.looking_for_relationship = true
    AND up.auth_user_id != auth.uid()
    AND (user_gender IS NULL OR up.gender = user_gender)
    AND (up.age IS NULL OR (up.age >= min_age AND up.age <= max_age))
    AND (up.privacy->>'profileVisibility')::text IN ('public', 'friends')
  ORDER BY up.created_at DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Надаємо права на виконання функції
GRANT EXECUTE ON FUNCTION get_dating_users TO authenticated;