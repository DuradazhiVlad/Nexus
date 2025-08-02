# 🎯 Налаштування функціональності груп

## ✅ Що було зроблено:

### 1. **Створено нову структуру таблиць груп:**
- `groups` - основна таблиця груп
- `group_members` - учасники груп
- `group_posts` - пости в групах
- `group_post_media` - медіа до постів груп

### 2. **Оновлено код додатку:**
- `src/lib/groupsService.ts` - сервіс для роботи з групами
- `src/types/groups.ts` - типи для груп
- `src/pages/groups/Groups.tsx` - компонент сторінки груп

### 3. **Налаштовано безпеку:**
- RLS політики для всіх таблиць
- Правильні foreign key обмеження
- Автоматичні тригери для підрахунку учасників/постів

## 🚀 Що потрібно зробити:

### 1. **Запустіть SQL скрипт:**
```sql
-- Запустіть цей скрипт в Supabase SQL Editor
-- Файл: create_groups_tables.sql
```

### 2. **Перевірте створення таблиць:**
```sql
-- Запустіть цей скрипт для перевірки
-- Файл: test_groups_functionality.sql
```

### 3. **Перезапустіть додаток:**
```bash
npm run dev
```

## 📋 Структура нових таблиць:

### `groups` таблиця:
```sql
- id (uuid, primary key)
- name (text, not null)
- description (text)
- avatar (text)
- cover_image (text)
- created_by (uuid, references user_profiles.id)
- created_at (timestamptz)
- updated_at (timestamptz)
- is_public (boolean, default true)
- member_count (integer, default 0)
- post_count (integer, default 0)
```

### `group_members` таблиця:
```sql
- id (uuid, primary key)
- group_id (uuid, references groups.id)
- user_id (uuid, references user_profiles.id)
- role (text: 'admin', 'moderator', 'member')
- joined_at (timestamptz)
- is_active (boolean, default true)
```

### `group_posts` таблиця:
```sql
- id (uuid, primary key)
- group_id (uuid, references groups.id)
- author_id (uuid, references user_profiles.id)
- content (text, not null)
- media_url (text)
- media_type (text: 'photo', 'video', 'document')
- created_at (timestamptz)
- updated_at (timestamptz)
- likes_count (integer, default 0)
- comments_count (integer, default 0)
- is_pinned (boolean, default false)
```

### `group_post_media` таблиця:
```sql
- id (uuid, primary key)
- post_id (uuid, references group_posts.id)
- type (text: 'image', 'video')
- url (text, not null)
- filename (text)
- file_size (integer)
- thumbnail_url (text)
- created_at (timestamptz)
```

## 🔒 Безпека (RLS політики):

### Групи:
- **Перегляд**: Публічні групи або групи, де користувач є учасником
- **Створення**: Будь-який авторизований користувач
- **Оновлення**: Тільки створювач групи або адміністратори
- **Видалення**: Тільки створювач групи

### Учасники:
- **Перегляд**: Тільки учасники групи
- **Приєднання**: Будь-який користувач до публічних груп
- **Виход**: Користувачі можуть покинути групи
- **Ролі**: Тільки створювачі та адміністратори можуть змінювати ролі

### Пости:
- **Перегляд**: Тільки учасники групи
- **Створення**: Тільки учасники групи
- **Оновлення**: Автор поста, створювач групи, адміністратори
- **Видалення**: Автор поста, створювач групи, адміністратори

## 🔄 Автоматичні функції:

### Тригери:
- **Підрахунок учасників**: Автоматично оновлюється при додаванні/видаленні учасників
- **Підрахунок постів**: Автоматично оновлюється при створенні/видаленні постів
- **Оновлення часу**: `updated_at` автоматично оновлюється при змінах

## 🎯 Тестування:

### 1. **Створення групи:**
- Перейдіть на сторінку груп
- Натисніть "Створити групу"
- Заповніть форму та створіть групу

### 2. **Приєднання до групи:**
- Знайдіть публічну групу
- Натисніть "Приєднатися"

### 3. **Створення поста:**
- Перейдіть в групу
- Створіть новий пост

### 4. **Перевірка безпеки:**
- Спробуйте отримати доступ до приватних груп
- Спробуйте редагувати групи без прав

## 🐛 Якщо виникають помилки:

### 1. **Помилка "Bucket not found":**
- Перевірте, чи створені всі таблиці
- Запустіть `test_groups_functionality.sql`

### 2. **Помилка "Foreign key constraint":**
- Перевірте, чи правильно налаштовані foreign keys
- Переконайтеся, що `user_profiles` таблиця існує

### 3. **Помилка "RLS policy":**
- Перевірте, чи створені всі RLS політики
- Переконайтеся, що користувач авторизований

### 4. **Помилка "Table does not exist":**
- Запустіть `create_groups_tables.sql` ще раз
- Перевірте, чи всі таблиці створені

## 📞 Підтримка:

Якщо виникають проблеми:
1. Перевірте консоль браузера на помилки
2. Запустіть `test_groups_functionality.sql` для діагностики
3. Переконайтеся, що всі SQL скрипти виконані успішно 