/*
  # Створення таблиці media для завантаження медіафайлів

  1. Створення таблиці media з необхідними полями
  2. Налаштування RLS та політик безпеки
  3. Створення індексів для оптимізації
*/

-- Створюємо таблицю media
CREATE TABLE IF NOT EXISTS public.media (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    type text NOT NULL CHECK (type IN ('image', 'video', 'audio', 'document')),
    url text NOT NULL,
    original_name text NOT NULL,
    size bigint NOT NULL,
    mime_type text,
    is_public boolean DEFAULT true,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Створюємо індекси для оптимізації
CREATE INDEX IF NOT EXISTS idx_media_user_id ON public.media USING btree (user_id);
CREATE INDEX IF NOT EXISTS idx_media_type ON public.media USING btree (type);
CREATE INDEX IF NOT EXISTS idx_media_is_public ON public.media USING btree (is_public);
CREATE INDEX IF NOT EXISTS idx_media_created_at ON public.media USING btree (created_at);

-- Створюємо функцію для оновлення updated_at
CREATE OR REPLACE FUNCTION update_media_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Створюємо тригер для автоматичного оновлення updated_at
DROP TRIGGER IF EXISTS update_media_updated_at_trigger ON public.media;
CREATE TRIGGER update_media_updated_at_trigger
    BEFORE UPDATE ON public.media
    FOR EACH ROW
    EXECUTE FUNCTION update_media_updated_at();

-- Включаємо RLS
ALTER TABLE public.media ENABLE ROW LEVEL SECURITY;

-- Створюємо політики RLS
-- Користувачі можуть переглядати свої медіафайли та публічні медіафайли інших
CREATE POLICY "Users can view own media and public media" ON public.media
    FOR SELECT USING (
        user_id IN (
            SELECT id FROM public.user_profiles 
            WHERE auth_user_id = auth.uid()
        ) OR is_public = true
    );

-- Користувачі можуть додавати медіафайли тільки до свого профілю
CREATE POLICY "Users can insert own media" ON public.media
    FOR INSERT WITH CHECK (
        user_id IN (
            SELECT id FROM public.user_profiles 
            WHERE auth_user_id = auth.uid()
        )
    );

-- Користувачі можуть оновлювати тільки свої медіафайли
CREATE POLICY "Users can update own media" ON public.media
    FOR UPDATE USING (
        user_id IN (
            SELECT id FROM public.user_profiles 
            WHERE auth_user_id = auth.uid()
        )
    );

-- Користувачі можуть видаляти тільки свої медіафайли
CREATE POLICY "Users can delete own media" ON public.media
    FOR DELETE USING (
        user_id IN (
            SELECT id FROM public.user_profiles 
            WHERE auth_user_id = auth.uid()
        )
    );

-- Надаємо дозволи
GRANT SELECT, INSERT, UPDATE, DELETE ON public.media TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;

-- Перевіряємо, що таблиця створена успішно
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'media'
    ) THEN
        RAISE NOTICE 'Media table created successfully';
    ELSE
        RAISE EXCEPTION 'Failed to create media table';
    END IF;
END $$;