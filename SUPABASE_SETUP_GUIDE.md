# Налаштування Supabase для проекту Nexus

## Проблема
Профіль не підтягує інформацію з Supabase і не відправляє дані.

## Крок 1: Перевірка Environment Variables

Переконайтеся, що файл `.env` в корені проекту містить:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### Як отримати ці значення:
1. Відкрийте [Supabase Dashboard](https://supabase.com/dashboard)
2. Перейдіть до вашого проекту
3. В розділі **Settings** → **API** знайдете:
   - **Project URL** (для VITE_SUPABASE_URL)
   - **Project API keys** → **anon/public** (для VITE_SUPABASE_ANON_KEY)

## Крок 2: Перевірка структури БД

Переконайтеся, що в Supabase створені наступні таблиці:

### user_profiles
```sql
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
```

### posts
```sql
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
```

### friendships
```sql
CREATE TABLE friendships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user1_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  user2_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user1_id, user2_id),
  CHECK (user1_id <> user2_id)
);
```

## Крок 3: RLS Політики

Додайте наступні RLS політики:

### user_profiles
```sql
-- Дозволити користувачам читати свої профілі
CREATE POLICY "Users can view their own profile"
  ON user_profiles
  FOR SELECT
  USING (auth.uid() = auth_user_id);

-- Дозволити користувачам оновлювати свої профілі
CREATE POLICY "Users can update their own profile"
  ON user_profiles
  FOR UPDATE
  USING (auth.uid() = auth_user_id);

-- Дозволити користувачам створювати свої профілі
CREATE POLICY "Users can insert their own profile"
  ON user_profiles
  FOR INSERT
  WITH CHECK (auth.uid() = auth_user_id);
```

### posts
```sql
-- Дозволити користувачам читати всі пости
CREATE POLICY "Anyone can view posts"
  ON posts
  FOR SELECT
  USING (true);

-- Дозволити користувачам створювати свої пости
CREATE POLICY "Users can create posts"
  ON posts
  FOR INSERT
  WITH CHECK (auth.uid() IN (
    SELECT auth_user_id FROM user_profiles WHERE id = user_id
  ));
```

### friendships
```sql
-- Дозволити користувачам читати свої дружби
CREATE POLICY "Users can view their friendships"
  ON friendships
  FOR SELECT
  USING (
    auth.uid() IN (
      SELECT auth_user_id FROM user_profiles WHERE id IN (user1_id, user2_id)
    )
  );
```

## Крок 4: Тестування

1. Перезапустіть додаток: `npm run dev`
2. Відкрийте сторінку профілю
3. Подивіться на компонент "Тест підключення Supabase"
4. Перевірте статус підключення

## Крок 5: Налагодження

Якщо щось не працює:

1. **Перевірте консоль браузера** на помилки
2. **Перевірте Network tab** в DevTools для запитів до Supabase
3. **Переконайтеся**, що користувач авторизований
4. **Перевірте**, що таблиці існують і мають правильну структуру

## Типові проблеми:

### "Environment variables не налаштовані"
- Створіть файл `.env` з правильними значеннями
- Перезапустіть додаток

### "Користувач не авторизований"
- Увійдіть в систему через форму входу
- Перевірте, чи збережений токен в localStorage

### "Профіль не існує"
- Система автоматично створить профіль при першому завантаженні
- Перевірте RLS політики

### "Помилка створення поста"
- Перевірте, чи існує таблиця `posts`
- Перевірте RLS політики для таблиці `posts`

## Видалення тестового компонента

Після виправлення всіх проблем видаліть компонент `SupabaseTest` з `ProfileNew.tsx`:

```tsx
// Видаліть цей рядок:
<SupabaseTest />
```



