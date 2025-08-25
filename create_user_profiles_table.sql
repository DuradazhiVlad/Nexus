-- SQL скрипт для створення таблиці user_profiles в Supabase Dashboard
-- Виконайте цей скрипт в SQL Editor вашого Supabase проекту

-- 1. Створюємо функцію для оновлення updated_at (якщо не існує)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 2. Видаляємо таблицю якщо існує (для чистого створення)
DROP TABLE IF EXISTS public.user_profiles CASCADE;

-- 3. Створюємо таблицю user_profiles
CREATE TABLE public.user_profiles (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    auth_user_id uuid NOT NULL,
    name text NOT NULL,
    last_name text NULL DEFAULT ''::text,
    email text NOT NULL,
    avatar text NULL,
    bio text NULL,
    city text NULL,
    birth_date date NULL,
    education text NULL,
    phone text NULL,
    work text NULL,
    website text NULL,
    relationship_status text NULL,
    hobbies jsonb NULL DEFAULT '[]'::jsonb,
    languages jsonb NULL DEFAULT '[]'::jsonb,
    notifications jsonb NULL DEFAULT '{"email": true, "messages": true, "friendRequests": true}'::jsonb,
    privacy jsonb NULL DEFAULT '{"showEmail": false, "showBirthDate": true, "profileVisibility": "public"}'::jsonb,
    created_at timestamp with time zone NULL DEFAULT now(),
    updated_at timestamp with time zone NULL DEFAULT now(),
    email_verified boolean NULL DEFAULT false,
    gender text NULL,
    looking_for_relationship boolean NULL DEFAULT false,
    age integer NULL,
    CONSTRAINT user_profiles_pkey PRIMARY KEY (id),
    CONSTRAINT user_profiles_auth_user_id_key UNIQUE (auth_user_id),
    CONSTRAINT user_profiles_auth_user_id_fkey FOREIGN KEY (auth_user_id) REFERENCES auth.users (id) ON DELETE CASCADE,
    CONSTRAINT user_profiles_gender_check CHECK (
        gender = ANY (ARRAY['male'::text, 'female'::text, 'other'::text])
    )
);

-- 4. Створюємо індекси для оптимізації
CREATE INDEX idx_user_profiles_gender ON public.user_profiles USING btree (gender);
CREATE INDEX idx_user_profiles_looking_for_relationship ON public.user_profiles USING btree (looking_for_relationship);
CREATE INDEX idx_user_profiles_age ON public.user_profiles USING btree (age);
CREATE INDEX idx_user_profiles_auth_user_id ON public.user_profiles USING btree (auth_user_id);
CREATE INDEX idx_user_profiles_email ON public.user_profiles USING btree (email);
CREATE INDEX idx_user_profiles_name ON public.user_profiles USING btree (name, last_name);
CREATE INDEX idx_user_profiles_email_verified ON public.user_profiles USING btree (email_verified);
CREATE INDEX idx_user_profiles_hobbies ON public.user_profiles USING gin (hobbies);
CREATE INDEX idx_user_profiles_languages ON public.user_profiles USING gin (languages);
CREATE INDEX idx_user_profiles_education ON public.user_profiles USING btree (education);
CREATE INDEX idx_user_profiles_work ON public.user_profiles USING btree (work);
CREATE INDEX idx_user_profiles_relationship_status ON public.user_profiles USING btree (relationship_status);

-- 5. Створюємо тригер для оновлення updated_at
CREATE TRIGGER update_user_profiles_updated_at
    BEFORE UPDATE ON public.user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 6. Налаштовуємо RLS (Row Level Security)
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- 7. Створюємо політики RLS

-- Політика для читання: користувачі можуть читати свої профілі та публічні профілі інших
CREATE POLICY "Users can view their own profile and public profiles"
    ON public.user_profiles FOR SELECT
    USING (
        auth_user_id = auth.uid() OR
        (privacy->>'profileVisibility')::text = 'public' OR
        (privacy->>'profileVisibility')::text = 'friends'
    );

-- Політика для вставки: користувачі можуть створювати тільки свої профілі
CREATE POLICY "Users can insert their own profile"
    ON public.user_profiles FOR INSERT
    WITH CHECK (auth_user_id = auth.uid());

-- Політика для оновлення: користувачі можуть оновлювати тільки свої профілі
CREATE POLICY "Users can update their own profile"
    ON public.user_profiles FOR UPDATE
    USING (auth_user_id = auth.uid())
    WITH CHECK (auth_user_id = auth.uid());

-- Політика для видалення: користувачі можуть видаляти тільки свої профілі
CREATE POLICY "Users can delete their own profile"
    ON public.user_profiles FOR DELETE
    USING (auth_user_id = auth.uid());

-- 8. Надаємо дозволи для authenticated користувачів
GRANT ALL ON public.user_profiles TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;

-- 9. Створюємо функцію для отримання користувачів для знайомств (якщо потрібно)
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

-- 10. Надаємо дозволи на функцію
GRANT EXECUTE ON FUNCTION get_dating_users TO authenticated;

-- Готово! Таблиця user_profiles створена з усіма необхідними полями та налаштуваннями.