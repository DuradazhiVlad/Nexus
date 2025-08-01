-- Виправлення тригера дружби та RLS політик
-- Виконайте цей скрипт в Supabase Dashboard SQL Editor

-- 1. Видаляємо старий тригер
DROP TRIGGER IF EXISTS friend_request_accepted_trigger ON friend_requests;

-- 2. Виправляємо функцію handle_friend_request_accepted
CREATE OR REPLACE FUNCTION handle_friend_request_accepted()
RETURNS TRIGGER AS $$
BEGIN
    -- Якщо запит прийнято, створити дружбу
    IF NEW.status = 'accepted' AND OLD.status = 'pending' THEN
        -- Отримуємо auth_user_id з user_profiles для sender та receiver
        INSERT INTO friendships (user1_id, user2_id)
        VALUES (
            CASE WHEN NEW.sender_id < NEW.receiver_id THEN NEW.sender_id ELSE NEW.receiver_id END,
            CASE WHEN NEW.sender_id < NEW.receiver_id THEN NEW.receiver_id ELSE NEW.sender_id END
        )
        ON CONFLICT (user1_id, user2_id) DO NOTHING;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Створюємо новий тригер
CREATE TRIGGER friend_request_accepted_trigger
    AFTER UPDATE ON friend_requests
    FOR EACH ROW
    EXECUTE FUNCTION handle_friend_request_accepted();

-- 4. Перевіряємо RLS політики для friend_requests
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'friend_requests';

-- 5. Створюємо правильні RLS політики для friend_requests
DO $$
BEGIN
    -- Дозволити користувачам переглядати свої запити (як sender або receiver)
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'friend_requests' 
        AND policyname = 'Allow users to view their friend requests'
    ) THEN
        CREATE POLICY "Allow users to view their friend requests"
        ON friend_requests FOR SELECT
        TO authenticated
        USING (sender_id = auth.uid() OR receiver_id = auth.uid());
    END IF;

    -- Дозволити користувачам створювати запити на дружбу
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'friend_requests' 
        AND policyname = 'Allow users to create friend requests'
    ) THEN
        CREATE POLICY "Allow users to create friend requests"
        ON friend_requests FOR INSERT
        TO authenticated
        WITH CHECK (sender_id = auth.uid());
    END IF;

    -- Дозволити receiver оновлювати статус запиту
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'friend_requests' 
        AND policyname = 'Allow receiver to update friend request status'
    ) THEN
        CREATE POLICY "Allow receiver to update friend request status"
        ON friend_requests FOR UPDATE
        TO authenticated
        USING (receiver_id = auth.uid())
        WITH CHECK (receiver_id = auth.uid());
    END IF;
END $$;

-- 6. Перевіряємо RLS політики для friendships
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'friendships';

-- 7. Створюємо правильні RLS політики для friendships
DO $$
BEGIN
    -- Дозволити користувачам переглядати свої дружби
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'friendships' 
        AND policyname = 'Allow users to view their friendships'
    ) THEN
        CREATE POLICY "Allow users to view their friendships"
        ON friendships FOR SELECT
        TO authenticated
        USING (user1_id = auth.uid() OR user2_id = auth.uid());
    END IF;

    -- Дозволити системі створювати дружби (через тригер)
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'friendships' 
        AND policyname = 'Allow system to create friendships'
    ) THEN
        CREATE POLICY "Allow system to create friendships"
        ON friendships FOR INSERT
        TO authenticated
        WITH CHECK (true);
    END IF;

    -- Дозволити користувачам видаляти свої дружби
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'friendships' 
        AND policyname = 'Allow users to delete their friendships'
    ) THEN
        CREATE POLICY "Allow users to delete their friendships"
        ON friendships FOR DELETE
        TO authenticated
        USING (user1_id = auth.uid() OR user2_id = auth.uid());
    END IF;
END $$;

-- 8. Тестуємо тригер - створюємо тестовий запит на дружбу
-- (виконайте це тільки якщо у вас є тестові користувачі)
/*
INSERT INTO friend_requests (sender_id, receiver_id, status)
VALUES (
    (SELECT auth_user_id FROM user_profiles LIMIT 1),
    (SELECT auth_user_id FROM user_profiles LIMIT 1 OFFSET 1),
    'pending'
)
ON CONFLICT (sender_id, receiver_id) DO NOTHING;
*/

-- 9. Фінальна перевірка
SELECT 
    'Pending friend requests:' as info,
    COUNT(*) as count
FROM friend_requests 
WHERE status = 'pending'
UNION ALL
SELECT 
    'Accepted friend requests:' as info,
    COUNT(*) as count
FROM friend_requests 
WHERE status = 'accepted'
UNION ALL
SELECT 
    'Total friendships:' as info,
    COUNT(*) as count
FROM friendships; 