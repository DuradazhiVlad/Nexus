/*
  # Виправлення таблиці users

  1. Додаємо відсутні поля якщо їх немає
  2. Виправляємо типи даних
  3. Додаємо правильні індекси
*/

-- Додаємо поля якщо їх немає
ALTER TABLE users ADD COLUMN IF NOT EXISTS auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS location TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS website TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS work TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS education TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS birthday DATE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS lastname TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS relationshipStatus TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS cover TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS isVerified BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS isOnline BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS lastSeen TIMESTAMPTZ DEFAULT now();
ALTER TABLE users ADD COLUMN IF NOT EXISTS notifications JSONB DEFAULT '{"email": true, "messages": true, "friendRequests": true}'::jsonb;
ALTER TABLE users ADD COLUMN IF NOT EXISTS privacy JSONB DEFAULT '{"profileVisibility": "public", "showBirthDate": true, "showEmail": false, "showPhone": false}'::jsonb;
ALTER TABLE users ADD COLUMN IF NOT EXISTS hobbies TEXT[] DEFAULT '{}';
ALTER TABLE users ADD COLUMN IF NOT EXISTS languages TEXT[] DEFAULT '{}';

-- Створюємо унікальний індекс для auth_user_id
CREATE UNIQUE INDEX IF NOT EXISTS users_auth_user_id_unique ON users(auth_user_id);

-- Додаємо індекси для оптимізації
CREATE INDEX IF NOT EXISTS users_email_idx ON users(email);
CREATE INDEX IF NOT EXISTS users_name_idx ON users(name);
CREATE INDEX IF NOT EXISTS users_lastname_idx ON users(lastname);
CREATE INDEX IF NOT EXISTS users_location_idx ON users(location);

-- Оновлюємо RLS політики
DROP POLICY IF EXISTS "Users can view their own profile" ON users;
DROP POLICY IF EXISTS "Users can update their own profile" ON users;
DROP POLICY IF EXISTS "Users can insert their own profile" ON users;
DROP POLICY IF EXISTS "Authenticated users can view all profiles" ON users;

-- Створюємо нові політики
CREATE POLICY "Users can view their own profile"
  ON users FOR SELECT
  TO authenticated
  USING (auth_user_id = auth.uid());

CREATE POLICY "Users can update their own profile"
  ON users FOR UPDATE
  TO authenticated
  USING (auth_user_id = auth.uid());

CREATE POLICY "Users can insert their own profile"
  ON users FOR INSERT
  TO authenticated
  WITH CHECK (auth_user_id = auth.uid());

CREATE POLICY "Authenticated users can view all profiles"
  ON users FOR SELECT
  TO authenticated
  USING (true);