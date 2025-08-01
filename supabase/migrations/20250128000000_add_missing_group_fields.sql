/*
  # Додаємо відсутні поля до таблиці groups

  1. Додаємо поля:
    - category (text) - категорія групи
    - tags (text[]) - теги групи  
    - location (text) - локація групи
    - website (text) - веб-сайт групи
    - rules (text[]) - правила групи
    - contactEmail (text) - контактний email
    - cover (text) - обкладинка групи
    - post_count (integer) - кількість постів
    - is_verified (boolean) - чи верифікована група
    - is_active (boolean) - чи активна група
    - last_activity (timestamptz) - остання активність

  2. Оновлюємо індекси для нових полів
*/

-- Додаємо відсутні поля до таблиці groups
ALTER TABLE groups ADD COLUMN IF NOT EXISTS category text;
ALTER TABLE groups ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}';
ALTER TABLE groups ADD COLUMN IF NOT EXISTS location text;
ALTER TABLE groups ADD COLUMN IF NOT EXISTS website text;
ALTER TABLE groups ADD COLUMN IF NOT EXISTS rules text[] DEFAULT '{}';
ALTER TABLE groups ADD COLUMN IF NOT EXISTS contactEmail text;
ALTER TABLE groups ADD COLUMN IF NOT EXISTS cover text;
ALTER TABLE groups ADD COLUMN IF NOT EXISTS post_count integer DEFAULT 0;
ALTER TABLE groups ADD COLUMN IF NOT EXISTS is_verified boolean DEFAULT false;
ALTER TABLE groups ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;
ALTER TABLE groups ADD COLUMN IF NOT EXISTS last_activity timestamptz DEFAULT now();

-- Додаємо індекси для нових полів
CREATE INDEX IF NOT EXISTS groups_category_idx ON groups(category);
CREATE INDEX IF NOT EXISTS groups_is_verified_idx ON groups(is_verified);
CREATE INDEX IF NOT EXISTS groups_is_active_idx ON groups(is_active);
CREATE INDEX IF NOT EXISTS groups_last_activity_idx ON groups(last_activity DESC);

-- Оновлюємо RLS політики щоб включити нові поля
DROP POLICY IF EXISTS "Anyone can view public groups" ON groups;
CREATE POLICY "Anyone can view public groups"
  ON groups
  FOR SELECT
  TO authenticated
  USING (NOT is_private OR is_private = false);