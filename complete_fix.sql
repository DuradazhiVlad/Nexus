-- Complete Fix for Posts and Media Upload Issues
-- Run this in your Supabase SQL Editor

-- 1. Create posts bucket if it doesn't exist
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

-- 3. Fix posts table structure to use auth.users
ALTER TABLE posts DROP CONSTRAINT IF EXISTS posts_user_id_fkey;
ALTER TABLE post_likes DROP CONSTRAINT IF EXISTS post_likes_user_id_fkey;
ALTER TABLE post_comments DROP CONSTRAINT IF EXISTS post_comments_user_id_fkey;

ALTER TABLE posts ADD CONSTRAINT posts_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE post_likes ADD CONSTRAINT post_likes_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE post_comments ADD CONSTRAINT post_comments_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- 4. Update RLS policies for posts
DROP POLICY IF EXISTS "Users can view all posts" ON posts;
DROP POLICY IF EXISTS "Users can create their own posts" ON posts;
DROP POLICY IF EXISTS "Users can update their own posts" ON posts;
DROP POLICY IF EXISTS "Users can delete their own posts" ON posts;

CREATE POLICY "Users can view all posts" ON posts
FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can create their own posts" ON posts
FOR INSERT TO authenticated 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own posts" ON posts
FOR UPDATE TO authenticated 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own posts" ON posts
FOR DELETE TO authenticated 
USING (auth.uid() = user_id);

-- 5. Update post_likes policies
DROP POLICY IF EXISTS "Users can view all likes" ON post_likes;
DROP POLICY IF EXISTS "Users can like posts" ON post_likes;
DROP POLICY IF EXISTS "Users can unlike their own likes" ON post_likes;

CREATE POLICY "Users can view all likes" ON post_likes
FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can like posts" ON post_likes
FOR INSERT TO authenticated 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unlike their own likes" ON post_likes
FOR DELETE TO authenticated 
USING (auth.uid() = user_id);

-- 6. Update post_comments policies
DROP POLICY IF EXISTS "Users can view all comments" ON post_comments;
DROP POLICY IF EXISTS "Users can comment on posts" ON post_comments;
DROP POLICY IF EXISTS "Users can delete their own comments" ON post_comments;

CREATE POLICY "Users can view all comments" ON post_comments
FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can comment on posts" ON post_comments
FOR INSERT TO authenticated 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments" ON post_comments
FOR DELETE TO authenticated 
USING (auth.uid() = user_id);

-- 7. Create enhanced media table if it doesn't exist
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

-- 8. Create enhanced media table
DROP TABLE IF EXISTS public.media CASCADE;

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

-- 9. Verify everything was created correctly
SELECT 'Buckets:' as info;
SELECT id, name, public FROM storage.buckets WHERE id = 'posts';

SELECT 'Posts table structure:' as info;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'posts'
ORDER BY ordinal_position;

SELECT 'Media table structure:' as info;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'media'
ORDER BY ordinal_position;

SELECT 'Albums table structure:' as info;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'albums'
ORDER BY ordinal_position;

SELECT 'Foreign key constraints:' as info;
SELECT 
  tc.constraint_name,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_name IN ('posts', 'post_likes', 'post_comments', 'media', 'albums'); 