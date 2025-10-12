-- Додавання поля group_id до таблиці posts для підтримки постів у групах
ALTER TABLE public.posts 
ADD COLUMN IF NOT EXISTS group_id uuid REFERENCES public.groups(id) ON DELETE CASCADE;

-- Створення індексу для покращення продуктивності
CREATE INDEX IF NOT EXISTS idx_posts_group_id ON public.posts(group_id);

-- Оновлення політик RLS для постів груп
DROP POLICY IF EXISTS "Users can view group posts" ON public.posts;
CREATE POLICY "Users can view group posts" ON public.posts
    FOR SELECT USING (
        -- Пости користувача
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE id = posts.user_id AND auth_user_id = auth.uid()
        )
        OR
        -- Публічні пости (без групи)
        group_id IS NULL
        OR
        -- Пости в групах, до яких користувач має доступ
        EXISTS (
            SELECT 1 FROM public.group_members gm
            JOIN public.user_profiles up ON up.id = gm.user_id
            WHERE gm.group_id = posts.group_id 
            AND up.auth_user_id = auth.uid()
            AND gm.status = 'approved'
        )
        OR
        -- Пости в публічних групах
        EXISTS (
            SELECT 1 FROM public.groups g
            WHERE g.id = posts.group_id 
            AND g.is_public = true
        )
    );

-- Політика для створення постів у групах
DROP POLICY IF EXISTS "Users can create posts in groups" ON public.posts;
CREATE POLICY "Users can create posts in groups" ON public.posts
    FOR INSERT WITH CHECK (
        -- Користувач може створювати пости від свого імені
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE id = posts.user_id AND auth_user_id = auth.uid()
        )
        AND
        (
            -- Пост без групи (на стіні користувача)
            group_id IS NULL
            OR
            -- Пост у групі, де користувач є учасником
            EXISTS (
                SELECT 1 FROM public.group_members gm
                JOIN public.user_profiles up ON up.id = gm.user_id
                WHERE gm.group_id = posts.group_id 
                AND up.auth_user_id = auth.uid()
                AND gm.status = 'approved'
            )
        )
    );

COMMIT;