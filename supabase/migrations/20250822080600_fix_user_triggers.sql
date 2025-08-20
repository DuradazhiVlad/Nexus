/*
  # Виправлення тригера для автоматичного створення профілю

  1. Оновлення функції handle_new_user
    - Виправлення роботи з полем auth_user_id
    - Додавання підтримки для старих профілів
    - Покращення обробки помилок

  2. Оновлення даних
    - Забезпечення правильного зв'язку між auth.users та user_profiles
*/

-- Видаляємо старий тригер якщо існує
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_confirmed ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- Створюємо нову функцію для обробки нових користувачів
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
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
  END IF;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Логуємо помилку але не блокуємо реєстрацію
    RAISE WARNING 'Error creating user profile for %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Створюємо тригер
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

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
    UPDATE public.user_profiles
    SET auth_user_id = user_record.auth_id,
        updated_at = NOW()
    WHERE id = user_record.profile_id;
  END LOOP;
END;
$$;

-- Надаємо права на виконання функцій
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO authenticated, anon;