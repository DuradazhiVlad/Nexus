/*
  # Додавання колонки auth_user_id до таблиці user_profiles

  1. Додавання колонки auth_user_id, якщо вона не існує
  2. Заповнення колонки даними з auth.users
  3. Додавання обмежень та індексів
*/

-- Додаємо колонку auth_user_id, якщо вона не існує
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'user_profiles' 
    AND column_name = 'auth_user_id'
  ) THEN
    -- Додаємо колонку auth_user_id
    ALTER TABLE public.user_profiles ADD COLUMN auth_user_id uuid;
    
    -- Заповнюємо колонку auth_user_id значеннями з auth.users на основі email
    UPDATE public.user_profiles up
    SET auth_user_id = au.id
    FROM auth.users au
    WHERE up.email = au.email;
    
    -- Додаємо обмеження NOT NULL, якщо всі записи заповнені
    IF NOT EXISTS (SELECT FROM public.user_profiles WHERE auth_user_id IS NULL) THEN
      ALTER TABLE public.user_profiles ALTER COLUMN auth_user_id SET NOT NULL;
    END IF;
    
    -- Додаємо зовнішній ключ
    ALTER TABLE public.user_profiles 
      ADD CONSTRAINT user_profiles_auth_user_id_fkey 
      FOREIGN KEY (auth_user_id) 
      REFERENCES auth.users(id) 
      ON DELETE CASCADE;
    
    -- Додаємо унікальний індекс
    CREATE UNIQUE INDEX idx_user_profiles_auth_user_id ON public.user_profiles(auth_user_id);
    
    -- Оновлюємо RLS політики
    DROP POLICY IF EXISTS "Users can view their own profile" ON public.user_profiles;
    DROP POLICY IF EXISTS "Users can update their own profile" ON public.user_profiles;
    
    CREATE POLICY "Users can view their own profile"
      ON public.user_profiles
      FOR SELECT
      TO authenticated
      USING (auth.uid() = auth_user_id);
    
    CREATE POLICY "Users can update their own profile"
      ON public.user_profiles
      FOR UPDATE
      TO authenticated
      USING (auth.uid() = auth_user_id)
      WITH CHECK (auth.uid() = auth_user_id);
  END IF;
END
$$;

-- Надаємо права на таблицю user_profiles
GRANT SELECT, INSERT, UPDATE ON TABLE public.user_profiles TO authenticated, anon, service_role;