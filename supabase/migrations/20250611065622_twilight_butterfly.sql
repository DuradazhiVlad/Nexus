/*
  # Create media table and storage setup

  1. New Tables
    - `media`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `type` (text, photo or video)
      - `url` (text, media file URL)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `media` table
    - Add policies for authenticated users to manage their own media
    - Create storage buckets for media and avatars
    - Add storage policies for file access control

  3. Performance
    - Add indexes on user_id and created_at columns
*/

-- Create media table
CREATE TABLE IF NOT EXISTS media (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('photo', 'video')),
  url text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE media ENABLE ROW LEVEL SECURITY;

-- Drop existing table policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Users can view their own media" ON media;
DROP POLICY IF EXISTS "Users can insert their own media" ON media;
DROP POLICY IF EXISTS "Users can delete their own media" ON media;

-- Create RLS policies for media table
CREATE POLICY "Users can view their own media"
  ON media
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own media"
  ON media
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own media"
  ON media
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS media_user_id_idx ON media(user_id);
CREATE INDEX IF NOT EXISTS media_created_at_idx ON media(created_at DESC);

-- Create storage buckets if they don't exist
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('media', 'media', true),
  ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Drop ALL existing storage policies to avoid any conflicts
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    -- Drop all existing policies on storage.objects
    FOR policy_record IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE schemaname = 'storage' AND tablename = 'objects'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', policy_record.policyname);
    END LOOP;
END $$;

-- Create storage policies for media bucket
CREATE POLICY "Users can upload their own media"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'media' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view media files"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (bucket_id = 'media');

CREATE POLICY "Users can delete their own media files"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'media' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Create storage policies for avatars bucket
CREATE POLICY "Users can upload avatar files"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'avatars');

CREATE POLICY "Users can view avatar files"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (bucket_id = 'avatars');

CREATE POLICY "Users can update avatar files"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (bucket_id = 'avatars');

CREATE POLICY "Users can delete avatar files"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'avatars');