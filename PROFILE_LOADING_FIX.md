# Виправлення проблеми завантаження профілю

## Проблема
Сторінка профілю не підтягує дані з сервера.

## Діагностика
Додано детальне логування та компонент діагностики для виявлення проблем.

## Кроки виправлення

### 1. Налаштування Environment Variables

Створіть файл `.env` в корені проекту з наступним вмістом:

```env
VITE_SUPABASE_URL=your_supabase_project_url_here
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

**Як отримати ці значення:**
1. Відкрийте [Supabase Dashboard](https://supabase.com/dashboard)
2. Перейдіть до вашого проекту
3. В розділі "Settings" > "API" знайдете:
   - Project URL (для VITE_SUPABASE_URL)
   - Project API keys > anon/public (для VITE_SUPABASE_ANON_KEY)

### 2. Перевірка підключення

Після налаштування environment variables:
1. Перезапустіть додаток (`npm run dev`)
2. Відкрийте сторінку профілю
3. Подивіться на компонент "Діагностика Supabase" - він покаже статус підключення

### 3. Перевірка аутентифікації

Переконайтеся, що:
1. Користувач увійшов в систему
2. В консолі браузера немає помилок аутентифікації
3. Діагностика показує "✅ Авторизований"

### 4. Перевірка бази даних

Якщо підключення до БД не працює:
1. Перевірте, чи правильно налаштовані RLS політики
2. Переконайтеся, що таблиця `user_profiles` існує
3. Перевірте, чи маєте права доступу до таблиці

### 5. Створення профілю

Якщо профіль не існує, система автоматично створить його при першому завантаженні.

## Додаткові налаштування

### RLS Політики
Переконайтеся, що в Supabase налаштовані правильні RLS політики для таблиці `user_profiles`:

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
```

### Структура таблиці
Таблиця `user_profiles` повинна мати наступні поля:
- `id` (uuid, primary key)
- `auth_user_id` (uuid, foreign key to auth.users)
- `name` (text, not null)
- `last_name` (text)
- `email` (text, not null)
- `avatar` (text)
- `bio` (text)
- `city` (text)
- `birth_date` (date)
- `education` (text)
- `phone` (text)
- `work` (text)
- `website` (text)
- `relationship_status` (text)
- `hobbies` (jsonb)
- `languages` (jsonb)
- `created_at` (timestamptz)
- `updated_at` (timestamptz)

## Видалення діагностики

Після виправлення проблем видаліть компонент діагностики з `ProfileNew.tsx`:

```tsx
// Видаліть цей рядок:
<DebugSupabase />
```

## Логування

Детальне логування додано до:
- `useProfile` hook - для відстеження завантаження профілю
- `RightColumn` - для відстеження рендерингу
- `LeftColumn` - для відстеження рендерингу

Перевірте консоль браузера для детальної інформації про процес завантаження.



