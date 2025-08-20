/*
  # Додавання стовпця auth_user_id до таблиці user_profiles

  1. Додавання стовпця auth_user_id
  2. Створення зв'язку з таблицею auth.users
  3. Створення унікального індексу
*/

-- Додаємо стовпець auth_user_id, якщо він не існує
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'user_profiles' 
    AND column_name = 'auth_user_id'
  ) THEN
    -- Додаємо стовпець auth_user_id
    ALTER TABLE public.user_profiles ADD COLUMN auth_user_id uuid;
    
    -- Заповнюємо стовпець auth_user_id значеннями з id
    UPDATE public.user_profiles SET auth_user_id = id;
    
    -- Додаємо обмеження NOT NULL
    ALTER TABLE public.user_profiles ALTER COLUMN auth_user_id SET NOT NULL;
    
    -- Додаємо зовнішній ключ
    ALTER TABLE public.user_profiles 
      ADD CONSTRAINT user_profiles_auth_user_id_fkey 
      FOREIGN KEY (auth_user_id) 
      REFERENCES auth.users(id) 
      ON DELETE CASCADE;
    
    -- Додаємо унікальний індекс
    CREATE UNIQUE INDEX idx_user_profiles_auth_user_id ON public.user_profiles(auth_user_id);
  END IF;
END
$$;