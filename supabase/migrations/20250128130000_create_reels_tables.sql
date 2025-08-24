-- Create reels table
CREATE TABLE IF NOT EXISTS reels (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  video_url TEXT NOT NULL,
  thumbnail_url TEXT,
  duration INTEGER NOT NULL DEFAULT 0,
  views INTEGER NOT NULL DEFAULT 0,
  likes_count INTEGER NOT NULL DEFAULT 0,
  comments_count INTEGER NOT NULL DEFAULT 0,
  shares_count INTEGER NOT NULL DEFAULT 0,
  hashtags TEXT[] DEFAULT '{}',
  location TEXT,
  category TEXT NOT NULL DEFAULT 'other' CHECK (category IN ('trending', 'music', 'comedy', 'dance', 'food', 'travel', 'sports', 'education', 'pets', 'art', 'other')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create reel_likes table
CREATE TABLE IF NOT EXISTS reel_likes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  reel_id UUID NOT NULL REFERENCES reels(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(reel_id, user_id)
);

-- Create reel_comments table
CREATE TABLE IF NOT EXISTS reel_comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  reel_id UUID NOT NULL REFERENCES reels(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create reel_bookmarks table
CREATE TABLE IF NOT EXISTS reel_bookmarks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  reel_id UUID NOT NULL REFERENCES reels(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(reel_id, user_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_reels_user_id ON reels(user_id);
CREATE INDEX IF NOT EXISTS idx_reels_category ON reels(category);
CREATE INDEX IF NOT EXISTS idx_reels_created_at ON reels(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reels_views ON reels(views DESC);
CREATE INDEX IF NOT EXISTS idx_reels_likes_count ON reels(likes_count DESC);
CREATE INDEX IF NOT EXISTS idx_reel_likes_reel_id ON reel_likes(reel_id);
CREATE INDEX IF NOT EXISTS idx_reel_likes_user_id ON reel_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_reel_comments_reel_id ON reel_comments(reel_id);
CREATE INDEX IF NOT EXISTS idx_reel_bookmarks_user_id ON reel_bookmarks(user_id);

-- Enable RLS
ALTER TABLE reels ENABLE ROW LEVEL SECURITY;
ALTER TABLE reel_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE reel_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE reel_bookmarks ENABLE ROW LEVEL SECURITY;

-- RLS Policies for reels
CREATE POLICY "Anyone can view reels"
  ON reels
  FOR SELECT
  USING (true);

CREATE POLICY "Users can create their own reels"
  ON reels
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = reels.user_id AND auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own reels"
  ON reels
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = reels.user_id AND auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own reels"
  ON reels
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = reels.user_id AND auth_user_id = auth.uid()
    )
  );

-- RLS Policies for reel_likes
CREATE POLICY "Anyone can view reel likes"
  ON reel_likes
  FOR SELECT
  USING (true);

CREATE POLICY "Users can manage their own likes"
  ON reel_likes
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = reel_likes.user_id AND auth_user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = reel_likes.user_id AND auth_user_id = auth.uid()
    )
  );

-- RLS Policies for reel_comments
CREATE POLICY "Anyone can view reel comments"
  ON reel_comments
  FOR SELECT
  USING (true);

CREATE POLICY "Users can create comments"
  ON reel_comments
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = reel_comments.user_id AND auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own comments"
  ON reel_comments
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = reel_comments.user_id AND auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own comments"
  ON reel_comments
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = reel_comments.user_id AND auth_user_id = auth.uid()
    )
  );

-- RLS Policies for reel_bookmarks
CREATE POLICY "Users can view their own bookmarks"
  ON reel_bookmarks
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = reel_bookmarks.user_id AND auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage their own bookmarks"
  ON reel_bookmarks
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = reel_bookmarks.user_id AND auth_user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = reel_bookmarks.user_id AND auth_user_id = auth.uid()
    )
  );

-- Create functions for incrementing counters
CREATE OR REPLACE FUNCTION increment_reel_views(reel_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE reels SET views = views + 1 WHERE id = reel_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION increment_reel_likes(reel_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE reels SET likes_count = likes_count + 1 WHERE id = reel_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION decrement_reel_likes(reel_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE reels SET likes_count = GREATEST(0, likes_count - 1) WHERE id = reel_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION increment_reel_comments(reel_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE reels SET comments_count = comments_count + 1 WHERE id = reel_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION decrement_reel_comments(reel_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE reels SET comments_count = GREATEST(0, comments_count - 1) WHERE id = reel_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_reels_updated_at
  BEFORE UPDATE ON reels
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reel_comments_updated_at
  BEFORE UPDATE ON reel_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();