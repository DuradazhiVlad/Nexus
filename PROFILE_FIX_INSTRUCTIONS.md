# 🔧 Інструкції для виправлення профільних даних

## Проблема
Таблиця `user_profiles` може не мати всіх необхідних полів для збереження профільних даних (біо, дата народження, робота, місто, веб-сайт, освіта, мови, телефон, хобі, сімейний стан).

## Рішення

### Крок 1: Виконати SQL міграцію в Supabase Dashboard

1. Відкрийте ваш проект Supabase: https://supabase.com/dashboard
2. Перейдіть до розділу **SQL Editor**
3. Виконайте SQL скрипт з файлу `create_user_profiles_table.sql` або `20250128160000_add_missing_profile_fields.sql`

### Крок 2: Перевірити структуру таблиці

Виконайте цей SQL запит для перевірки структури:

```sql
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'user_profiles' 
AND table_schema = 'public'
ORDER BY ordinal_position;
```

### Крок 3: Перевірити RLS політики

Виконайте цей запит для перевірки політик безпеки:

```sql
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'user_profiles';
```

### Крок 4: Тестування через браузер

1. Відкрийте файл `test_profile_table.html` у браузері
2. Натисніть кнопки для тестування:
   - "Перевірити підключення"
   - "Перевірити таблицю"
   - "Створити тестовий профіль"
   - "Оновити профіль"

### Крок 5: Тестування в додатку

1. Запустіть додаток: `npm run dev`
2. Перейдіть на сторінку профілю
3. Натисніть кнопку "🔍 Test user_profiles Table"
4. Перевірте консоль браузера на наявність помилок

## Очікувані поля в таблиці user_profiles

- `id` (uuid, primary key)
- `auth_user_id` (uuid, foreign key до auth.users)
- `name` (text, обов'язкове)
- `last_name` (text)
- `email` (text, обов'язкове)
- `avatar` (text)
- `bio` (text)
- `city` (text)
- `birth_date` (date)
- `education` (text)
- `phone` (text)
- `work` (text)
- `website` (text)
- `relationship_status` (text)
- `hobbies` (jsonb, масив рядків)
- `languages` (jsonb, масив рядків)
- `notifications` (jsonb)
- `privacy` (jsonb)
- `gender` (text, 'male'/'female'/'other')
- `looking_for_relationship` (boolean)
- `age` (integer)
- `email_verified` (boolean)
- `created_at` (timestamptz)
- `updated_at` (timestamptz)

## Файли, які були створені/оновлені

1. **Міграції SQL:**
   - `supabase/migrations/20250128150000_create_user_profiles_table.sql`
   - `supabase/migrations/20250128160000_add_missing_profile_fields.sql`
   - `create_user_profiles_table.sql` (для ручного виконання)

2. **Тестові файли:**
   - `test_profile_table.html` (тест через браузер)
   - `debug_profile.js` (Node.js скрипт)

3. **Оновлені компоненти:**
   - `src/pages/profile/ProfileNew.tsx` (додана кнопка тестування)

## Сервіси та хуки

Код для роботи з профілем вже готовий:

- **AuthUserService** (`src/lib/authUserService.ts`) - основний сервіс для роботи з профілем
- **userProfileService** (`src/lib/userProfileService.ts`) - допоміжний сервіс
- **useProfile** (`src/pages/profile/hooks/useProfile.ts`) - React хук для управління станом профілю
- **ProfileEditForm** (`src/pages/profile/components/ProfileEditForm.tsx`) - форма редагування

## Наступні кроки

1. Виконайте SQL міграцію в Supabase Dashboard
2. Протестуйте через `test_profile_table.html`
3. Протестуйте в додатку через кнопку "Test user_profiles Table"
4. Спробуйте створити/редагувати профіль в додатку
5. Перевірте, чи зберігаються всі поля правильно

## Можливі помилки та рішення

### Помилка: "relation 'user_profiles' does not exist"
**Рішення:** Виконайте SQL міграцію для створення таблиці

### Помилка: "permission denied for table user_profiles"
**Рішення:** Перевірте RLS політики та права доступу

### Помилка: "column does not exist"
**Рішення:** Виконайте міграцію для додавання відсутніх полів

### Помилка: "invalid input syntax for type json"
**Рішення:** Перевірте, що hobbies та languages передаються як масиви