-- Створення всіх відсутніх таблиць для виправлення помилок

-- 1. Створення таблиці user_personal_info
CREATE TABLE IF NOT EXISTS public.user_personal_info (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    education text,
    work_place text,
    work_position text,
    languages jsonb DEFAULT '[]'::jsonb,
    interests jsonb DEFAULT '[]'::jsonb,
    phone text,
    website text,
    social_links jsonb DEFAULT '{}'::jsonb,
    family_members jsonb DEFAULT '[]'::jsonb,
    life_events jsonb DEFAULT '[]'::jsonb,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id)
);

-- 2. Створення таблиці user_photos
CREATE TABLE IF NOT EXISTS public.user_photos (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    url text NOT NULL,
    filename text,
    size bigint,
    description text,
    is_profile_photo boolean DEFAULT false,
    is_cover_photo boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Створення таблиці user_videos
CREATE TABLE IF NOT EXISTS public.user_videos (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    url text NOT NULL,
    filename text,
    size bigint,
    duration integer, -- в секундах
    thumbnail_url text,
    description text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Створення таблиці profiles (якщо потрібна як алтернатива user_profiles)
CREATE TABLE IF NOT EXISTS public.profiles (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    name text,
    last_name text,
    email text,
    avatar text,
    bio text,
    city text,
    birth_date date,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id)
);

-- 5. Увімкнення RLS для всіх таблиць
ALTER TABLE public.user_personal_info ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 6. Створення політик RLS для user_personal_info
DROP POLICY IF EXISTS "Users can view their own personal info" ON public.user_personal_info;
CREATE POLICY "Users can view their own personal info" ON public.user_personal_info
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE id = user_personal_info.user_id AND auth_user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can insert their own personal info" ON public.user_personal_info;
CREATE POLICY "Users can insert their own personal info" ON public.user_personal_info
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE id = user_personal_info.user_id AND auth_user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can update their own personal info" ON public.user_personal_info;
CREATE POLICY "Users can update their own personal info" ON public.user_personal_info
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE id = user_personal_info.user_id AND auth_user_id = auth.uid()
        )
    );

-- 7. Створення політик RLS для user_photos
DROP POLICY IF EXISTS "Users can view all photos" ON public.user_photos;
CREATE POLICY "Users can view all photos" ON public.user_photos
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert their own photos" ON public.user_photos;
CREATE POLICY "Users can insert their own photos" ON public.user_photos
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE id = user_photos.user_id AND auth_user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can update their own photos" ON public.user_photos;
CREATE POLICY "Users can update their own photos" ON public.user_photos
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE id = user_photos.user_id AND auth_user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can delete their own photos" ON public.user_photos;
CREATE POLICY "Users can delete their own photos" ON public.user_photos
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE id = user_photos.user_id AND auth_user_id = auth.uid()
        )
    );

-- 8. Створення політик RLS для user_videos
DROP POLICY IF EXISTS "Users can view all videos" ON public.user_videos;
CREATE POLICY "Users can view all videos" ON public.user_videos
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert their own videos" ON public.user_videos;
CREATE POLICY "Users can insert their own videos" ON public.user_videos
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE id = user_videos.user_id AND auth_user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can update their own videos" ON public.user_videos;
CREATE POLICY "Users can update their own videos" ON public.user_videos
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE id = user_videos.user_id AND auth_user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can delete their own videos" ON public.user_videos;
CREATE POLICY "Users can delete their own videos" ON public.user_videos
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE id = user_videos.user_id AND auth_user_id = auth.uid()
        )
    );

-- 9. Створення політик RLS для profiles
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;
CREATE POLICY "Users can view all profiles" ON public.profiles
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = user_id);

-- 10. Створення індексів для покращення продуктивності
CREATE INDEX IF NOT EXISTS idx_user_personal_info_user_id ON public.user_personal_info(user_id);
CREATE INDEX IF NOT EXISTS idx_user_photos_user_id ON public.user_photos(user_id);
CREATE INDEX IF NOT EXISTS idx_user_photos_is_profile ON public.user_photos(is_profile_photo);
CREATE INDEX IF NOT EXISTS idx_user_photos_is_cover ON public.user_photos(is_cover_photo);
CREATE INDEX IF NOT EXISTS idx_user_videos_user_id ON public.user_videos(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);

-- 11. Створення тригерів для автоматичного оновлення updated_at
DROP TRIGGER IF EXISTS handle_updated_at ON public.user_personal_info;
CREATE TRIGGER handle_updated_at
    BEFORE UPDATE ON public.user_personal_info
    FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

DROP TRIGGER IF EXISTS handle_updated_at ON public.user_photos;
CREATE TRIGGER handle_updated_at
    BEFORE UPDATE ON public.user_photos
    FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

DROP TRIGGER IF EXISTS handle_updated_at ON public.user_videos;
CREATE TRIGGER handle_updated_at
    BEFORE UPDATE ON public.user_videos
    FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

DROP TRIGGER IF EXISTS handle_updated_at ON public.profiles;
CREATE TRIGGER handle_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

-- 12. Створення початкових записів для існуючих користувачів
INSERT INTO public.user_personal_info (user_id, education, work_place, work_position, languages, interests, phone, website, social_links, family_members, life_events)
SELECT 
    id,
    COALESCE(education, ''),
    '',
    '',
    COALESCE(languages, '[]'::jsonb),
    COALESCE(hobbies, '[]'::jsonb),
    COALESCE(phone, ''),
    COALESCE(website, ''),
    '{}'::jsonb,
    '[]'::jsonb,
    '[]'::jsonb
FROM public.user_profiles
WHERE id NOT IN (SELECT user_id FROM public.user_personal_info WHERE user_id IS NOT NULL)
ON CONFLICT (user_id) DO NOTHING;

COMMIT;