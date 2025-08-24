/*
  # Видалення функцій перед їх оновленням

  1. Видаляємо функції, які будуть оновлені в наступних міграціях
*/

-- Видаляємо функцію get_current_user_profile
DROP FUNCTION IF EXISTS public.get_current_user_profile();

-- Видаляємо функцію search_users якщо вона існує
DROP FUNCTION IF EXISTS public.search_users(text);