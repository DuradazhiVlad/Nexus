/*
# Виправлення RLS політик для posts, friend_requests, groups

1. Спрощення політик для створення записів
2. Додавання відладочної інформації
3. Виправлення перевірок auth_user_id
*/

-- Видаляємо старі політики для posts
DROP POLICY IF EXISTS "Users can create their own posts" ON posts;
DROP POLICY IF EXISTS "Users can update their own posts" ON posts;
DROP POLICY IF EXISTS "Users can delete their own posts" ON posts;
DROP POLICY IF EXISTS "Users can like posts" ON post_likes;
DROP POLICY IF EXISTS "Users can unlike posts" ON post_likes;

-- Створюємо нові спрощені політики для posts
CREATE POLICY "Users can create posts"
  ON posts
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id IN (
      SELECT id FROM user_profiles 
      WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their posts"
  ON posts
  FOR UPDATE
  TO authenticated
  USING (
    user_id IN (
      SELECT id FROM user_profiles 
      WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their posts"
  ON posts
  FOR DELETE
  TO authenticated
  USING (
    user_id IN (
      SELECT id FROM user_profiles 
      WHERE auth_user_id = auth.uid()
    )
  );

-- Політики для post_likes
CREATE POLICY "Users can like posts"
  ON post_likes
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id IN (
      SELECT id FROM user_profiles 
      WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can unlike posts"
  ON post_likes
  FOR DELETE
  TO authenticated
  USING (
    user_id IN (
      SELECT id FROM user_profiles 
      WHERE auth_user_id = auth.uid()
    )
  );

-- Видаляємо старі політики для friend_requests
DROP POLICY IF EXISTS "Users can create friend requests" ON friend_requests;
DROP POLICY IF EXISTS "Users can update their friend requests" ON friend_requests;

-- Створюємо нові політики для friend_requests
CREATE POLICY "Users can create friend requests"
  ON friend_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id IN (
      SELECT id FROM user_profiles 
      WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update friend requests"
  ON friend_requests
  FOR UPDATE
  TO authenticated
  USING (
    user_id IN (
      SELECT id FROM user_profiles 
      WHERE auth_user_id = auth.uid()
    ) OR friend_id IN (
      SELECT id FROM user_profiles 
      WHERE auth_user_id = auth.uid()
    )
  );

-- Видаляємо старі політики для groups
DROP POLICY IF EXISTS "Users can create groups" ON groups;
DROP POLICY IF EXISTS "Group admins can update groups" ON groups;

-- Створюємо нові політики для groups
CREATE POLICY "Users can create groups"
  ON groups
  FOR INSERT
  TO authenticated
  WITH CHECK (
    created_by IN (
      SELECT id FROM user_profiles 
      WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Group creators can update groups"
  ON groups
  FOR UPDATE
  TO authenticated
  USING (
    created_by IN (
      SELECT id FROM user_profiles 
      WHERE auth_user_id = auth.uid()
    )
  );

-- Додаємо політику для group_members
DROP POLICY IF EXISTS "Users can join groups" ON group_members;
CREATE POLICY "Users can join groups"
  ON group_members
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id IN (
      SELECT id FROM user_profiles 
      WHERE auth_user_id = auth.uid()
    )
  );

-- Перевіряємо що всі таблиці мають увімкнений RLS
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE friend_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;

-- Надаємо права на виконання функцій
GRANT USAGE ON SCHEMA public TO authenticated, anon;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;