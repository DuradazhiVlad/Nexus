/*
  # Виправлення прав доступу для автентифікації

  1. Надання додаткових прав для функцій автентифікації
  2. Виправлення прав для ролей anon та authenticated
*/

-- Надаємо додаткові права для функції handle_new_user
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;

-- Надаємо права на таблицю user_profiles для ролей anon та authenticated
GRANT SELECT, INSERT, UPDATE ON TABLE public.user_profiles TO authenticated, anon;

-- Надаємо права на послідовності, якщо вони використовуються
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated, anon;

-- Перевіряємо наявність тригера on_auth_user_confirmed і створюємо його, якщо потрібно
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'on_auth_user_confirmed'
  ) THEN
    EXECUTE 'CREATE TRIGGER on_auth_user_confirmed
      AFTER UPDATE ON auth.users
      FOR EACH ROW
      WHEN (OLD.email_confirmed_at IS NULL AND NEW.email_confirmed_at IS NOT NULL)
      EXECUTE FUNCTION public.handle_new_user()';
  END IF;
END;
$$;