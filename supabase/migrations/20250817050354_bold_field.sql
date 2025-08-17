/*
  # Виправлення таблиць дружби

  1. Видалення старих таблиць friendships та friend_requests
  2. Створення нових таблиць з правильною структурою
  3. Налаштування RLS та політик безпеки
*/

-- Видаляємо старі таблиці якщо існують
DROP TABLE IF EXISTS friend_requests CASCADE;
DROP TABLE IF EXISTS friendships CASCADE;

-- Створюємо таблицю friend_requests
CREATE TABLE friend_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  friend_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, friend_id)
);

-- Створюємо таблицю friendships
CREATE TABLE friendships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user1_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  user2_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user1_id, user2_id),
  CHECK (user1_id != user2_id)
);

-- Включаємо RLS
ALTER TABLE friend_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;

-- Політики для friend_requests
CREATE POLICY "Users can view their friend requests"
  ON friend_requests
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE (id = friend_requests.user_id OR id = friend_requests.friend_id) 
      AND auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create friend requests"
  ON friend_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = friend_requests.user_id AND auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their friend requests"
  ON friend_requests
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE (id = friend_requests.user_id OR id = friend_requests.friend_id) 
      AND auth_user_id = auth.uid()
    )
  );

-- Політики для friendships
CREATE POLICY "Users can view their friendships"
  ON friendships
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE (id = friendships.user1_id OR id = friendships.user2_id) 
      AND auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create friendships"
  ON friendships
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE (id = friendships.user1_id OR id = friendships.user2_id) 
      AND auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their friendships"
  ON friendships
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE (id = friendships.user1_id OR id = friendships.user2_id) 
      AND auth_user_id = auth.uid()
    )
  );

-- Індекси
CREATE INDEX idx_friend_requests_user_id ON friend_requests(user_id);
CREATE INDEX idx_friend_requests_friend_id ON friend_requests(friend_id);
CREATE INDEX idx_friend_requests_status ON friend_requests(status);
CREATE INDEX idx_friendships_user1_id ON friendships(user1_id);
CREATE INDEX idx_friendships_user2_id ON friendships(user2_id);

-- Тригер для оновлення updated_at в friend_requests
CREATE TRIGGER update_friend_requests_updated_at
  BEFORE UPDATE ON friend_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();