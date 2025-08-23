/*
  # Видалення конфліктуючого тригера

  1. Видаляємо тригер on_auth_user_confirmed
  2. Це дозволить видалити функцію handle_new_user в наступних міграціях
*/

-- Видаляємо тригер, який залежить від функції handle_new_user
DROP TRIGGER IF EXISTS on_auth_user_confirmed ON auth.users;