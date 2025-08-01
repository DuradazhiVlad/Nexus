/*
  # Додавання функціоналу постів у групах

  1. Нові таблиці
    - `group_posts` - пости в групах
    - `group_post_media` - медіафайли до постів

  2. Безпека
    - RLS політики для постів та медіа
    - Тільки члени групи можуть створювати пости
    - Всі члени можуть переглядати пости
*/

-- Створення таблиці постів у групах
CREATE TABLE IF NOT EXISTS group_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Створення таблиці медіафайлів для постів
CREATE TABLE IF NOT EXISTS group_post_media (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES group_posts(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('image', 'video')),
  url text NOT NULL,
  filename text,
  file_size integer,
  created_at timestamptz DEFAULT now()
);

-- Індекси для оптимізації
CREATE INDEX IF NOT EXISTS group_posts_group_id_idx ON group_posts(group_id);
CREATE INDEX IF NOT EXISTS group_posts_author_id_idx ON group_posts(author_id);
CREATE INDEX IF NOT EXISTS group_posts_created_at_idx ON group_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS group_post_media_post_id_idx ON group_post_media(post_id);

-- Увімкнення RLS
ALTER TABLE group_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_post_media ENABLE ROW LEVEL SECURITY;

-- RLS політики для group_posts
CREATE POLICY "Members can view group posts"
  ON group_posts
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM group_members 
      WHERE group_members.group_id = group_posts.group_id 
      AND group_members.user_id = (
        SELECT id FROM users WHERE auth_user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Members can create posts in their groups"
  ON group_posts
  FOR INSERT
  TO authenticated
  WITH CHECK (
    author_id = (SELECT id FROM users WHERE auth_user_id = auth.uid())
    AND EXISTS (
      SELECT 1 FROM group_members 
      WHERE group_members.group_id = group_posts.group_id 
      AND group_members.user_id = (
        SELECT id FROM users WHERE auth_user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Authors can update their own posts"
  ON group_posts
  FOR UPDATE
  TO authenticated
  USING (author_id = (SELECT id FROM users WHERE auth_user_id = auth.uid()));

CREATE POLICY "Authors can delete their own posts"
  ON group_posts
  FOR DELETE
  TO authenticated
  USING (author_id = (SELECT id FROM users WHERE auth_user_id = auth.uid()));

-- RLS політики для group_post_media
CREATE POLICY "Members can view post media"
  ON group_post_media
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM group_posts 
      JOIN group_members ON group_posts.group_id = group_members.group_id
      WHERE group_posts.id = group_post_media.post_id
      AND group_members.user_id = (
        SELECT id FROM users WHERE auth_user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Post authors can manage media"
  ON group_post_media
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM group_posts 
      WHERE group_posts.id = group_post_media.post_id
      AND group_posts.author_id = (
        SELECT id FROM users WHERE auth_user_id = auth.uid()
      )
    )
  );

-- Функція для оновлення updated_at
CREATE OR REPLACE FUNCTION update_group_post_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Тригер для оновлення updated_at
CREATE TRIGGER update_group_post_updated_at_trigger
  BEFORE UPDATE ON group_posts
  FOR EACH ROW
  EXECUTE FUNCTION update_group_post_updated_at();