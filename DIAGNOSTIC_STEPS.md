# Діагностика проблем з Supabase

## Поточний стан
Додано тестовий компонент для діагностики підключення до Supabase.

## Кроки для вирішення проблеми:

### 1. 🔍 Перевірте Environment Variables
- Відкрийте файл `.env` в корені проекту
- Переконайтеся, що містить правильні значення:
  ```env
  VITE_SUPABASE_URL=https://your-project-id.supabase.co
  VITE_SUPABASE_ANON_KEY=your-anon-key-here
  ```

### 2. 🧪 Запустіть тест
- Перезапустіть додаток: `npm run dev`
- Відкрийте сторінку профілю
- Подивіться на компонент "Тест підключення Supabase"
- Перевірте статус в консолі браузера

### 3. 📊 Перевірте статус тесту:
- ✅ **Environment variables налаштовані** - файл .env правильно налаштований
- ✅ **Користувач авторизований** - ви увійшли в систему
- ✅ **Профіль завантажено** - профіль існує в БД
- ❌ **Помилка** - потрібно виправити відповідну проблему

### 4. 🔧 Можливі проблеми та рішення:

#### Environment Variables не налаштовані
**Рішення:** Створіть файл `.env` з правильними значеннями Supabase

#### Користувач не авторизований
**Рішення:** Увійдіть в систему через форму входу

#### Профіль не існує
**Рішення:** Система автоматично створить профіль

#### Помилка створення поста
**Рішення:** Перевірте структуру таблиці `posts` в Supabase

### 5. 📋 Структура БД (переконайтеся, що існує):

```sql
-- Таблиця user_profiles
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
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Таблиця posts
CREATE TABLE posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  content text NOT NULL,
  media_url text,
  media_type text CHECK (media_type IN ('photo', 'video', 'document')),
  likes_count integer DEFAULT 0,
  comments_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Таблиця friendships
CREATE TABLE friendships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user1_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  user2_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user1_id, user2_id),
  CHECK (user1_id <> user2_id)
);
```

### 6. 🔐 RLS Політики (додайте в Supabase):

```sql
-- user_profiles
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile"
  ON user_profiles FOR SELECT
  USING (auth.uid() = auth_user_id);

CREATE POLICY "Users can update their own profile"
  ON user_profiles FOR UPDATE
  USING (auth.uid() = auth_user_id);

CREATE POLICY "Users can insert their own profile"
  ON user_profiles FOR INSERT
  WITH CHECK (auth.uid() = auth_user_id);

-- posts
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view posts"
  ON posts FOR SELECT
  USING (true);

CREATE POLICY "Users can create posts"
  ON posts FOR INSERT
  WITH CHECK (auth.uid() IN (
    SELECT auth_user_id FROM user_profiles WHERE id = user_id
  ));

-- friendships
ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their friendships"
  ON friendships FOR SELECT
  USING (
    auth.uid() IN (
      SELECT auth_user_id FROM user_profiles WHERE id IN (user1_id, user2_id)
    )
  );
```

### 7. 🧹 Після виправлення:
- Видаліть компонент `SupabaseTest` з `ProfileNew.tsx`
- Видаліть файл `src/components/SupabaseTest.tsx`
- Видаліть логування з `useProfile.ts`

## Контакт для допомоги:
Якщо проблема залишається, надішліть скріншот компонента "Тест підключення Supabase" та повідомлення з консолі браузера.



