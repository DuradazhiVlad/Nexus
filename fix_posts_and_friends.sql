-- Виправлення проблем з постами та друзями
-- Виконайте цей скрипт в Supabase Dashboard SQL Editor

-- 1. Додаємо поле friends_count до user_profiles
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS friends_count INTEGER DEFAULT 0;

-- 2. Створюємо функцію для оновлення кількості друзів
CREATE OR REPLACE FUNCTION update_friends_count()
RETURNS TRIGGER AS $$
BEGIN
  -- Оновлюємо кількість друзів для user1
  UPDATE user_profiles 
  SET friends_count = (
    SELECT COUNT(*) 
    FROM friendships 
    WHERE (user1_id = NEW.user1_id OR user2_id = NEW.user1_id)
  )
  WHERE auth_user_id = NEW.user1_id;
  
  -- Оновлюємо кількість друзів для user2
  UPDATE user_profiles 
  SET friends_count = (
    SELECT COUNT(*) 
    FROM friendships 
    WHERE (user1_id = NEW.user2_id OR user2_id = NEW.user2_id)
  )
  WHERE auth_user_id = NEW.user2_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Створюємо функцію для видалення дружби
CREATE OR REPLACE FUNCTION update_friends_count_on_delete()
RETURNS TRIGGER AS $$
BEGIN
  -- Оновлюємо кількість друзів для user1
  UPDATE user_profiles 
  SET friends_count = (
    SELECT COUNT(*) 
    FROM friendships 
    WHERE (user1_id = OLD.user1_id OR user2_id = OLD.user1_id)
  )
  WHERE auth_user_id = OLD.user1_id;
  
  -- Оновлюємо кількість друзів для user2
  UPDATE user_profiles 
  SET friends_count = (
    SELECT COUNT(*) 
    FROM friendships 
    WHERE (user1_id = OLD.user2_id OR user2_id = OLD.user2_id)
  )
  WHERE auth_user_id = OLD.user2_id;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- 4. Створюємо тригери
DROP TRIGGER IF EXISTS trigger_update_friends_count ON friendships;
CREATE TRIGGER trigger_update_friends_count
  AFTER INSERT ON friendships
  FOR EACH ROW
  EXECUTE FUNCTION update_friends_count();

DROP TRIGGER IF EXISTS trigger_update_friends_count_delete ON friendships;
CREATE TRIGGER trigger_update_friends_count_delete
  AFTER DELETE ON friendships
  FOR EACH ROW
  EXECUTE FUNCTION update_friends_count_on_delete();

-- 5. Оновлюємо існуючі записи
UPDATE user_profiles 
SET friends_count = (
  SELECT COUNT(*) 
  FROM friendships 
  WHERE (user1_id = user_profiles.auth_user_id OR user2_id = user_profiles.auth_user_id)
);

-- 6. Перевіряємо структуру таблиці posts
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'posts'
ORDER BY ordinal_position;

-- 7. Перевіряємо структуру таблиці post_likes
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'post_likes'
ORDER BY ordinal_position;

-- 8. Перевіряємо структуру таблиці post_comments
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'post_comments'
ORDER BY ordinal_position;

-- 9. Перевіряємо RLS політики для posts
SELECT 
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'posts';

-- 10. Додаємо політику для видалення постів (якщо її немає)
DROP POLICY IF EXISTS "Users can delete their own posts" ON posts;
CREATE POLICY "Users can delete their own posts"
  ON posts
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_profiles.id = posts.user_id 
      AND user_profiles.auth_user_id = auth.uid()
    )
  );

-- 11. Перевіряємо кількість постів та друзів
SELECT 
    'posts' as table_name,
    COUNT(*) as count
FROM posts
UNION ALL
SELECT 
    'friendships' as table_name,
    COUNT(*) as count
FROM friendships
UNION ALL
SELECT 
    'user_profiles' as table_name,
    COUNT(*) as count
FROM user_profiles;

-- 12. Перевіряємо приклад поста з кількістю друзів
SELECT 
    p.id,
    p.content,
    p.created_at,
    up.name,
    up.last_name,
    up.friends_count,
    (SELECT COUNT(*) FROM post_likes WHERE post_id = p.id) as likes_count,
    (SELECT COUNT(*) FROM post_comments WHERE post_id = p.id) as comments_count
FROM posts p
JOIN user_profiles up ON p.user_id = up.id
LIMIT 5; 