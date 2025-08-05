# Інструкції для тестування реєстрації

## 1. Виконайте SQL скрипти

### Спочатку виконайте скрипт для створення тригерів:
```sql
-- Виконайте в Supabase Dashboard SQL Editor
-- Файл: fix_registration_trigger.sql
```

### Потім виконайте тестовий скрипт:
```sql
-- Виконайте в Supabase Dashboard SQL Editor
-- Файл: test_registration.sql
```

## 2. Перевірте структуру таблиць

### Таблиця auth.users:
- `id` (uuid) - унікальний ідентифікатор
- `email` (varchar) - email користувача
- `encrypted_password` (varchar) - зашифрований пароль
- `email_confirmed_at` (timestamp) - час підтвердження email
- `raw_user_meta_data` (jsonb) - метадані користувача (ім'я, прізвище)
- `created_at` (timestamp) - час створення
- `updated_at` (timestamp) - час оновлення

### Таблиця user_profiles:
- `id` (uuid) - унікальний ідентифікатор
- `auth_user_id` (uuid) - посилання на auth.users
- `name` (text) - ім'я користувача
- `last_name` (text) - прізвище користувача
- `email` (text) - email користувача
- `hobbies` (text[]) - масив хобі
- `languages` (text[]) - масив мов
- `notifications` (jsonb) - налаштування сповіщень
- `privacy` (jsonb) - налаштування приватності
- `created_at` (timestamp) - час створення
- `updated_at` (timestamp) - час оновлення

## 3. Тестування реєстрації

### Крок 1: Відкрийте додаток
```bash
npm run dev
```

### Крок 2: Перейдіть на сторінку реєстрації
- Відкрийте http://localhost:5173/register
- Або натисніть "Реєстрація" в меню

### Крок 3: Заповніть форму реєстрації
- **Ім'я**: Введіть тестове ім'я (наприклад, "Тест")
- **Прізвище**: Введіть тестове прізвище (наприклад, "Користувач")
- **Email**: Введіть унікальний email (наприклад, "test@example.com")
- **Пароль**: Введіть пароль мінімум 6 символів

### Крок 4: Натисніть "Зареєструватися"

### Крок 5: Перевірте результати

#### В консолі браузера повинні з'явитися логи:
```
🚀 Starting registration process...
✅ Auth signup successful: [user_id]
📝 Creating user profile...
✅ User profile created successfully
```

#### В Supabase Dashboard перевірте:

1. **Таблиця auth.users**:
```sql
SELECT 
    id,
    email,
    email_confirmed_at,
    raw_user_meta_data,
    created_at
FROM auth.users 
ORDER BY created_at DESC 
LIMIT 1;
```

2. **Таблиця user_profiles**:
```sql
SELECT 
    id,
    auth_user_id,
    name,
    last_name,
    email,
    hobbies,
    languages,
    notifications,
    privacy,
    created_at
FROM user_profiles 
ORDER BY created_at DESC 
LIMIT 1;
```

3. **Перевірте зв'язок**:
```sql
SELECT 
    au.id as auth_user_id,
    au.email as auth_email,
    up.name as profile_name,
    up.last_name as profile_last_name,
    up.hobbies,
    up.languages
FROM auth.users au
JOIN user_profiles up ON au.id = up.auth_user_id
WHERE au.email = 'test@example.com';
```

## 4. Очікувані результати

### ✅ Успішна реєстрація:
- Користувач створений в `auth.users`
- Профіль створений в `user_profiles`
- Всі поля заповнені правильно
- `hobbies` та `languages` - порожні масиви
- `notifications` та `privacy` - JSON об'єкти з налаштуваннями за замовчуванням

### ❌ Можливі помилки:
- **Email вже існує**: Спробуйте інший email
- **Пароль занадто короткий**: Використовуйте мінімум 6 символів
- **Помилка створення профілю**: Перевірте RLS політики
- **Тригер не спрацював**: Перевірте функцію `handle_new_user`

## 5. Виправлення проблем

### Якщо профіль не створюється автоматично:
```sql
-- Перевірте тригери
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'users' AND event_object_schema = 'auth';

-- Перевірте функцію
SELECT 
    routine_name,
    routine_definition
FROM information_schema.routines 
WHERE routine_name = 'handle_new_user';
```

### Якщо RLS блокує операції:
```sql
-- Перевірте RLS політики
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
WHERE tablename = 'user_profiles';
```

## 6. Додаткові тести

### Тест з різними даними:
- Спробуйте реєстрацію з різними іменами та прізвищами
- Перевірте, чи правильно обробляються кириличні символи
- Тестуйте з довгими іменами

### Тест валідації:
- Спробуйте реєстрацію з неправильним email
- Спробуйте реєстрацію з коротким паролем
- Спробуйте реєстрацію з порожніми полями

### Тест дублювання:
- Спробуйте зареєструватися з тим самим email двічі
- Перевірте, чи правильно обробляється помилка

## 7. Очищення тестових даних

Після тестування видаліть тестові дані:
```sql
-- Видаліть тестового користувача
DELETE FROM user_profiles WHERE email = 'test@example.com';
DELETE FROM auth.users WHERE email = 'test@example.com';
``` 