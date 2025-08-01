/*
  # Додавання підрахунку друзів

  1. Додаємо поле friends_count до user_profiles
  2. Створюємо функцію для автоматичного оновлення кількості друзів
  3. Створюємо тригери для автоматичного оновлення
*/

-- Додаємо поле friends_count до user_profiles
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS friends_count INTEGER DEFAULT 0;

-- Створюємо функцію для оновлення кількості друзів
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

-- Створюємо функцію для видалення дружби
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

-- Створюємо тригери
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

-- Оновлюємо існуючі записи
UPDATE user_profiles 
SET friends_count = (
  SELECT COUNT(*) 
  FROM friendships 
  WHERE (user1_id = user_profiles.auth_user_id OR user2_id = user_profiles.auth_user_id)
); 