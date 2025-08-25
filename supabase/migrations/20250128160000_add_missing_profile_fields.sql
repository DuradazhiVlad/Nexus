/*
  # Додавання відсутніх полів до таблиці user_profiles

  1. Додаємо поля gender, looking_for_relationship, age, email_verified
  2. Створюємо індекси для нових полів
  3. Додаємо constraint для gender
*/

-- Додаємо відсутні поля до таблиці user_profiles
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS gender text,
ADD COLUMN IF NOT EXISTS looking_for_relationship boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS age integer,
ADD COLUMN IF NOT EXISTS email_verified boolean DEFAULT false;

-- Додаємо constraint для gender
ALTER TABLE public.user_profiles 
ADD CONSTRAINT user_profiles_gender_check 
CHECK (gender IS NULL OR gender = ANY (ARRAY['male'::text, 'female'::text, 'other'::text]));

-- Створюємо індекси для нових полів
CREATE INDEX IF NOT EXISTS idx_user_profiles_gender ON public.user_profiles(gender);
CREATE INDEX IF NOT EXISTS idx_user_profiles_looking_for_relationship ON public.user_profiles(looking_for_relationship);
CREATE INDEX IF NOT EXISTS idx_user_profiles_age ON public.user_profiles(age);
CREATE INDEX IF NOT EXISTS idx_user_profiles_email_verified ON public.user_profiles(email_verified);

-- Додаємо індекси для JSONB полів (hobbies, languages)
CREATE INDEX IF NOT EXISTS idx_user_profiles_hobbies ON public.user_profiles USING gin (hobbies);
CREATE INDEX IF NOT EXISTS idx_user_profiles_languages ON public.user_profiles USING gin (languages);

-- Додаємо індекси для інших полів
CREATE INDEX IF NOT EXISTS idx_user_profiles_education ON public.user_profiles(education);
CREATE INDEX IF NOT EXISTS idx_user_profiles_work ON public.user_profiles(work);
CREATE INDEX IF NOT EXISTS idx_user_profiles_relationship_status ON public.user_profiles(relationship_status);
CREATE INDEX IF NOT EXISTS idx_user_profiles_city ON public.user_profiles(city);

-- Оновлюємо функцію get_dating_users (якщо існує)
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
  avatar text,
  bio text,
  city text,
  age integer,
  gender text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    up.id,
    up.auth_user_id,
    up.name,
    up.avatar,
    up.bio,
    up.city,
    up.age,
    up.gender
  FROM user_profiles up
  WHERE 
    up.looking_for_relationship = true
    AND up.auth_user_id != auth.uid()
    AND (user_gender IS NULL OR up.gender = user_gender)
    AND (up.age IS NULL OR (up.age >= min_age AND up.age <= max_age))
    AND (up.privacy->>'profileVisibility')::text = 'public'
  ORDER BY up.created_at DESC
  LIMIT limit_count;
END;
$$;

-- Надаємо дозволи на функцію
GRANT EXECUTE ON FUNCTION get_dating_users TO authenticated;