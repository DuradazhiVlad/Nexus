/*
  # Додавання колонки email_verified до таблиці user_profiles

  1. Додаємо колонку email_verified
  2. Встановлюємо значення за замовчуванням
*/

-- Додаємо колонку email_verified до таблиці user_profiles
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS email_verified boolean DEFAULT false;

-- Оновлюємо існуючі записи, встановлюючи email_verified = true для користувачів з підтвердженою поштою
UPDATE public.user_profiles 
SET email_verified = true 
WHERE auth_user_id IN (
  SELECT id FROM auth.users WHERE email_confirmed_at IS NOT NULL
);

-- Створюємо індекс для оптимізації
CREATE INDEX IF NOT EXISTS idx_user_profiles_email_verified 
ON public.user_profiles(email_verified);