/*
  # Виправлення відсутніх колонок в таблиці user_profiles

  1. Додавання відсутніх колонок якщо вони не існують
  2. Оновлення існуючих записів з дефолтними значеннями
*/

-- Додаємо колонки якщо вони не існують
DO $$ 
BEGIN
    -- Перевіряємо та додаємо колонку hobbies
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'user_profiles' 
                   AND column_name = 'hobbies' 
                   AND table_schema = 'public') THEN
        ALTER TABLE public.user_profiles ADD COLUMN hobbies jsonb DEFAULT '[]'::jsonb;
        RAISE NOTICE 'Added hobbies column';
    END IF;
    
    -- Перевіряємо та додаємо колонку languages
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'user_profiles' 
                   AND column_name = 'languages' 
                   AND table_schema = 'public') THEN
        ALTER TABLE public.user_profiles ADD COLUMN languages jsonb DEFAULT '[]'::jsonb;
        RAISE NOTICE 'Added languages column';
    END IF;
    
    -- Перевіряємо та додаємо колонку education
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'user_profiles' 
                   AND column_name = 'education' 
                   AND table_schema = 'public') THEN
        ALTER TABLE public.user_profiles ADD COLUMN education text;
        RAISE NOTICE 'Added education column';
    END IF;
    
    -- Перевіряємо та додаємо колонку phone
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'user_profiles' 
                   AND column_name = 'phone' 
                   AND table_schema = 'public') THEN
        ALTER TABLE public.user_profiles ADD COLUMN phone text;
        RAISE NOTICE 'Added phone column';
    END IF;
    
    -- Перевіряємо та додаємо колонку work
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'user_profiles' 
                   AND column_name = 'work' 
                   AND table_schema = 'public') THEN
        ALTER TABLE public.user_profiles ADD COLUMN work text;
        RAISE NOTICE 'Added work column';
    END IF;
    
    -- Перевіряємо та додаємо колонку website
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'user_profiles' 
                   AND column_name = 'website' 
                   AND table_schema = 'public') THEN
        ALTER TABLE public.user_profiles ADD COLUMN website text;
        RAISE NOTICE 'Added website column';
    END IF;
    
    -- Перевіряємо та додаємо колонку relationship_status
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'user_profiles' 
                   AND column_name = 'relationship_status' 
                   AND table_schema = 'public') THEN
        ALTER TABLE public.user_profiles ADD COLUMN relationship_status text;
        RAISE NOTICE 'Added relationship_status column';
    END IF;
    
    -- Перевіряємо та додаємо колонку notifications
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'user_profiles' 
                   AND column_name = 'notifications' 
                   AND table_schema = 'public') THEN
        ALTER TABLE public.user_profiles ADD COLUMN notifications jsonb DEFAULT '{"email": true, "messages": true, "friendRequests": true}'::jsonb;
        RAISE NOTICE 'Added notifications column';
    END IF;
    
    -- Перевіряємо та додаємо колонку privacy
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'user_profiles' 
                   AND column_name = 'privacy' 
                   AND table_schema = 'public') THEN
        ALTER TABLE public.user_profiles ADD COLUMN privacy jsonb DEFAULT '{"profileVisibility": "public", "showBirthDate": true, "showEmail": false}'::jsonb;
        RAISE NOTICE 'Added privacy column';
    END IF;
END $$;

-- Оновлюємо існуючі записи з NULL значеннями
UPDATE public.user_profiles 
SET 
    hobbies = COALESCE(hobbies, '[]'::jsonb),
    languages = COALESCE(languages, '[]'::jsonb),
    notifications = COALESCE(notifications, '{"email": true, "messages": true, "friendRequests": true}'::jsonb),
    privacy = COALESCE(privacy, '{"profileVisibility": "public", "showBirthDate": true, "showEmail": false}'::jsonb)
WHERE 
    hobbies IS NULL OR 
    languages IS NULL OR 
    notifications IS NULL OR 
    privacy IS NULL;

-- Створюємо індекси для нових колонок
CREATE INDEX IF NOT EXISTS idx_user_profiles_hobbies ON public.user_profiles USING gin(hobbies);
CREATE INDEX IF NOT EXISTS idx_user_profiles_languages ON public.user_profiles USING gin(languages);
CREATE INDEX IF NOT EXISTS idx_user_profiles_education ON public.user_profiles(education);
CREATE INDEX IF NOT EXISTS idx_user_profiles_work ON public.user_profiles(work);
CREATE INDEX IF NOT EXISTS idx_user_profiles_relationship_status ON public.user_profiles(relationship_status);