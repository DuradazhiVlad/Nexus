# Повне вимкнення RLS для groups та пов'язаних таблиць

## Проблема

Продовжуємо отримувати помилку:
```
Error fetching groups: {code: '42P17', details: null, hint: null, message: 'infinite recursion detected in policy for relation "group_members"'}
```

## Екстрене рішення - повне вимкнення RLS

### Крок 1: Запустіть SQL скрипт

Виконайте файл `fix_groups_rls_complete_disable.sql` в Supabase SQL Editor:

```sql
-- Цей скрипт:
-- 1. Повністю вимкне RLS для всіх пов'язаних таблиць
-- 2. Видалить ВСІ існуючі політики
-- 3. Перевірить результат
-- 4. Виконає тестові запити
```

### Крок 2: Що робить скрипт

1. **Вимкає RLS** для таблиць:
   - `groups`
   - `group_members`
   - `group_posts`
   - `group_post_media`

2. **Видаляє всі політики** для цих таблиць

3. **Перевіряє результат** та виконує тестові запити

### Крок 3: Перевірка

Після виконання скрипта перевірте:

1. **Відкрийте додаток** - групи повинні завантажуватися без помилок
2. **Спробуйте створити групу** - повинно працювати
3. **Спробуйте приєднатися до групи** - повинно працювати

### Крок 4: Перевірка в SQL Editor

Виконайте ці запити для перевірки:

```sql
-- Перевірити статус RLS
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables
WHERE tablename IN ('groups', 'group_members', 'group_posts', 'group_post_media')
ORDER BY tablename;

-- Перевірити що політики видалені
SELECT 
    schemaname,
    tablename,
    policyname
FROM pg_policies
WHERE tablename IN ('groups', 'group_members', 'group_posts', 'group_post_media')
ORDER BY tablename, policyname;

-- Тестовий запит
SELECT 
    g.id,
    g.name,
    g.description,
    g.is_private,
    g.member_count,
    g.created_at
FROM groups g
WHERE g.is_active = true
ORDER BY g.last_activity DESC
LIMIT 5;
```

## Очікуваний результат

Після виконання скрипта:
- ✅ RLS буде повністю вимкнено для всіх пов'язаних таблиць
- ✅ Всі проблемні політики будуть видалені
- ✅ Помилка 500 зникне
- ✅ Групи будуть завантажуватися без помилок
- ✅ Створення та приєднання до груп буде працювати

## Безпека

**⚠️ УВАГА: Це тимчасове рішення для тестування!**

Для продакшену потрібно буде:
1. **Додати безпеку на рівні додатку** (перевірки в коді)
2. **Створити правильні RLS політики** пізніше
3. **Використовувати middleware** для авторизації

## Альтернативні рішення

Якщо проблема залишається, можна:

1. **Перевірити foreign key constraints** - можливо проблема в них
2. **Перевірити тригери** - можливо проблема в `update_group_member_count_trigger`
3. **Перевірити функції** - можливо проблема в `update_group_post_updated_at`

## Наступні кроки

1. **Запустіть SQL скрипт** `fix_groups_rls_complete_disable.sql`
2. **Перевірте чи працює додаток**
3. **Повідомте результат** - чи зникла помилка
4. **Якщо все працює** - можемо додати безпеку на рівні коду 