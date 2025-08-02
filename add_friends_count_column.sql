-- Add friends_count column to user_profiles table
-- Run this script in your Supabase SQL editor

-- 1. Add the friends_count column
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS friends_count INTEGER DEFAULT 0;

-- 2. Create function to update friends count
CREATE OR REPLACE FUNCTION update_friends_count()
RETURNS TRIGGER AS $$
BEGIN
  -- Update friends count for user1
  UPDATE user_profiles 
  SET friends_count = (
    SELECT COUNT(*) 
    FROM friendships 
    WHERE (user1_id = NEW.user1_id OR user2_id = NEW.user1_id)
  )
  WHERE auth_user_id = NEW.user1_id;
  
  -- Update friends count for user2
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

-- 3. Create function for deleting friendships
CREATE OR REPLACE FUNCTION update_friends_count_on_delete()
RETURNS TRIGGER AS $$
BEGIN
  -- Update friends count for user1
  UPDATE user_profiles 
  SET friends_count = (
    SELECT COUNT(*) 
    FROM friendships 
    WHERE (user1_id = OLD.user1_id OR user2_id = OLD.user1_id)
  )
  WHERE auth_user_id = OLD.user1_id;
  
  -- Update friends count for user2
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

-- 4. Create triggers
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

-- 5. Update existing records
UPDATE user_profiles 
SET friends_count = (
  SELECT COUNT(*) 
  FROM friendships 
  WHERE (user1_id = user_profiles.auth_user_id OR user2_id = user_profiles.auth_user_id)
);

-- 6. Verify the column was added
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'user_profiles' AND column_name = 'friends_count'; 