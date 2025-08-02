# Інструкції для виправлення проблем з групами

## Проблема

У вашій схемі бази даних є невідповідність між таблицями:
- Таблиця `groups.created_by` посилається на `users(id)`
- Таблиця `group_members.user_id` посилається на `users(id)`
- Але в коді використовується таблиця `user_profiles`

Це призводить до помилок при отриманні даних з бази даних.

## Рішення

### 1. Виконайте міграцію бази даних

Запустіть SQL скрипт `fix_groups_database.sql` або міграцію `20250125000000_fix_groups_user_profiles.sql` в Supabase Dashboard:

```sql
-- Виконайте цей скрипт в Supabase SQL Editor
-- Це виправить foreign key constraints та додасть відсутні поля
```

### 2. Перевірте структуру таблиць

Після виконання міграції перевірте структуру таблиць за допомогою `test_groups_functionality.sql`.

### 3. Код вже виправлений

Я вже виправив код в `src/pages/groups/hooks/useGroups.ts`:
- Змінив запит для отримання груп
- Розділив запити на окремі частини
- Виправив зв'язки з `user_profiles`

### 4. Основні зміни в коді

#### В `useGroups.ts`:
```typescript
// Було:
const { data, error: groupsError } = await supabase
  .from('groups')
  .select(`
    *,
    user_profiles!groups_created_by_fkey (
      id,
      name,
      last_name,
      avatar
    ),
    group_members!group_members_group_id_fkey (
      role,
      joined_at
    )
  `)
  .eq('group_members.user_id', user.id);

// Стало:
const { data: groupsData, error: groupsError } = await supabase
  .from('groups')
  .select(`
    *,
    creator:user_profiles!groups_created_by_fkey (
      id,
      name,
      last_name,
      avatar
    )
  `)
  .eq('is_active', true)
  .order('last_activity', { ascending: false });

// Окремий запит для членства
const { data: membershipsData, error: membershipsError } = await supabase
  .from('group_members')
  .select('group_id, role, joined_at')
  .eq('user_id', user.id);
```

### 5. Перевірка роботи

1. Запустіть додаток
2. Перейдіть на сторінку груп
3. Перевірте консоль браузера на наявність помилок
4. Спробуйте створити нову групу
5. Спробуйте приєднатися до групи

### 6. Можливі проблеми

Якщо все ще є проблеми:

1. **Помилка foreign key**: Перевірте що всі користувачі мають записи в `user_profiles`
2. **Помилка RLS**: Перевірте RLS політики для таблиць `groups` та `group_members`
3. **Помилка авторизації**: Перевірте що користувач правильно авторизований

### 7. Додаткові перевірки

Виконайте тестовий скрипт `test_groups_functionality.sql` для перевірки:
- Структури таблиць
- Foreign key constraints
- Існуючих даних
- Індексів
- RLS політик

### 8. Логування

Код містить детальне логування для діагностики:
- `🔍` - початок операції
- `✅` - успішне виконання
- `❌` - помилка

Перевірте консоль браузера для діагностики проблем.

## Структура таблиці groups після виправлення

```sql
CREATE TABLE groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  avatar text,
  is_private boolean DEFAULT false,
  created_by uuid NOT NULL REFERENCES user_profiles(id),
  created_at timestamptz DEFAULT now(),
  member_count integer DEFAULT 1,
  category text,
  tags text[] DEFAULT '{}',
  location text,
  website text,
  rules text[] DEFAULT '{}',
  contactemail text,
  cover text,
  post_count integer DEFAULT 0,
  is_verified boolean DEFAULT false,
  is_active boolean DEFAULT true,
  last_activity timestamptz DEFAULT now()
);
```

## Структура таблиці group_members

```sql
CREATE TABLE group_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  role text DEFAULT 'member' CHECK (role IN ('admin', 'moderator', 'member')),
  joined_at timestamptz DEFAULT now(),
  UNIQUE(group_id, user_id)
);
``` 