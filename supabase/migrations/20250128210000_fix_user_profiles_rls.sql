/*
# Виправлення RLS політик для user_profiles

1. Видалення конфліктуючих політик
2. Створення правильних політик для оновлення профілів
3. Забезпечення доступу до власних профілів
*/

-- Видаляємо всі існуючі політики для user_profiles
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.user_profiles;
DROP POLICY IF EXISTS "Enable select for users based on auth_user_id" ON public.user_profiles;
DROP POLICY IF EXISTS "Enable update for users based on auth_user_id" ON public.user_profiles;
DROP POLICY IF EXISTS "Enable delete for users based on auth_user_id" ON public.user_profiles;
DROP POLICY IF EXISTS "Enable public read for public profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can view their own profile and public profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can delete their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can view public profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Користувачі можуть бачити всі профілі" ON public.user_profiles;
DROP POLICY IF EXISTS "Користувачі можуть оновлювати свої профілі" ON public.user_profiles;

-- Створюємо нові спрощені політики

-- Політика для перегляду: користувачі можуть бачити свої профілі та публічні профілі
CREATE POLICY "user_profiles_select_policy"
  ON public.user_profiles
  FOR SELECT
  TO authenticated, anon
  USING (
    auth.uid() = auth_user_id OR 
    (privacy->>'profileVisibility')::text = 'public' OR
    privacy IS NULL
  );

-- Політика для вставки: тільки власні профілі
CREATE POLICY "user_profiles_insert_policy"
  ON public.user_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = auth_user_id);

-- Політика для оновлення: тільки власні профілі
CREATE POLICY "user_profiles_update_policy"
  ON public.user_profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = auth_user_id)
  WITH CHECK (auth.uid() = auth_user_id);

-- Політика для видалення: тільки власні профілі
CREATE POLICY "user_profiles_delete_policy"
  ON public.user_profiles
  FOR DELETE
  TO authenticated
  USING (auth.uid() = auth_user_id);

-- Переконуємося що RLS увімкнено
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Надаємо необхідні дозволи
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_profiles TO authenticated;
GRANT SELECT ON public.user_profiles TO anon;