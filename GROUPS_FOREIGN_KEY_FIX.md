# Виправлення помилки 400 для groups таблиці

## Проблема

Отримуємо помилку 400 при запиті до таблиці `groups`:
```
Error fetching groups: {code: 'PGRST200', details: "Searched for a foreign key relationship between 'groups' and 'user_profiles' in the schema 'public', but no matches were found.", hint: null, message: "Could not find a relationship between 'groups' and 'user_profiles' in the schema cache"}
```

## Причина

Supabase не може знайти foreign key constraint `groups_created_by_fkey` між таблицями `groups` та `user_profiles`. Це означає, що:
1. Foreign key constraint не існує
2. Або він неправильно налаштований
3. Або таблиця `user_profiles` не існує

## Рішення

### Крок 1: Запустіть SQL скрипт для виправлення

Виконайте файл `fix_groups_foreign_key.sql` в Supabase SQL Editor:

```sql
-- Цей скрипт:
-- 1. Перевірить поточні foreign key constraints
-- 2. Перевірить чи існує таблиця user_profiles
-- 3. Видалить старий foreign key constraint
-- 4. Додасть новий foreign key constraint
-- 5. Перевірить результат
```

### Крок 2: Альтернативне рішення в коді

Якщо проблема з foreign key залишається, код вже оновлений для використання альтернативного підходу:

1. **Новий метод в GroupsService**: `getGroupsWithCreators()` - отримує групи та створників окремими запитами
2. **Оновлений useGroups hook**: використовує новий метод замість складних JOIN-ів

### Крок 3: Перевірка

Після виконання SQL скрипта перевірте:

1. **Foreign key constraint існує:**
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
   WHERE tc.table_name = 'groups'
       AND tc.constraint_type = 'FOREIGN KEY';
   ```

2. **Тестовий запит працює:**
   ```sql
   SELECT 
       g.id,
       g.name,
       g.created_by,
       up.name as creator_name
   FROM groups g
   LEFT JOIN user_profiles up ON g.created_by = up.id
   LIMIT 5;
   ```

## Очікуваний результат

Після виправлення:
- ✅ Foreign key constraint `groups_created_by_fkey` буде створений
- ✅ Supabase зможе виконувати JOIN запити між `groups` та `user_profiles`
- ✅ Помилка 400 зникне
- ✅ Групи будуть завантажуватися з інформацією про створників

## Якщо проблема залишається

Якщо foreign key constraint не може бути створений (наприклад, таблиця `user_profiles` не існує), код вже налаштований для роботи без нього:

1. **GroupsService.getGroupsWithCreators()** - отримує дані окремими запитами
2. **useGroups hook** - використовує цей метод замість складних JOIN-ів
3. **Функціональність залишається повною** - групи будуть завантажуватися з інформацією про створників

## Додаткові перевірки

Якщо потрібно, можна також перевірити:

1. **Структуру таблиці user_profiles:**
   ```sql
   SELECT column_name, data_type 
   FROM information_schema.columns 
   WHERE table_name = 'user_profiles';
   ```

2. **RLS політики:**
   ```sql
   SELECT * FROM pg_policies 
   WHERE tablename IN ('groups', 'user_profiles');
   ```

3. **Індекси:**
   ```sql
   SELECT indexname, indexdef 
   FROM pg_indexes 
   WHERE tablename = 'groups';
   ``` 