/*
  # Створення допоміжних функцій

  1. Функція для автоматичного створення профілю після реєстрації
  2. Функція для отримання профілю користувача
  3. Функція для пошуку користувачів
*/

-- Функція для автоматичного створення профілю після реєстрації
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (
    auth_user_id,
    name,
    last_name,
    email,
    email_verified,
    hobbies,
    languages,
    notifications,
    privacy
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    NEW.email,
    NEW.email_confirmed_at IS NOT NULL,
    '[]'::jsonb,
    '[]'::jsonb,
    '{"email": true, "messages": true, "friendRequests": true}'::jsonb,
    '{"profileVisibility": "public", "showBirthDate": true, "showEmail": false}'::jsonb
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Тригер для автоматичного створення профілю
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Функція для отримання профілю поточного користувача
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

-- Функція для пошуку користувачів
CREATE OR REPLACE FUNCTION search_users(search_term text)
RETURNS TABLE (
  id uuid,
  auth_user_id uuid,
  name text,
  last_name text,
  email text,
  avatar text,
  bio text,
  city text,
  created_at timestamptz
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
    up.created_at
  FROM user_profiles up
  WHERE 
    (up.privacy->>'profileVisibility')::text = 'public' AND
    (
      up.name ILIKE '%' || search_term || '%' OR
      up.last_name ILIKE '%' || search_term || '%' OR
      up.email ILIKE '%' || search_term || '%' OR
      up.city ILIKE '%' || search_term || '%'
    )
  ORDER BY up.name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Функція для отримання друзів користувача
CREATE OR REPLACE FUNCTION get_user_friends(user_profile_id uuid)
RETURNS TABLE (
  id uuid,
  auth_user_id uuid,
  name text,
  last_name text,
  email text,
  avatar text,
  bio text,
  city text,
  created_at timestamptz
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
    up.created_at
  FROM user_profiles up
  WHERE up.id IN (
    SELECT f.user2_id FROM friendships f WHERE f.user1_id = user_profile_id
    UNION
    SELECT f.user1_id FROM friendships f WHERE f.user2_id = user_profile_id
  )
  ORDER BY up.name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;