/*
  # Виправлення проблеми з колонкою privacy

  1. Додаємо колонку privacy якщо її немає
  2. Виправляємо політики RLS
*/

-- Додаємо колонку privacy якщо її немає
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS privacy jsonb DEFAULT '{"profileVisibility": "public", "showBirthDate": true, "showEmail": false}'::jsonb;

-- Видаляємо старі політики
DROP POLICY IF EXISTS "Enable select for users based on auth_user_id" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can view public profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.user_profiles;

-- Створюємо нові політики
CREATE POLICY "Users can view public profiles"
  ON public.user_profiles
  FOR SELECT
  USING (
    (privacy->>'profileVisibility')::text = 'public' OR
    auth.uid() = auth_user_id
  );

CREATE POLICY "Users can view their own profile"
  ON public.user_profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = auth_user_id);

CREATE POLICY "Users can update their own profile"
  ON public.user_profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = auth_user_id)
  WITH CHECK (auth.uid() = auth_user_id);

CREATE POLICY "Users can insert their own profile"
  ON public.user_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = auth_user_id);