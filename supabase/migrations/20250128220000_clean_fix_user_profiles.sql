/*
# Очищення та виправлення RLS політик для user_profiles

1. Видалення конфліктуючих constraint'ів
2. Очищення всіх RLS політик
3. Створення правильних політик
*/

-- Видаляємо конфліктуючі constraint'и якщо існують
ALTER TABLE public.user_profiles DROP CONSTRAINT IF EXISTS user_profiles_gender_check;

-- Видаляємо всі існуючі політики для user_profiles
DO $$ 
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN 
        SELECT schemaname, tablename, policyname 
        FROM pg_policies 
        WHERE schemaname = 'public' AND tablename = 'user_profiles'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', pol.policyname, pol.schemaname, pol.tablename);
    END LOOP;
END $$;

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

-- Додаємо constraint для gender (якщо не існує)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.check_constraints 
        WHERE constraint_name = 'user_profiles_gender_check'
    ) THEN
        ALTER TABLE public.user_profiles 
        ADD CONSTRAINT user_profiles_gender_check 
        CHECK (gender IS NULL OR gender = ANY (ARRAY['male'::text, 'female'::text, 'other'::text]));
    END IF;
END $$;