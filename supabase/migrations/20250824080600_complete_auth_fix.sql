/*
  # Повне виправлення автентифікації

  1. Повне переписування функції handle_new_user
  2. Надання всіх необхідних прав
  3. Виправлення тригерів
*/

-- Видаляємо всі тригери та функції, пов'язані з автентифікацією
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users CASCADE;
DROP TRIGGER IF EXISTS on_auth_user_confirmed ON auth.users CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- Створюємо нову функцію для обробки нових користувачів
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  profile_id uuid;
BEGIN
  -- Перевіряємо чи користувач вже має профіль за auth_user_id
  IF EXISTS (
    SELECT 1 FROM public.user_profiles 
    WHERE auth_user_id = NEW.id
  ) THEN
    -- Профіль вже існує, нічого не робимо
    RETURN NEW;
  END IF;

  -- Перевіряємо чи існує профіль з таким же email (для міграції старих даних)
  SELECT id INTO profile_id FROM public.user_profiles WHERE email = NEW.email LIMIT 1;
  
  IF profile_id IS NOT NULL THEN
    -- Оновлюємо існуючий профіль, додаючи auth_user_id
    UPDATE public.user_profiles
    SET auth_user_id = NEW.id,
        updated_at = NOW()
    WHERE id = profile_id;
  ELSE
    -- Створюємо новий профіль
    BEGIN
      INSERT INTO public.user_profiles (
        id,
        auth_user_id,
        name,
        email,
        avatar,
        created_at,
        updated_at
      ) VALUES (
        gen_random_uuid(),
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
        NEW.email,
        NEW.raw_user_meta_data->>'avatar_url',
        NOW(),
        NOW()
      );
    EXCEPTION WHEN OTHERS THEN
      -- Логуємо помилку але не блокуємо реєстрацію
      RAISE WARNING 'Error creating user profile for %: %', NEW.id, SQLERRM;
    END;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Створюємо тригери
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE TRIGGER on_auth_user_confirmed
  AFTER UPDATE ON auth.users
  FOR EACH ROW
  WHEN (OLD.email_confirmed_at IS NULL AND NEW.email_confirmed_at IS NOT NULL)
  EXECUTE FUNCTION public.handle_new_user();

-- Надаємо всі необхідні права
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO authenticated, anon, service_role;
GRANT SELECT, INSERT, UPDATE ON TABLE public.user_profiles TO authenticated, anon, service_role;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated, anon, service_role;

-- Оновлюємо існуючі профілі, які не мають auth_user_id
DO $$
DECLARE
  user_record RECORD;
BEGIN
  FOR user_record IN 
    SELECT u.id as auth_id, u.email, p.id as profile_id
    FROM auth.users u
    JOIN public.user_profiles p ON u.email = p.email
    WHERE p.auth_user_id IS NULL
  LOOP
    BEGIN
      UPDATE public.user_profiles
      SET auth_user_id = user_record.auth_id,
          updated_at = NOW()
      WHERE id = user_record.profile_id;
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'Error updating user profile %: %', user_record.profile_id, SQLERRM;
    END;
  END LOOP;
END;
$$;

-- Перевіряємо та виправляємо RLS політики для таблиці user_profiles
DROP POLICY IF EXISTS "Користувачі можуть бачити всі профілі" ON public.user_profiles;
DROP POLICY IF EXISTS "Користувачі можуть оновлювати свої профілі" ON public.user_profiles;

CREATE POLICY "Користувачі можуть бачити всі профілі"
  ON public.user_profiles
  FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE POLICY "Користувачі можуть оновлювати свої профілі"
  ON public.user_profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = auth_user_id)
  WITH CHECK (auth.uid() = auth_user_id);

-- Перевіряємо, що RLS увімкнено для таблиці user_profiles
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;