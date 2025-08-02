/*
  # Виправлення помилки 400 при завантаженні груп

  1. Проблема
    - Помилка 400 при запиті до таблиці groups
    - Можливі причини:
      - Неправильні foreign key constraints
      - Відсутні поля в таблиці
      - Проблеми з RLS політиками
      - Неправильні індекси

  2. Рішення
    - Перевірити та виправити структуру таблиць
    - Оновити foreign key constraints
    - Додати відсутні поля
    - Виправити RLS політики
*/

-- 1. Перевіримо поточну структуру таблиці groups
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'groups'
ORDER BY ordinal_position;

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
WHERE tc.table_name IN ('group_members', 'groups')
    AND tc.constraint_type = 'FOREIGN KEY';

-- 3. Перевіримо чи існує таблиця user_profiles
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'user_profiles'
) as user_profiles_exists;

-- 4. Перевіримо структуру таблиці user_profiles
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'user_profiles'
ORDER BY ordinal_position;

-- 5. Додамо відсутні поля до таблиці groups якщо їх немає
ALTER TABLE groups ADD COLUMN IF NOT EXISTS category text;
ALTER TABLE groups ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}'::text[];
ALTER TABLE groups ADD COLUMN IF NOT EXISTS location text;
ALTER TABLE groups ADD COLUMN IF NOT EXISTS website text;
ALTER TABLE groups ADD COLUMN IF NOT EXISTS rules text[] DEFAULT '{}'::text[];
ALTER TABLE groups ADD COLUMN IF NOT EXISTS contactemail text;
ALTER TABLE groups ADD COLUMN IF NOT EXISTS cover text;
ALTER TABLE groups ADD COLUMN IF NOT EXISTS post_count integer DEFAULT 0;
ALTER TABLE groups ADD COLUMN IF NOT EXISTS is_verified boolean DEFAULT false;
ALTER TABLE groups ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;
ALTER TABLE groups ADD COLUMN IF NOT EXISTS last_activity timestamptz DEFAULT now();

-- 6. Видалимо старі foreign key constraints якщо вони існують
ALTER TABLE group_members DROP CONSTRAINT IF EXISTS group_members_user_id_fkey;
ALTER TABLE groups DROP CONSTRAINT IF EXISTS groups_created_by_fkey;

-- 7. Додамо нові foreign key constraints що посилаються на user_profiles
-- Спочатку перевіримо чи існує таблиця user_profiles
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_profiles') THEN
        -- Додаємо foreign key constraints
        ALTER TABLE group_members 
        ADD CONSTRAINT group_members_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES user_profiles(id) ON DELETE CASCADE;

        ALTER TABLE groups 
        ADD CONSTRAINT groups_created_by_fkey 
        FOREIGN KEY (created_by) REFERENCES user_profiles(id) ON DELETE CASCADE;
        
        RAISE NOTICE 'Foreign key constraints added successfully';
    ELSE
        RAISE NOTICE 'Table user_profiles does not exist, skipping foreign key constraints';
    END IF;
END $$;

-- 8. Створимо індекси для оптимізації
CREATE INDEX IF NOT EXISTS groups_is_active_idx ON groups(is_active);
CREATE INDEX IF NOT EXISTS groups_last_activity_idx ON groups(last_activity DESC);
CREATE INDEX IF NOT EXISTS groups_created_by_idx ON groups(created_by);
CREATE INDEX IF NOT EXISTS groups_category_idx ON groups(category);
CREATE INDEX IF NOT EXISTS groups_is_verified_idx ON groups(is_verified);

CREATE INDEX IF NOT EXISTS group_members_user_id_idx ON group_members(user_id);
CREATE INDEX IF NOT EXISTS group_members_group_id_idx ON group_members(group_id);

-- 9. Перевіримо RLS політики
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
WHERE tablename IN ('groups', 'group_members')
ORDER BY tablename, policyname;

-- 10. Створимо прості RLS політики якщо їх немає
-- Для groups
DROP POLICY IF EXISTS "Anyone can view public groups" ON groups;
CREATE POLICY "Anyone can view public groups"
  ON groups FOR SELECT
  TO authenticated
  USING (NOT is_private);

DROP POLICY IF EXISTS "Group members can view private groups" ON groups;
CREATE POLICY "Group members can view private groups"
  ON groups FOR SELECT
  TO authenticated
  USING (
    is_private AND EXISTS (
      SELECT 1 FROM group_members 
      WHERE group_members.group_id = groups.id 
      AND group_members.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Authenticated users can create groups" ON groups;
CREATE POLICY "Authenticated users can create groups"
  ON groups FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Для group_members
DROP POLICY IF EXISTS "Users can view group memberships" ON group_members;
CREATE POLICY "Users can view group memberships"
  ON group_members FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can join groups" ON group_members;
CREATE POLICY "Users can join groups"
  ON group_members FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can leave groups" ON group_members;
CREATE POLICY "Users can leave groups"
  ON group_members FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- 11. Перевіримо що всі таблиці мають RLS увімкнено
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;

-- 12. Тестовий запит для перевірки
SELECT 
    g.id,
    g.name,
    g.description,
    g.is_private,
    g.member_count,
    g.post_count,
    g.category,
    g.is_active,
    g.created_at,
    g.last_activity
FROM groups g
WHERE g.is_active = true
ORDER BY g.last_activity DESC
LIMIT 5;

-- 13. Перевіримо структуру після змін
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'groups'
ORDER BY ordinal_position; 