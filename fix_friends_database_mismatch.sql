/*
  # Виправлення невідповідності між таблицями друзів та користувачів
  
  Проблема: 
  - friendships та friend_requests посилаються на auth.users(id)
  - Але users таблиця має auth_user_id що посилається на auth.users(id)
  - Це створює невідповідність в логіці додатку
  
  Рішення:
  - Змінити foreign keys в friendships та friend_requests щоб посилатися на users(id)
  - Оновити логіку в додатку для правильного пошуку друзів
*/

-- 1. Перевіримо поточну структуру таблиць
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name IN ('friendships', 'friend_requests', 'users')
ORDER BY table_name, ordinal_position;

-- 2. Перевіримо foreign key constraints
SELECT 
    tc.table_name, 
    tc.constraint_name, 
    tc.constraint_type,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage ccu 
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_name IN ('friendships', 'friend_requests')
    AND tc.constraint_type = 'FOREIGN KEY'
ORDER BY tc.table_name, tc.constraint_name;

-- 3. Видалимо існуючі foreign key constraints
ALTER TABLE friendships DROP CONSTRAINT IF EXISTS friendships_user1_id_fkey;
ALTER TABLE friendships DROP CONSTRAINT IF EXISTS friendships_user2_id_fkey;
ALTER TABLE friend_requests DROP CONSTRAINT IF EXISTS friend_requests_sender_id_fkey;
ALTER TABLE friend_requests DROP CONSTRAINT IF EXISTS friend_requests_receiver_id_fkey;

-- 4. Додамо нові foreign key constraints що посилаються на users(id)
ALTER TABLE friendships 
ADD CONSTRAINT friendships_user1_id_fkey 
FOREIGN KEY (user1_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE friendships 
ADD CONSTRAINT friendships_user2_id_fkey 
FOREIGN KEY (user2_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE friend_requests 
ADD CONSTRAINT friend_requests_sender_id_fkey 
FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE friend_requests 
ADD CONSTRAINT friend_requests_receiver_id_fkey 
FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE;

-- 5. Оновимо RLS політики для роботи з users(id) замість auth.users(id)
DROP POLICY IF EXISTS "Users can view their own friend requests" ON friend_requests;
DROP POLICY IF EXISTS "Users can send friend requests" ON friend_requests;
DROP POLICY IF EXISTS "Users can update received requests" ON friend_requests;
DROP POLICY IF EXISTS "Users can delete their own requests" ON friend_requests;

DROP POLICY IF EXISTS "Users can view their friendships" ON friendships;
DROP POLICY IF EXISTS "Users can create friendships" ON friendships;
DROP POLICY IF EXISTS "Users can delete their friendships" ON friendships;

-- Нові політики для friend_requests
CREATE POLICY "Users can view their own friend requests" ON friend_requests
  FOR SELECT USING (
    sender_id IN (SELECT id FROM users WHERE auth_user_id = auth.uid()) OR
    receiver_id IN (SELECT id FROM users WHERE auth_user_id = auth.uid())
  );

CREATE POLICY "Users can send friend requests" ON friend_requests
  FOR INSERT WITH CHECK (
    sender_id IN (SELECT id FROM users WHERE auth_user_id = auth.uid())
  );

CREATE POLICY "Users can update received requests" ON friend_requests
  FOR UPDATE USING (
    receiver_id IN (SELECT id FROM users WHERE auth_user_id = auth.uid())
  );

CREATE POLICY "Users can delete their own requests" ON friend_requests
  FOR DELETE USING (
    sender_id IN (SELECT id FROM users WHERE auth_user_id = auth.uid()) OR
    receiver_id IN (SELECT id FROM users WHERE auth_user_id = auth.uid())
  );

-- Нові політики для friendships
CREATE POLICY "Users can view their friendships" ON friendships
  FOR SELECT USING (
    user1_id IN (SELECT id FROM users WHERE auth_user_id = auth.uid()) OR
    user2_id IN (SELECT id FROM users WHERE auth_user_id = auth.uid())
  );

CREATE POLICY "Users can create friendships" ON friendships
  FOR INSERT WITH CHECK (
    user1_id IN (SELECT id FROM users WHERE auth_user_id = auth.uid()) OR
    user2_id IN (SELECT id FROM users WHERE auth_user_id = auth.uid())
  );

CREATE POLICY "Users can delete their friendships" ON friendships
  FOR DELETE USING (
    user1_id IN (SELECT id FROM users WHERE auth_user_id = auth.uid()) OR
    user2_id IN (SELECT id FROM users WHERE auth_user_id = auth.uid())
  );

-- 6. Оновимо функцію handle_friend_request_accepted
CREATE OR REPLACE FUNCTION handle_friend_request_accepted()
RETURNS TRIGGER AS $$
BEGIN
  -- Якщо запит прийнято, створити дружбу
  IF NEW.status = 'accepted' AND OLD.status = 'pending' THEN
    INSERT INTO friendships (user1_id, user2_id)
    VALUES (
      LEAST(NEW.sender_id, NEW.receiver_id),
      GREATEST(NEW.sender_id, NEW.receiver_id)
    )
    ON CONFLICT DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 7. Перевіримо що все працює
SELECT COUNT(*) as friendships_count FROM friendships;
SELECT COUNT(*) as friend_requests_count FROM friend_requests;
SELECT COUNT(*) as users_count FROM users;

-- 8. Тестовий запит для перевірки дружб
SELECT 
    f.id,
    u1.name as user1_name,
    u2.name as user2_name,
    f.created_at
FROM friendships f
JOIN users u1 ON f.user1_id = u1.id
JOIN users u2 ON f.user2_id = u2.id
LIMIT 5; 