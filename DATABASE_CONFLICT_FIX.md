# Виправлення конфлікту таблиць та RLS політик

## Проблема

У вас є дві таблиці: `users` та `user_profiles`, що створює конфлікт. Помилка 401 та "Новий рядок порушує політику безпеки" вказує на проблеми з RLS (Row Level Security) політиками.

## Рішення

### 1. Виконайте SQL скрипт для виправлення

```sql
-- Виконайте в Supabase Dashboard SQL Editor
-- Файл: fix_database_conflict.sql
```

### 2. Кроки виправлення

#### Крок 1: Перевірте дані в таблиці users
```sql
SELECT COUNT(*) as users_count FROM public.users;
```

#### Крок 2: Вирішіть конфлікт таблиць

**Варіант A: Якщо таблиця users не використовується**
```sql
-- Видаліть таблицю users (УВАГА: це видалить всі дані!)
DROP TABLE IF EXISTS public.users CASCADE;
```

**Варіант B: Якщо таблиця users використовується**
- Перенесіть дані з `users` в `user_profiles`
- Оновіть код для використання тільки `user_profiles`

#### Крок 3: Виправлення RLS політик

```sql
-- Видаляємо старі політики
DROP POLICY IF EXISTS "Users can view all profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.user_profiles;

-- Створюємо нові політики
CREATE POLICY "Users can view all profiles"
    ON public.user_profiles
    FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Users can insert own profile"
    ON public.user_profiles
    FOR INSERT
    TO authenticated
    WITH CHECK (auth_user_id = auth.uid());

CREATE POLICY "Users can update own profile"
    ON public.user_profiles
    FOR UPDATE
    TO authenticated
    USING (auth_user_id = auth.uid())
    WITH CHECK (auth_user_id = auth.uid());
```

### 3. Перевірка після виправлення

#### Перевірте RLS політики:
```sql
SELECT 
    policyname,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'user_profiles';
```

#### Перевірте зв'язок таблиць:
```sql
SELECT 
    au.id as auth_user_id,
    au.email as auth_email,
    up.id as profile_id,
    up.name as profile_name
FROM auth.users au
LEFT JOIN user_profiles up ON au.id = up.auth_user_id
ORDER BY au.created_at DESC
LIMIT 5;
```

### 4. Тестування реєстрації

Після виправлення протестуйте реєстрацію:

1. **Відкрийте додаток**: `npm run dev`
2. **Перейдіть на реєстрацію**: http://localhost:5173/register
3. **Заповніть форму** з тестовими даними
4. **Перевірте логи** в консолі браузера

### 5. Очікувані результати

#### ✅ Успішна реєстрація:
- Користувач створений в `auth.users`
- Профіль створений в `user_profiles`
- Немає помилок 401
- Немає помилок RLS

#### ✅ Логи в консолі:
```
🚀 Starting registration process...
✅ Auth signup successful: [user_id]
📝 Creating user profile...
✅ User profile created successfully
```

### 6. Можливі проблеми та рішення

#### Проблема: "Новий рядок порушує політику безпеки"
**Рішення:**
- Перевірте RLS політики
- Переконайтеся, що `auth_user_id` правильно встановлений
- Перевірте, чи користувач аутентифікований

#### Проблема: Помилка 401
**Рішення:**
- Перевірте налаштування Supabase
- Перевірте API ключі
- Перевірте CORS налаштування

#### Проблема: Конфлікт таблиць
**Рішення:**
- Використовуйте тільки одну таблицю (`user_profiles`)
- Видаліть або перейменуйте зайву таблицю
- Оновіть код для використання правильної таблиці

### 7. Структура після виправлення

#### Таблиця user_profiles:
```sql
CREATE TABLE public.user_profiles (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  auth_user_id uuid REFERENCES auth.users(id),
  name text NOT NULL,
  last_name text NOT NULL,
  email text NOT NULL,
  -- інші поля...
  PRIMARY KEY (id)
);
```

#### RLS політики:
- `Users can view all profiles` - перегляд всіх профілів
- `Users can insert own profile` - створення свого профілю
- `Users can update own profile` - оновлення свого профілю

### 8. Перевірка в Supabase Dashboard

1. **Authentication > Users** - перевірте користувачів
2. **Table Editor > user_profiles** - перевірте профілі
3. **SQL Editor** - виконайте тестові запити

### 9. Файли для виконання

1. `fix_database_conflict.sql` - виконати в Supabase SQL Editor
2. Перезапустити додаток: `npm run dev`
3. Протестувати реєстрацію: http://localhost:5173/register

### 10. Додаткові перевірки

#### Перевірте тригери:
```sql
SELECT trigger_name, event_manipulation 
FROM information_schema.triggers 
WHERE event_object_table = 'users' AND event_object_schema = 'auth';
```

#### Перевірте функції:
```sql
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_name = 'handle_new_user';
```

Після виконання цих кроків проблема з 401 помилкою та RLS політиками повинна бути вирішена! 