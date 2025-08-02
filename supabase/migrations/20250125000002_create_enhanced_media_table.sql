/*
  # Create enhanced media table with albums support

  1. Enhanced Media Table
    - id (uuid, primary key)
    - user_id (uuid, foreign key to auth.users)
    - type (text, photo or video)
    - url (text, media file URL)
    - created_at (timestamp)
    - description (text, optional)
    - thumbnail_url (text, optional)
    - original_name (text, optional)
    - size (integer, file size in bytes)
    - is_public (boolean, default false)
    - album_id (uuid, foreign key to albums)

  2. Albums Table
    - id (uuid, primary key)
    - user_id (uuid, foreign key to auth.users)
    - name (text, album name)
    - description (text, optional)
    - created_at (timestamp)
    - is_public (boolean, default false)

  3. Security
    - Enable RLS on both tables
    - Add policies for authenticated users to manage their own media and albums
*/

-- Create albums table first
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

-- Drop existing media table if it exists
DROP TABLE IF EXISTS public.media CASCADE;

-- Create enhanced media table
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

-- Verify tables were created
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name IN ('media', 'albums')
ORDER BY table_name, ordinal_position; 