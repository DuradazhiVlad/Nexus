/*
  # Виправлення таблиць груп

  1. Видалення старих таблиць груп
  2. Створення нових таблиць з правильною структурою
  3. Налаштування RLS та політик безпеки
*/

-- Видаляємо старі таблиці якщо існують
DROP TABLE IF EXISTS group_post_media CASCADE;
DROP TABLE IF EXISTS group_posts CASCADE;
DROP TABLE IF EXISTS group_members CASCADE;
DROP TABLE IF EXISTS groups CASCADE;

-- Створюємо таблицю groups
CREATE TABLE groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  avatar text,
  cover_image text,
  is_public boolean DEFAULT true,
  created_by uuid REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  category text,
  location text,
  website text,
  contactemail text,
  rules jsonb DEFAULT '[]'::jsonb,
  member_count integer DEFAULT 1,
  post_count integer DEFAULT 0,
  is_active boolean DEFAULT true,
  is_verified boolean DEFAULT false,
  last_activity timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Створюємо таблицю group_members
CREATE TABLE group_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid REFERENCES groups(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  role text DEFAULT 'member' CHECK (role IN ('admin', 'moderator', 'member')),
  is_active boolean DEFAULT true,
  joined_at timestamptz DEFAULT now(),
  UNIQUE(group_id, user_id)
);

-- Створюємо таблицю group_posts
CREATE TABLE group_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid REFERENCES groups(id) ON DELETE CASCADE NOT NULL,
  author_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  content text NOT NULL,
  media_url text,
  media_type text CHECK (media_type IN ('photo', 'video', 'document')),
  likes_count integer DEFAULT 0,
  comments_count integer DEFAULT 0,
  is_pinned boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Створюємо таблицю group_post_media
CREATE TABLE group_post_media (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid REFERENCES group_posts(id) ON DELETE CASCADE NOT NULL,
  type text NOT NULL CHECK (type IN ('image', 'video')),
  url text NOT NULL,
  filename text,
  file_size integer,
  thumbnail_url text,
  created_at timestamptz DEFAULT now()
);

-- Включаємо RLS
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_post_media ENABLE ROW LEVEL SECURITY;

-- Політики для groups
CREATE POLICY "Anyone can view public groups"
  ON groups
  FOR SELECT
  USING (is_public = true OR is_active = true);

CREATE POLICY "Group members can view private groups"
  ON groups
  FOR SELECT
  TO authenticated
  USING (
    is_public = true OR
    EXISTS (
      SELECT 1 FROM group_members gm
      JOIN user_profiles up ON gm.user_id = up.id
      WHERE gm.group_id = groups.id AND up.auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create groups"
  ON groups
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = groups.created_by AND auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Group admins can update groups"
  ON groups
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM group_members gm
      JOIN user_profiles up ON gm.user_id = up.id
      WHERE gm.group_id = groups.id 
      AND gm.role = 'admin' 
      AND up.auth_user_id = auth.uid()
    )
  );

-- Політики для group_members
CREATE POLICY "Group members can view membership"
  ON group_members
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = group_members.user_id AND auth_user_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM group_members gm2
      JOIN user_profiles up ON gm2.user_id = up.id
      WHERE gm2.group_id = group_members.group_id AND up.auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can join groups"
  ON group_members
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = group_members.user_id AND auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can leave groups"
  ON group_members
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = group_members.user_id AND auth_user_id = auth.uid()
    )
  );

-- Політики для group_posts
CREATE POLICY "Group members can view posts"
  ON group_posts
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM groups g
      WHERE g.id = group_posts.group_id AND g.is_public = true
    ) OR
    EXISTS (
      SELECT 1 FROM group_members gm
      JOIN user_profiles up ON gm.user_id = up.id
      WHERE gm.group_id = group_posts.group_id AND up.auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Group members can create posts"
  ON group_posts
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM group_members gm
      JOIN user_profiles up ON gm.user_id = up.id
      WHERE gm.group_id = group_posts.group_id 
      AND gm.user_id = group_posts.author_id
      AND up.auth_user_id = auth.uid()
    )
  );

-- Політики для group_post_media
CREATE POLICY "Anyone can view group post media"
  ON group_post_media
  FOR SELECT
  USING (true);

CREATE POLICY "Post authors can add media"
  ON group_post_media
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM group_posts gp
      JOIN user_profiles up ON gp.author_id = up.id
      WHERE gp.id = group_post_media.post_id AND up.auth_user_id = auth.uid()
    )
  );

-- Індекси
CREATE INDEX idx_groups_created_by ON groups(created_by);
CREATE INDEX idx_groups_is_public ON groups(is_public);
CREATE INDEX idx_groups_category ON groups(category);
CREATE INDEX idx_group_members_group_id ON group_members(group_id);
CREATE INDEX idx_group_members_user_id ON group_members(user_id);
CREATE INDEX idx_group_posts_group_id ON group_posts(group_id);
CREATE INDEX idx_group_posts_author_id ON group_posts(author_id);
CREATE INDEX idx_group_post_media_post_id ON group_post_media(post_id);

-- Тригери для оновлення updated_at
CREATE TRIGGER update_groups_updated_at
  BEFORE UPDATE ON groups
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_group_posts_updated_at
  BEFORE UPDATE ON group_posts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();