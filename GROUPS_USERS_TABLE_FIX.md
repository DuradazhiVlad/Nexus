# Виправлення groups таблиці з використанням users таблиці

## Проблема

Отримуємо помилку 400 при запиті до таблиці `groups` через відсутність foreign key constraint між `groups` та `user_profiles`.

## Рішення

Використаємо таблицю `users` замість `user_profiles` для зв'язку з групами.

### Крок 1: Запустіть SQL скрипт для виправлення

Виконайте файл `fix_groups_users_foreign_key.sql` в Supabase SQL Editor:

```sql
-- Цей скрипт:
-- 1. Перевірить поточні foreign key constraints
-- 2. Перевірить чи існує таблиця users
-- 3. Видалить старі foreign key constraints
-- 4. Додасть нові foreign key constraints що посилаються на users
-- 5. Перевірить результат
```

### Крок 2: Оновлений код

Код вже оновлений для роботи з таблицею `users`:

1. **GroupsService** - використовує `users` таблицю для отримання інформації про створників
2. **DatabaseService** - додано метод `getCurrentUser()` для роботи з `users` таблицею
3. **useGroups hook** - оновлений для використання `getCurrentUser()`

### Крок 3: Перевірка

Після виконання SQL скрипта перевірте:

1. **Foreign key constraints існують:**
   ```sql
   SELECT 
       tc.table_name, 
       tc.constraint_name, 
       kcu.column_name,
       ccu.table_name AS foreign_table_name
   FROM information_schema.table_constraints tc
   JOIN information_schema.key_column_usage kcu 
       ON tc.constraint_name = kcu.constraint_name
   JOIN information_schema.constraint_column_usage ccu 
       ON ccu.constraint_name = tc.constraint_name
   WHERE tc.table_name IN ('groups', 'group_members')
       AND tc.constraint_type = 'FOREIGN KEY';
   ```

2. **Тестовий запит працює:**
   ```sql
   SELECT 
       g.id,
       g.name,
       g.created_by,
       u.name as creator_name,
       u.lastname as creator_lastname
   FROM groups g
   LEFT JOIN users u ON g.created_by = u.id
   LIMIT 5;
   ```

## Переваги використання users таблиці

1. **Структура таблиці users:**
   ```sql
   CREATE TABLE public.users (
     id uuid not null,
     email text not null,
     name text not null,
     lastname text null,
     avatar text null,
     bio text null,
     city text null,
     birthdate date null,
     created_at timestamp with time zone null default now(),
     notifications jsonb null default '{"email": true, "messages": true, "friendRequests": true}'::jsonb,
     privacy jsonb null default '{"showEmail": false, "showBirthDate": true, "profileVisibility": "public"}'::jsonb,
     auth_user_id uuid null,
     location text null,
     phone text null,
     website text null,
     work text null,
     education text null,
     birthday date null,
     relationshipstatus text null,
     cover text null,
     isverified boolean null default false,
     isonline boolean null default false,
     lastseen timestamp with time zone null default now(),
     hobbies text[] null default '{}'::text[],
     languages text[] null default '{}'::text[],
     constraint users_pkey primary key (id),
     constraint users_email_key unique (email),
     constraint users_auth_user_id_fkey foreign KEY (auth_user_id) references auth.users (id) on delete CASCADE,
     constraint users_id_fkey foreign KEY (id) references auth.users (id) on delete CASCADE
   );
   ```

2. **Відповідність полів:**
   - `users.id` ↔ `groups.created_by`
   - `users.id` ↔ `group_members.user_id`
   - `users.name` ↔ `creator.name`
   - `users.lastname` ↔ `creator.last_name`
   - `users.avatar` ↔ `creator.avatar`

## Очікуваний результат

Після виправлення:
- ✅ Foreign key constraints будуть створені між `groups` та `users`
- ✅ Supabase зможе виконувати JOIN запити
- ✅ Помилка 400 зникне
- ✅ Групи будуть завантажуватися з інформацією про створників
- ✅ Всі функції (створення, приєднання, фільтрація) будуть працювати

## Додаткові перевірки

Якщо потрібно, можна також перевірити:

1. **Структуру таблиці users:**
   ```sql
   SELECT column_name, data_type 
   FROM information_schema.columns 
   WHERE table_name = 'users';
   ```

2. **RLS політики:**
   ```sql
   SELECT * FROM pg_policies 
   WHERE tablename IN ('groups', 'group_members', 'users');
   ```

3. **Індекси:**
   ```sql
   SELECT indexname, indexdef 
   FROM pg_indexes 
   WHERE tablename IN ('groups', 'users');
   ```

4. **Дані в таблицях:**
   ```sql
   SELECT COUNT(*) as users_count FROM users;
   SELECT COUNT(*) as groups_count FROM groups;
   SELECT COUNT(*) as members_count FROM group_members;
   ``` 