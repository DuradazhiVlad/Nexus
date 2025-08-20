/*
  # Виправлення RLS політик для user_profiles

  1. Видаляємо старі політики
  2. Створюємо нові безпечні політики
  3. Забезпечуємо правильний доступ до даних
*/

-- Видаляємо всі існуючі політики для user_profiles
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can view public profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.user_profiles;

-- Створюємо нові політики
CREATE POLICY "Enable insert for authenticated users only"
  ON public.user_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = auth_user_id);

CREATE POLICY "Enable select for users based on auth_user_id"
  ON public.user_profiles
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = auth_user_id OR 
    (privacy->>'profileVisibility')::text = 'public'
  );

CREATE POLICY "Enable update for users based on auth_user_id"
  ON public.user_profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = auth_user_id)
  WITH CHECK (auth.uid() = auth_user_id);

CREATE POLICY "Enable delete for users based on auth_user_id"
  ON public.user_profiles
  FOR DELETE
  TO authenticated
  USING (auth.uid() = auth_user_id);

-- Додаємо політику для публічного перегляду профілів
CREATE POLICY "Enable public read for public profiles"
  ON public.user_profiles
  FOR SELECT
  TO anon, authenticated
  USING ((privacy->>'profileVisibility')::text = 'public');

-- Перевіряємо що RLS увімкнено
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;