/*
  # Add user posts functionality

  1. New Tables
    - `posts`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to users)
      - `content` (text)
      - `media_url` (text, optional)
      - `media_type` (text, optional)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
      - `likes_count` (integer, default 0)
      - `comments_count` (integer, default 0)

    - `post_likes`
      - `id` (uuid, primary key)
      - `post_id` (uuid, foreign key to posts)
      - `user_id` (uuid, foreign key to users)
      - `created_at` (timestamp)

    - `post_comments`
      - `id` (uuid, primary key)
      - `post_id` (uuid, foreign key to posts)
      - `user_id` (uuid, foreign key to users)
      - `content` (text)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for CRUD operations
    - Users can manage their own posts
    - Users can view public posts
</*/

-- Create posts table
CREATE TABLE IF NOT EXISTS posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  content text NOT NULL,
  media_url text,
  media_type text CHECK (media_type IN ('photo', 'video', 'document')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  likes_count integer DEFAULT 0,
  comments_count integer DEFAULT 0
);

-- Create post_likes table
CREATE TABLE IF NOT EXISTS post_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL,
  user_id uuid NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(post_id, user_id)
);

-- Create post_comments table
CREATE TABLE IF NOT EXISTS post_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL,
  user_id uuid NOT NULL,
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Add foreign key constraints
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'posts_user_id_fkey'
  ) THEN
    ALTER TABLE posts ADD CONSTRAINT posts_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'post_likes_post_id_fkey'
  ) THEN
    ALTER TABLE post_likes ADD CONSTRAINT post_likes_post_id_fkey 
    FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'post_likes_user_id_fkey'
  ) THEN
    ALTER TABLE post_likes ADD CONSTRAINT post_likes_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'post_comments_post_id_fkey'
  ) THEN
    ALTER TABLE post_comments ADD CONSTRAINT post_comments_post_id_fkey 
    FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'post_comments_user_id_fkey'
  ) THEN
    ALTER TABLE post_comments ADD CONSTRAINT post_comments_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Create indexes
CREATE INDEX IF NOT EXISTS posts_user_id_idx ON posts(user_id);
CREATE INDEX IF NOT EXISTS posts_created_at_idx ON posts(created_at DESC);
CREATE INDEX IF NOT EXISTS post_likes_post_id_idx ON post_likes(post_id);
CREATE INDEX IF NOT EXISTS post_likes_user_id_idx ON post_likes(user_id);
CREATE INDEX IF NOT EXISTS post_comments_post_id_idx ON post_comments(post_id);
CREATE INDEX IF NOT EXISTS post_comments_user_id_idx ON post_comments(user_id);

-- Enable RLS
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_comments ENABLE ROW LEVEL SECURITY;

-- Posts policies
CREATE POLICY "Users can view all posts" ON posts
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can create their own posts" ON posts
  FOR INSERT TO authenticated 
  WITH CHECK (auth.uid() IN (
    SELECT auth_user_id FROM user_profiles WHERE id = posts.user_id
  ));

CREATE POLICY "Users can update their own posts" ON posts
  FOR UPDATE TO authenticated 
  USING (auth.uid() IN (
    SELECT auth_user_id FROM user_profiles WHERE id = posts.user_id
  ));

CREATE POLICY "Users can delete their own posts" ON posts
  FOR DELETE TO authenticated 
  USING (auth.uid() IN (
    SELECT auth_user_id FROM user_profiles WHERE id = posts.user_id
  ));

-- Post likes policies
CREATE POLICY "Users can view all post likes" ON post_likes
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can like posts" ON post_likes
  FOR INSERT TO authenticated 
  WITH CHECK (auth.uid() IN (
    SELECT auth_user_id FROM user_profiles WHERE id = post_likes.user_id
  ));

CREATE POLICY "Users can unlike posts" ON post_likes
  FOR DELETE TO authenticated 
  USING (auth.uid() IN (
    SELECT auth_user_id FROM user_profiles WHERE id = post_likes.user_id
  ));

-- Post comments policies
CREATE POLICY "Users can view all post comments" ON post_comments
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can create comments" ON post_comments
  FOR INSERT TO authenticated 
  WITH CHECK (auth.uid() IN (
    SELECT auth_user_id FROM user_profiles WHERE id = post_comments.user_id
  ));

CREATE POLICY "Users can update their own comments" ON post_comments
  FOR UPDATE TO authenticated 
  USING (auth.uid() IN (
    SELECT auth_user_id FROM user_profiles WHERE id = post_comments.user_id
  ));

CREATE POLICY "Users can delete their own comments" ON post_comments
  FOR DELETE TO authenticated 
  USING (auth.uid() IN (
    SELECT auth_user_id FROM user_profiles WHERE id = post_comments.user_id
  ));

-- Function to update post counts
CREATE OR REPLACE FUNCTION update_post_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE posts SET likes_count = likes_count + 1 WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE posts SET likes_count = likes_count - 1 WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_post_comments_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE posts SET comments_count = comments_count + 1 WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE posts SET comments_count = comments_count - 1 WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
DROP TRIGGER IF EXISTS update_post_likes_count_trigger ON post_likes;
CREATE TRIGGER update_post_likes_count_trigger
  AFTER INSERT OR DELETE ON post_likes
  FOR EACH ROW EXECUTE FUNCTION update_post_likes_count();

DROP TRIGGER IF EXISTS update_post_comments_count_trigger ON post_comments;
CREATE TRIGGER update_post_comments_count_trigger
  AFTER INSERT OR DELETE ON post_comments
  FOR EACH ROW EXECUTE FUNCTION update_post_comments_count();

-- Function to update post updated_at
CREATE OR REPLACE FUNCTION update_post_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_post_updated_at_trigger ON posts;
CREATE TRIGGER update_post_updated_at_trigger
  BEFORE UPDATE ON posts
  FOR EACH ROW EXECUTE FUNCTION update_post_updated_at();

-- Унікальний індекс для user_profiles
CREATE UNIQUE INDEX IF NOT EXISTS user_profiles_auth_user_id_unique ON public.user_profiles(auth_user_id);

-- Увімкнути RLS для user_profiles
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Дозволити власнику профілю select/update/insert
CREATE POLICY IF NOT EXISTS "Allow profile owner" ON public.user_profiles
  FOR ALL
  USING (auth_user_id = auth.uid())
  WITH CHECK (auth_user_id = auth.uid());

-- Приклад для posts (оновити назви полів під свою структуру!)
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Allow post owner insert" ON public.posts
  FOR INSERT
  WITH CHECK (
    user_id = (
      SELECT id FROM user_profiles WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY IF NOT EXISTS "Allow post owner select" ON public.posts
  FOR SELECT
  USING (
    user_id = (
      SELECT id FROM user_profiles WHERE auth_user_id = auth.uid()
    )
  );

-- Аналогічно для інших таблиць (groups, group_members, friend_requests, friendships)