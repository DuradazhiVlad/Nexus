/*
  # Видалення конфліктуючих функцій

  1. Видаляємо існуючі функції, які можуть конфліктувати
  2. Це дозволить створити нові версії функцій
*/

-- Видаляємо конфліктуючі функції
DROP FUNCTION IF EXISTS public.get_current_user_profile() CASCADE;
DROP FUNCTION IF EXISTS public.search_users(text) CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.update_updated_at_column() CASCADE;

-- Видаляємо конфліктуючі тригери
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_confirmed ON auth.users;
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON public.user_profiles;