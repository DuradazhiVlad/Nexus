/*
  # Create media table for user photos and videos

  1. New Tables
    - `media`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `type` (text, 'photo' or 'video')
      - `url` (text, public URL to the media file)
      - `created_at` (timestamp with timezone)

  2. Security
    - Enable RLS on `media` table
    - Add policy for authenticated users to read their own media
    - Add policy for authenticated users to insert their own media
    - Add policy for authenticated users to delete their own media

  3. Storage
    - Create storage buckets for media and avatars if they don't exist
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

-- Create RLS policies
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

-- Create storage policies for media bucket
CREATE POLICY "Users can upload their own media"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'media' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view their own media"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (bucket_id = 'media' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own media"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'media' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Create storage policies for avatars bucket
CREATE POLICY "Users can upload their own avatar"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'avatars');

CREATE POLICY "Users can view avatars"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (bucket_id = 'avatars');

CREATE POLICY "Users can update their own avatar"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (bucket_id = 'avatars');

CREATE POLICY "Users can delete their own avatar"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'avatars');