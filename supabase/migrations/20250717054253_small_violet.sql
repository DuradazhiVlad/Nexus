/*
  # Повне перестворення бази даних груп

  1. Видалення старих таблиць
    - Видаляємо `group_members` та `groups` таблиці
    - Видаляємо всі пов'язані тригери та функції

  2. Створення нових таблиць
    - `groups` - основна таблиця груп
    - `group_members` - члени груп

  3. Налаштування безпеки
    - RLS політики для обох таблиць
    - Правильні дозволи для створення та управління групами

  4. Індекси та тригери
    - Оптимізація запитів
    - Автоматичне оновлення лічильника членів
*/

-- Видаляємо старі таблиці та залежності
DROP TABLE IF EXISTS group_members CASCADE;
DROP TABLE IF EXISTS groups CASCADE;

-- Видаляємо функції якщо існують
DROP FUNCTION IF EXISTS update_group_member_count() CASCADE;

-- Створюємо таблицю груп
CREATE TABLE groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  avatar text,
  is_private boolean DEFAULT false,
  created_by uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  member_count integer DEFAULT 1
);

-- Створюємо таблицю членів груп
CREATE TABLE group_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role text DEFAULT 'member' CHECK (role IN ('admin', 'moderator', 'member')),
  joined_at timestamptz DEFAULT now(),
  UNIQUE(group_id, user_id)
);

-- Створюємо індекси для оптимізації
CREATE INDEX groups_created_by_idx ON groups(created_by);
CREATE INDEX groups_is_private_idx ON groups(is_private);
CREATE INDEX groups_name_idx ON groups(name);

CREATE INDEX group_members_group_id_idx ON group_members(group_id);
CREATE INDEX group_members_user_id_idx ON group_members(user_id);

-- Увімкнути RLS
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;

-- RLS політики для таблиці groups
CREATE POLICY "Anyone can view public groups"
  ON groups
  FOR SELECT
  TO authenticated
  USING (NOT is_private);

CREATE POLICY "Group members can view private groups"
  ON groups
  FOR SELECT
  TO authenticated
  USING (
    is_private AND EXISTS (
      SELECT 1 FROM group_members 
      WHERE group_members.group_id = groups.id 
      AND group_members.user_id = (
        SELECT id FROM users WHERE auth_user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Authenticated users can create groups"
  ON groups
  FOR INSERT
  TO authenticated
  WITH CHECK (
    created_by = (
      SELECT id FROM users WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Group creators can update their groups"
  ON groups
  FOR UPDATE
  TO authenticated
  USING (
    created_by = (
      SELECT id FROM users WHERE auth_user_id = auth.uid()
    )
  );

-- RLS політики для таблиці group_members
CREATE POLICY "Users can view group memberships"
  ON group_members
  FOR SELECT
  TO authenticated
  USING (
    user_id = (
      SELECT id FROM users WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can join groups"
  ON group_members
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = (
      SELECT id FROM users WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can leave groups"
  ON group_members
  FOR DELETE
  TO authenticated
  USING (
    user_id = (
      SELECT id FROM users WHERE auth_user_id = auth.uid()
    )
  );

-- Функція для оновлення лічильника членів групи
CREATE OR REPLACE FUNCTION update_group_member_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE groups 
    SET member_count = member_count + 1 
    WHERE id = NEW.group_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE groups 
    SET member_count = member_count - 1 
    WHERE id = OLD.group_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Тригер для автоматичного оновлення лічильника
CREATE TRIGGER update_group_member_count_trigger
  AFTER INSERT OR DELETE ON group_members
  FOR EACH ROW EXECUTE FUNCTION update_group_member_count();