/*
  # Виправлення foreign key зв'язків між таблицями

  1. Перевірка існування таблиць groups, group_posts, group_members
  2. Додавання відсутніх foreign key зв'язків
  3. Створення індексів для оптимізації
*/

-- Перевіряємо та створюємо таблицю groups якщо не існує
CREATE TABLE IF NOT EXISTS public.groups (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    description text,
    avatar text,
    is_private boolean DEFAULT false,
    created_by uuid NOT NULL,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Перевіряємо та створюємо таблицю group_posts якщо не існує
CREATE TABLE IF NOT EXISTS public.group_posts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id uuid NOT NULL,
    author_id uuid NOT NULL,
    content text NOT NULL,
    media_urls text[] DEFAULT '{}',
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Перевіряємо та створюємо таблицю group_members якщо не існує
CREATE TABLE IF NOT EXISTS public.group_members (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id uuid NOT NULL,
    user_id uuid NOT NULL,
    role text DEFAULT 'member' CHECK (role IN ('admin', 'moderator', 'member')),
    joined_at timestamptz DEFAULT now(),
    UNIQUE(group_id, user_id)
);

-- Перевіряємо та створюємо таблицю group_post_media якщо не існує
CREATE TABLE IF NOT EXISTS public.group_post_media (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id uuid NOT NULL,
    media_id uuid NOT NULL,
    created_at timestamptz DEFAULT now()
);

-- Видаляємо старі foreign key обмеження якщо вони існують з неправильними назвами
DO $$
BEGIN
    -- Для groups
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'groups_created_by_fkey' AND table_name = 'groups') THEN
        ALTER TABLE public.groups DROP CONSTRAINT groups_created_by_fkey;
    END IF;
    
    -- Для group_posts
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'group_posts_group_id_fkey' AND table_name = 'group_posts') THEN
        ALTER TABLE public.group_posts DROP CONSTRAINT group_posts_group_id_fkey;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'group_posts_author_id_fkey' AND table_name = 'group_posts') THEN
        ALTER TABLE public.group_posts DROP CONSTRAINT group_posts_author_id_fkey;
    END IF;
    
    -- Для group_members
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'group_members_group_id_fkey' AND table_name = 'group_members') THEN
        ALTER TABLE public.group_members DROP CONSTRAINT group_members_group_id_fkey;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'group_members_user_id_fkey' AND table_name = 'group_members') THEN
        ALTER TABLE public.group_members DROP CONSTRAINT group_members_user_id_fkey;
    END IF;
    
    -- Для group_post_media
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'group_post_media_post_id_fkey' AND table_name = 'group_post_media') THEN
        ALTER TABLE public.group_post_media DROP CONSTRAINT group_post_media_post_id_fkey;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'group_post_media_media_id_fkey' AND table_name = 'group_post_media') THEN
        ALTER TABLE public.group_post_media DROP CONSTRAINT group_post_media_media_id_fkey;
    END IF;
END $$;

-- Додаємо правильні foreign key обмеження
-- Для groups
ALTER TABLE public.groups 
ADD CONSTRAINT groups_created_by_fkey 
FOREIGN KEY (created_by) REFERENCES public.user_profiles(id) ON DELETE CASCADE;

-- Для group_posts
ALTER TABLE public.group_posts 
ADD CONSTRAINT group_posts_group_id_fkey 
FOREIGN KEY (group_id) REFERENCES public.groups(id) ON DELETE CASCADE;

ALTER TABLE public.group_posts 
ADD CONSTRAINT group_posts_author_id_fkey 
FOREIGN KEY (author_id) REFERENCES public.user_profiles(id) ON DELETE CASCADE;

-- Для group_members
ALTER TABLE public.group_members 
ADD CONSTRAINT group_members_group_id_fkey 
FOREIGN KEY (group_id) REFERENCES public.groups(id) ON DELETE CASCADE;

ALTER TABLE public.group_members 
ADD CONSTRAINT group_members_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.user_profiles(id) ON DELETE CASCADE;

-- Для group_post_media
ALTER TABLE public.group_post_media 
ADD CONSTRAINT group_post_media_post_id_fkey 
FOREIGN KEY (post_id) REFERENCES public.group_posts(id) ON DELETE CASCADE;

ALTER TABLE public.group_post_media 
ADD CONSTRAINT group_post_media_media_id_fkey 
FOREIGN KEY (media_id) REFERENCES public.media(id) ON DELETE CASCADE;

-- Створюємо індекси для оптимізації
CREATE INDEX IF NOT EXISTS idx_groups_created_by ON public.groups USING btree (created_by);
CREATE INDEX IF NOT EXISTS idx_group_posts_group_id ON public.group_posts USING btree (group_id);
CREATE INDEX IF NOT EXISTS idx_group_posts_author_id ON public.group_posts USING btree (author_id);
CREATE INDEX IF NOT EXISTS idx_group_members_group_id ON public.group_members USING btree (group_id);
CREATE INDEX IF NOT EXISTS idx_group_members_user_id ON public.group_members USING btree (user_id);
CREATE INDEX IF NOT EXISTS idx_group_post_media_post_id ON public.group_post_media USING btree (post_id);
CREATE INDEX IF NOT EXISTS idx_group_post_media_media_id ON public.group_post_media USING btree (media_id);

-- Включаємо RLS для всіх таблиць
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_post_media ENABLE ROW LEVEL SECURITY;

-- Створюємо базові політики RLS
-- Для groups: всі можуть переглядати публічні групи, члени можуть переглядати приватні
CREATE POLICY "Public groups are viewable by everyone" ON public.groups
    FOR SELECT USING (is_private = false);

CREATE POLICY "Private groups are viewable by members" ON public.groups
    FOR SELECT USING (
        is_private = true AND id IN (
            SELECT group_id FROM public.group_members 
            WHERE user_id IN (
                SELECT id FROM public.user_profiles 
                WHERE auth_user_id = auth.uid()
            )
        )
    );

-- Для group_posts: тільки члени групи можуть переглядати пости
CREATE POLICY "Group posts are viewable by group members" ON public.group_posts
    FOR SELECT USING (
        group_id IN (
            SELECT group_id FROM public.group_members 
            WHERE user_id IN (
                SELECT id FROM public.user_profiles 
                WHERE auth_user_id = auth.uid()
            )
        )
    );

-- Для group_members: члени можуть переглядати інших членів своїх груп
CREATE POLICY "Group members are viewable by other group members" ON public.group_members
    FOR SELECT USING (
        group_id IN (
            SELECT group_id FROM public.group_members 
            WHERE user_id IN (
                SELECT id FROM public.user_profiles 
                WHERE auth_user_id = auth.uid()
            )
        )
    );

-- Надаємо дозволи
GRANT SELECT, INSERT, UPDATE, DELETE ON public.groups TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.group_posts TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.group_members TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.group_post_media TO authenticated;

-- Перевіряємо, що всі foreign key створені успішно
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'groups_created_by_fkey'
        AND table_name = 'groups'
    ) THEN
        RAISE NOTICE 'Groups foreign keys created successfully';
    ELSE
        RAISE EXCEPTION 'Failed to create groups foreign keys';
    END IF;
END $$;