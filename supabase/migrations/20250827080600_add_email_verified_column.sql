/*
  # Додавання колонки email_verified до таблиці user_profiles

  1. Додаємо колонку email_verified
  2. Встановлюємо значення за замовчуванням
  3. Оновлюємо існуючі записи
*/

-- Додаємо колонку email_verified до таблиці user_profiles
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS email_verified boolean DEFAULT false;

-- Оновлюємо існуючі записи, встановлюючи email_verified = true для користувачів з підтвердженою поштою
UPDATE public.user_profiles 
SET email_verified = CASE 
  WHEN EXISTS (
    SELECT 1 FROM auth.users 
    WHERE auth.users.id = user_profiles.auth_user_id 
    AND auth.users.email_confirmed_at IS NOT NULL
  ) THEN true 
  ELSE false 
END;

-- Створюємо індекс для оптимізації запитів
CREATE INDEX IF NOT EXISTS idx_user_profiles_email_verified 
ON public.user_profiles(email_verified);

-- Оновлюємо функцію get_current_user_profile для включення email_verified
CREATE OR REPLACE FUNCTION get_current_user_profile()
RETURNS TABLE (
  id uuid,
  auth_user_id uuid,
  name text,
  last_name text,
  email text,
  avatar text,
  bio text,
  city text,
  birth_date date,
  education text,
  phone text,
  work text,
  website text,
  relationship_status text,
  hobbies jsonb,
  languages jsonb,
  email_verified boolean,
  notifications jsonb,
  privacy jsonb,
  created_at timestamptz,
  updated_at timestamptz
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    up.id,
    up.auth_user_id,
    up.name,
    up.last_name,
    up.email,
    up.avatar,
    up.bio,
    up.city,
    up.birth_date,
    up.education,
    up.phone,
    up.work,
    up.website,
    up.relationship_status,
    up.hobbies,
    up.languages,
    up.email_verified,
    up.notifications,
    up.privacy,
    up.created_at,
    up.updated_at
  FROM user_profiles up
  WHERE up.auth_user_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;