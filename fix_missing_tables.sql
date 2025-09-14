-- Створення відсутніх таблиць для виправлення помилок

-- 1. Створення таблиці media
CREATE TABLE IF NOT EXISTS public.media (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    url text NOT NULL,
    type text NOT NULL CHECK (type IN ('image', 'video', 'audio')),
    filename text,
    size bigint,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Створення таблиці friendships
CREATE TABLE IF NOT EXISTS public.friendships (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user1_id uuid REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    user2_id uuid REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user1_id, user2_id)
);

-- 3. Створення таблиці posts якщо не існує
CREATE TABLE IF NOT EXISTS public.posts (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    content text,
    media_url text,
    media_type text CHECK (media_type IN ('image', 'video', 'audio')),
    likes_count integer DEFAULT 0,
    comments_count integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Увімкнення RLS для всіх таблиць
ALTER TABLE public.media ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

-- 5. Створення політик RLS для media
DROP POLICY IF EXISTS "Users can view all media" ON public.media;
CREATE POLICY "Users can view all media" ON public.media
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert their own media" ON public.media;
CREATE POLICY "Users can insert their own media" ON public.media
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE id = media.user_id AND auth_user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can update their own media" ON public.media;
CREATE POLICY "Users can update their own media" ON public.media
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE id = media.user_id AND auth_user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can delete their own media" ON public.media;
CREATE POLICY "Users can delete their own media" ON public.media
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE id = media.user_id AND auth_user_id = auth.uid()
        )
    );

-- 6. Створення політик RLS для friendships
DROP POLICY IF EXISTS "Users can view friendships" ON public.friendships;
CREATE POLICY "Users can view friendships" ON public.friendships
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE (id = friendships.user1_id OR id = friendships.user2_id) 
            AND auth_user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can create friendships" ON public.friendships;
CREATE POLICY "Users can create friendships" ON public.friendships
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE id = friendships.user1_id AND auth_user_id = auth.uid()
        )
    );

-- 7. Створення політик RLS для posts
DROP POLICY IF EXISTS "Users can view all posts" ON public.posts;
CREATE POLICY "Users can view all posts" ON public.posts
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert their own posts" ON public.posts;
CREATE POLICY "Users can insert their own posts" ON public.posts
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE id = posts.user_id AND auth_user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can update their own posts" ON public.posts;
CREATE POLICY "Users can update their own posts" ON public.posts
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE id = posts.user_id AND auth_user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can delete their own posts" ON public.posts;
CREATE POLICY "Users can delete their own posts" ON public.posts
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE id = posts.user_id AND auth_user_id = auth.uid()
        )
    );

-- 8. Створення індексів для покращення продуктивності
CREATE INDEX IF NOT EXISTS idx_media_user_id ON public.media(user_id);
CREATE INDEX IF NOT EXISTS idx_media_type ON public.media(type);
CREATE INDEX IF NOT EXISTS idx_friendships_user1_id ON public.friendships(user1_id);
CREATE INDEX IF NOT EXISTS idx_friendships_user2_id ON public.friendships(user2_id);
CREATE INDEX IF NOT EXISTS idx_posts_user_id ON public.posts(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON public.posts(created_at DESC);

-- 9. Створення функції для автоматичного оновлення updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 10. Створення тригерів для автоматичного оновлення updated_at
DROP TRIGGER IF EXISTS handle_updated_at ON public.media;
CREATE TRIGGER handle_updated_at
    BEFORE UPDATE ON public.media
    FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

DROP TRIGGER IF EXISTS handle_updated_at ON public.posts;
CREATE TRIGGER handle_updated_at
    BEFORE UPDATE ON public.posts
    FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();