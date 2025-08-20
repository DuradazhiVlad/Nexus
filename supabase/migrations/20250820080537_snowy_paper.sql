/*
  # Виправлення тригера для автоматичного створення профілю

  1. Функції
    - Створюємо безпечну функцію для створення профілю користувача
    - Додаємо обробку помилок та перевірки

  2. Тригери
    - Створюємо тригер який спрацьовує після реєстрації
    - Забезпечуємо що профіль створюється автоматично

  3. Безпека
    - Додаємо перевірки на існування користувача
    - Обробляємо можливі конфлікти
*/

-- Видаляємо старий тригер якщо існує
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Створюємо нову функцію для обробки нових користувачів
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Перевіряємо чи користувач вже має профіль
  IF NOT EXISTS (
    SELECT 1 FROM public.user_profiles 
    WHERE auth_user_id = NEW.id
  ) THEN
    -- Створюємо профіль тільки якщо його ще немає
    INSERT INTO public.user_profiles (
      auth_user_id,
      name,
      email,
      avatar,
      created_at,
      updated_at
    ) VALUES (
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

-- Додаємо функцію для безпечного отримання поточного користувача
CREATE OR REPLACE FUNCTION public.get_current_user_profile()
RETURNS TABLE (
  id uuid,
  auth_user_id uuid,
  name text,
  email text,
  avatar text,
  bio text,
  city text,
  birth_date date,
  created_at timestamptz
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    up.id,
    up.auth_user_id,
    up.name,
    up.email,
    up.avatar,
    up.bio,
    up.city,
    up.birth_date,
    up.created_at
  FROM public.user_profiles up
  WHERE up.auth_user_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Надаємо права на виконання функцій
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.get_current_user_profile() TO authenticated;