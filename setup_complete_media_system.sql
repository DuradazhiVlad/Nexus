-- Complete Media System Setup
-- Run this in your Supabase SQL Editor

-- 1. Create posts bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('posts', 'posts', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Create policies for posts bucket
DROP POLICY IF EXISTS "Post media are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload post media" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own post media" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own post media" ON storage.objects;

CREATE POLICY "Post media are publicly accessible" ON storage.objects
FOR SELECT USING (bucket_id = 'posts');

CREATE POLICY "Authenticated users can upload post media" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'posts' 
  AND auth.uid() IS NOT NULL
);

CREATE POLICY "Users can update their own post media" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'posts' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own post media" ON storage.objects
FOR DELETE USING (
  bucket_id = 'posts' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- 3. Create albums table
CREATE TABLE IF NOT EXISTS public.albums (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  created_at timestamptz DEFAULT now(),
  is_public boolean DEFAULT false
);

-- Enable RLS on albums
ALTER TABLE albums ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for albums
DROP POLICY IF EXISTS "Users can view their own albums" ON albums;
DROP POLICY IF EXISTS "Users can insert their own albums" ON albums;
DROP POLICY IF EXISTS "Users can update their own albums" ON albums;
DROP POLICY IF EXISTS "Users can delete their own albums" ON albums;

CREATE POLICY "Users can view their own albums" ON albums
FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own albums" ON albums
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own albums" ON albums
FOR UPDATE TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own albums" ON albums
FOR DELETE TO authenticated
USING (auth.uid() = user_id);

-- Create indexes for albums
CREATE INDEX IF NOT EXISTS albums_user_id_idx ON albums(user_id);
CREATE INDEX IF NOT EXISTS albums_created_at_idx ON albums(created_at DESC);

-- 4. Drop existing media table if it exists
DROP TABLE IF EXISTS public.media CASCADE;

-- 5. Create enhanced media table
CREATE TABLE public.media (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  type text NOT NULL,
  url text NOT NULL,
  created_at timestamptz DEFAULT now(),
  description text,
  thumbnail_url text,
  original_name text,
  size integer,
  is_public boolean DEFAULT false,
  album_id uuid,
  CONSTRAINT media_pkey PRIMARY KEY (id),
  CONSTRAINT fk_media_album FOREIGN KEY (album_id) REFERENCES albums(id) ON DELETE SET NULL,
  CONSTRAINT media_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT media_type_check CHECK (
    (type = ANY (ARRAY['photo'::text, 'video'::text]))
  )
) TABLESPACE pg_default;

-- Enable RLS on media
ALTER TABLE media ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for media
DROP POLICY IF EXISTS "Users can view their own media" ON media;
DROP POLICY IF EXISTS "Users can insert their own media" ON media;
DROP POLICY IF EXISTS "Users can update their own media" ON media;
DROP POLICY IF EXISTS "Users can delete their own media" ON media;

CREATE POLICY "Users can view their own media" ON media
FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own media" ON media
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own media" ON media
FOR UPDATE TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own media" ON media
FOR DELETE TO authenticated
USING (auth.uid() = user_id);

-- Create indexes for media
CREATE INDEX IF NOT EXISTS media_user_id_idx ON public.media USING btree (user_id) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS media_created_at_idx ON public.media USING btree (created_at DESC) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_media_album_id ON public.media USING btree (album_id) TABLESPACE pg_default;

-- 6. Verify everything was created
SELECT 'Buckets:' as info;
SELECT id, name, public FROM storage.buckets WHERE id = 'posts';

SELECT 'Albums table:' as info;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'albums'
ORDER BY ordinal_position;

SELECT 'Media table:' as info;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'media'
ORDER BY ordinal_position;

SELECT 'Policies:' as info;
SELECT schemaname, tablename, policyname, cmd
FROM pg_policies 
WHERE tablename IN ('media', 'albums', 'objects')
ORDER BY tablename, policyname; 