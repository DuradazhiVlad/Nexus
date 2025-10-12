-- Виправлення RLS політик для user_profiles
-- Виконайте цей скрипт в Supabase SQL Editor

-- 1. Видаляємо всі існуючі політики для user_profiles
DROP POLICY IF EXISTS "Users can view public profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can delete their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.user_profiles;
DROP POLICY IF EXISTS "user_profiles_select_policy" ON public.user_profiles;
DROP POLICY IF EXISTS "user_profiles_insert_policy" ON public.user_profiles;
DROP POLICY IF EXISTS "user_profiles_update_policy" ON public.user_profiles;
DROP POLICY IF EXISTS "user_profiles_delete_policy" ON public.user_profiles;
DROP POLICY IF EXISTS "Користувачі можуть бачити всі профілі" ON public.user_profiles;
DROP POLICY IF EXISTS "Користувачі можуть оновлювати свої профілі" ON public.user_profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.user_profiles;
DROP POLICY IF EXISTS "Enable select for users based on auth_user_id" ON public.user_profiles;
DROP POLICY IF EXISTS "Enable delete for users based on auth_user_id" ON public.user_profiles;
DROP POLICY IF EXISTS "Enable public read for public profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "user_profiles_select_all" ON public.user_profiles;
DROP POLICY IF EXISTS "user_profiles_insert_own" ON public.user_profiles;
DROP POLICY IF EXISTS "user_profiles_update_own" ON public.user_profiles;
DROP POLICY IF EXISTS "user_profiles_delete_own" ON public.user_profiles;

-- 2. Тимчасово вимикаємо RLS для створення профілів
ALTER TABLE public.user_profiles DISABLE ROW LEVEL SECURITY;

-- 3. Створюємо профілі для існуючих постів
INSERT INTO public.user_profiles (id, auth_user_id, email, name, last_name, avatar, bio, city, birth_date, gender, age, education, phone, work, website, relationship_status, hobbies, languages, notifications, privacy, created_at, updated_at)
SELECT 
    user_id as id,
    user_id as auth_user_id,
    'user' || SUBSTRING(user_id::text, 1, 8) || '@example.com' as email,
    'User ' || SUBSTRING(user_id::text, 1, 4) as name,
    'Test' as last_name,
    NULL as avatar,
    '' as bio,
    '' as city,
    NULL as birth_date,
    NULL as gender,
    NULL as age,
    '' as education,
    '' as phone,
    '' as work,
    '' as website,
    '' as relationship_status,
    '[]'::jsonb as hobbies,
    '[]'::jsonb as languages,
    '{"email": true, "messages": true, "friendRequests": true}'::jsonb as notifications,
    '{"profileVisibility": "public", "showBirthDate": true, "showEmail": false}'::jsonb as privacy,
    NOW() as created_at,
    NOW() as updated_at
FROM (
    SELECT DISTINCT user_id 
    FROM public.posts 
    WHERE user_id IS NOT NULL
) unique_users
WHERE NOT EXISTS (
    SELECT 1 FROM public.user_profiles 
    WHERE id = unique_users.user_id
)
ON CONFLICT (id) DO NOTHING;

-- 4. Створюємо нові прості політики
CREATE POLICY "user_profiles_select_all" ON public.user_profiles
  FOR SELECT 
  USING (true); -- Всі можуть бачити всі профілі

CREATE POLICY "user_profiles_insert_authenticated" ON public.user_profiles
  FOR INSERT TO authenticated
  WITH CHECK (true); -- Аутентифіковані користувачі можуть створювати профілі

CREATE POLICY "user_profiles_update_own" ON public.user_profiles
  FOR UPDATE TO authenticated
  USING (auth_user_id = auth.uid())
  WITH CHECK (auth_user_id = auth.uid());

CREATE POLICY "user_profiles_delete_own" ON public.user_profiles
  FOR DELETE TO authenticated
  USING (auth_user_id = auth.uid());

-- 5. Знову вмикаємо RLS
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- 6. Перевіряємо результат
SELECT 
    'user_profiles' as table_name,
    COUNT(*) as total_records
FROM public.user_profiles
UNION ALL
SELECT 
    'posts' as table_name,
    COUNT(*) as total_records
FROM public.posts;

-- 7. Показуємо створені профілі
SELECT id, name, last_name, email, created_at
FROM public.user_profiles
ORDER BY created_at DESC;

RAISE NOTICE 'User profiles RLS policies fixed and missing profiles created!';