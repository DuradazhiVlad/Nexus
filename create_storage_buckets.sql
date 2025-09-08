-- Створення storage buckets для Nexus додатку
-- Виконайте цей скрипт в Supabase SQL Editor

-- 1. Створення bucket для аватарів
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'avatar',
    'avatar',
    true,
    5242880, -- 5MB
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
    public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 2. Створення bucket для медіафайлів постів
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'media',
    'media',
    true,
    52428800, -- 50MB
    ARRAY[
        'image/jpeg', 'image/png', 'image/webp', 'image/gif',
        'video/mp4', 'video/webm', 'video/quicktime',
        'audio/mpeg', 'audio/wav', 'audio/ogg',
        'application/pdf', 'text/plain'
    ]
)
ON CONFLICT (id) DO UPDATE SET
    public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 3. Створення bucket для рілсів
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'reels',
    'reels',
    true,
    104857600, -- 100MB
    ARRAY['video/mp4', 'video/webm', 'video/quicktime']
)
ON CONFLICT (id) DO UPDATE SET
    public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 4. Створення політик RLS для bucket avatar
DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;
CREATE POLICY "Avatar images are publicly accessible"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'avatar');

DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
CREATE POLICY "Users can upload their own avatar"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'avatar' AND 
        auth.uid()::text = (storage.foldername(name))[1]
    );

DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
CREATE POLICY "Users can update their own avatar"
    ON storage.objects FOR UPDATE
    USING (
        bucket_id = 'avatar' AND 
        auth.uid()::text = (storage.foldername(name))[1]
    );

DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;
CREATE POLICY "Users can delete their own avatar"
    ON storage.objects FOR DELETE
    USING (
        bucket_id = 'avatar' AND 
        auth.uid()::text = (storage.foldername(name))[1]
    );

-- 5. Створення політик RLS для bucket media
DROP POLICY IF EXISTS "Media files are publicly accessible" ON storage.objects;
CREATE POLICY "Media files are publicly accessible"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'media');

DROP POLICY IF EXISTS "Users can upload their own media" ON storage.objects;
CREATE POLICY "Users can upload their own media"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'media' AND 
        auth.uid()::text = (storage.foldername(name))[1]
    );

DROP POLICY IF EXISTS "Users can update their own media" ON storage.objects;
CREATE POLICY "Users can update their own media"
    ON storage.objects FOR UPDATE
    USING (
        bucket_id = 'media' AND 
        auth.uid()::text = (storage.foldername(name))[1]
    );

DROP POLICY IF EXISTS "Users can delete their own media" ON storage.objects;
CREATE POLICY "Users can delete their own media"
    ON storage.objects FOR DELETE
    USING (
        bucket_id = 'media' AND 
        auth.uid()::text = (storage.foldername(name))[1]
    );

-- 6. Створення політик RLS для bucket reels
DROP POLICY IF EXISTS "Reels are publicly accessible" ON storage.objects;
CREATE POLICY "Reels are publicly accessible"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'reels');

DROP POLICY IF EXISTS "Users can upload their own reels" ON storage.objects;
CREATE POLICY "Users can upload their own reels"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'reels' AND 
        auth.uid()::text = (storage.foldername(name))[1]
    );

DROP POLICY IF EXISTS "Users can update their own reels" ON storage.objects;
CREATE POLICY "Users can update their own reels"
    ON storage.objects FOR UPDATE
    USING (
        bucket_id = 'reels' AND 
        auth.uid()::text = (storage.foldername(name))[1]
    );

DROP POLICY IF EXISTS "Users can delete their own reels" ON storage.objects;
CREATE POLICY "Users can delete their own reels"
    ON storage.objects FOR DELETE
    USING (
        bucket_id = 'reels' AND 
        auth.uid()::text = (storage.foldername(name))[1]
    );

-- 7. Включення RLS для storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Повідомлення про успішне завершення
RAISE NOTICE 'Storage buckets created successfully!';
RAISE NOTICE '1. Created avatar bucket with 5MB limit';
RAISE NOTICE '2. Created media bucket with 50MB limit';
RAISE NOTICE '3. Created reels bucket with 100MB limit';
RAISE NOTICE '4. Configured RLS policies for all buckets';
RAISE NOTICE 'Please run this script in Supabase SQL Editor to create storage buckets.';