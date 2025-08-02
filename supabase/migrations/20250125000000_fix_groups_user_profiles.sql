/*
  # Виправлення зв'язків між groups та user_profiles

  1. Проблема
    - Таблиця groups.created_by посилається на users(id)
    - Таблиця group_members.user_id посилається на users(id)
    - Але в коді використовується таблиця user_profiles
    - Це створює невідповідність між схемою БД та кодом

  2. Рішення
    - Оновити foreign key constraints щоб вони посилалися на user_profiles
    - Додати відсутні поля до таблиці groups
    - Переконатися що всі зв'язки правильні
*/

-- 1. Додамо відсутні поля до таблиці groups якщо їх немає
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

-- 2. Видалимо старі foreign key constraints
ALTER TABLE group_members DROP CONSTRAINT IF EXISTS group_members_user_id_fkey;
ALTER TABLE groups DROP CONSTRAINT IF EXISTS groups_created_by_fkey;

-- 3. Додамо нові foreign key constraints що посилаються на user_profiles
ALTER TABLE group_members 
ADD CONSTRAINT group_members_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES user_profiles(id) ON DELETE CASCADE;

ALTER TABLE groups 
ADD CONSTRAINT groups_created_by_fkey 
FOREIGN KEY (created_by) REFERENCES user_profiles(id) ON DELETE CASCADE;

-- 4. Створимо індекси для нових полів
CREATE INDEX IF NOT EXISTS groups_category_idx ON groups(category);
CREATE INDEX IF NOT EXISTS groups_is_verified_idx ON groups(is_verified);
CREATE INDEX IF NOT EXISTS groups_is_active_idx ON groups(is_active);
CREATE INDEX IF NOT EXISTS groups_last_activity_idx ON groups(last_activity DESC);

-- 5. Перевіримо що всі foreign key constraints правильні
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