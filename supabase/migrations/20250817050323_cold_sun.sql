/*
  # Виправлення таблиці user_profiles

  1. Видалення старої таблиці user_profiles (якщо існує)
  2. Створення нової таблиці user_profiles з правильною структурою
  3. Налаштування RLS та політик безпеки
  4. Створення індексів для оптимізації
*/

-- Видаляємо стару таблицю якщо існує
DROP TABLE IF EXISTS user_profiles CASCADE;

-- Створюємо нову таблицю user_profiles
CREATE TABLE user_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  name text NOT NULL,
  last_name text DEFAULT '',
  email text NOT NULL,
  avatar text,
  bio text,
  city text,
  birth_date date,
  education text,
  phone text,
  work text,
  website text,
  relationship_status text,
  hobbies jsonb DEFAULT '[]'::jsonb,
  languages jsonb DEFAULT '[]'::jsonb,
  email_verified boolean DEFAULT false,
  notifications jsonb DEFAULT '{"email": true, "messages": true, "friendRequests": true}'::jsonb,
  privacy jsonb DEFAULT '{"profileVisibility": "public", "showBirthDate": true, "showEmail": false}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Включаємо RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Політики безпеки
CREATE POLICY "Users can view public profiles"
  ON user_profiles
  FOR SELECT
  USING (
    (privacy->>'profileVisibility')::text = 'public' OR
    auth.uid() = auth_user_id
  );

CREATE POLICY "Users can view their own profile"
  ON user_profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = auth_user_id);

CREATE POLICY "Users can update their own profile"
  ON user_profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = auth_user_id)
  WITH CHECK (auth.uid() = auth_user_id);

CREATE POLICY "Users can insert their own profile"
  ON user_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = auth_user_id);

-- Індекси для оптимізації
CREATE INDEX idx_user_profiles_auth_user_id ON user_profiles(auth_user_id);
CREATE INDEX idx_user_profiles_email ON user_profiles(email);
CREATE INDEX idx_user_profiles_name ON user_profiles(name);
CREATE INDEX idx_user_profiles_created_at ON user_profiles(created_at);

-- Тригер для автоматичного оновлення updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();