# 🔧 Інструкції для виправлення проблем з групами

## Проблема
У вас є помилка "infinite recursion detected in policy for relation 'group_members'" в Supabase. Це відбувається через неправильно налаштовані RLS (Row Level Security) політики.

## Рішення

### Крок 1: Виконайте SQL скрипт в Supabase Dashboard

1. Відкрийте [Supabase Dashboard](https://supabase.com/dashboard)
2. Перейдіть до вашого проекту
3. Відкрийте **SQL Editor**
4. Скопіюйте та виконайте вміст файлу `fix_group_members_recursion.sql`

### Крок 2: Перевірте структуру таблиць

Виконайте вміст файлу `fix_users_table.sql` для перевірки та виправлення проблем з таблицею `users`.

### Крок 3: Перевірте результат

Після виконання скриптів:

1. Перейдіть до **Authentication > Policies** в Supabase Dashboard
2. Перевірте, що політики для `group_members` та `groups` оновлені
3. Перевірте, що функція `is_member_of_group` створена

## Що було виправлено

### 1. Нескінченна рекурсія в RLS політиках
- **Проблема**: Політики `group_members` посилалися самі на себе через підзапити
- **Рішення**: Створено функцію `is_member_of_group` з `SECURITY DEFINER`, яка обходить RLS

### 2. Неправильні зовнішні ключі
- **Проблема**: `group_members.user_id` посилався на `users.id`, але в політиках використовувався `user_profiles.id`
- **Рішення**: Оновлено зовнішні ключі для посилання на `user_profiles.id`

### 3. Неправильні політики для таблиці `groups`
- **Проблема**: Політики використовували таблицю `users` замість `user_profiles`
- **Рішення**: Оновлено політики для роботи з `user_profiles`

## Нові політики

### group_members
- `Allow insert own membership` - користувачі можуть створювати своє членство
- `Allow view group memberships` - користувачі можуть бачити членство в групах, де вони є учасниками
- `Allow delete own membership` - користувачі можуть видаляти своє членство

### groups
- `Anyone can view public groups` - всі можуть бачити публічні групи
- `Group members can view private groups` - учасники можуть бачити приватні групи
- `Authenticated users can create groups` - авторизовані користувачі можуть створювати групи
- `Group creators can update their groups` - творці груп можуть оновлювати свої групи

## Перевірка

Після виконання скриптів перевірте:

1. Відкрийте ваше додаток
2. Спробуйте перейти на сторінку груп
3. Перевірте, чи зникли помилки в консолі браузера

## Якщо проблеми залишаються

1. Перевірте логи в Supabase Dashboard > Logs
2. Перевірте, чи правильно налаштовані змінні середовища (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`)
3. Перевірте, чи є дані в таблицях `user_profiles` та `groups`

## Додаткова інформація

Це рішення базується на [GitHub discussion](https://github.com/supabase/supabase/discussions/3328) про нескінченну рекурсію в RLS політиках. Функція `SECURITY DEFINER` дозволяє обійти RLS при перевірці членства в групах, що вирішує проблему циклічних залежностей. 