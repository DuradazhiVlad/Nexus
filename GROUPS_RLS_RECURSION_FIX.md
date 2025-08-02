# Виправлення нескінченної рекурсії в RLS політиці group_members

## Проблема

Отримуємо помилку 500 з повідомленням:
```
Error fetching groups: {code: '42P17', details: null, hint: null, message: 'infinite recursion detected in policy for relation "group_members"'}
```

## Причина

RLS політика для таблиці `group_members` викликає нескінченну рекурсію. Це відбувається коли політика намагається перевірити сама себе або створити циклічні залежності.

## Рішення

### Крок 1: Запустіть SQL скрипт для виправлення

Виконайте файл `fix_groups_rls_recursion.sql` в Supabase SQL Editor:

```sql
-- Цей скрипт:
-- 1. Перевірить поточні RLS політики
-- 2. Видалити всі існуючі RLS політики для groups та group_members
-- 3. Створити прості RLS політики без рекурсії
-- 4. Перевірити результат
```

### Крок 2: Пояснення нових RLS політик

**Для таблиці groups:**
- `"Enable read access for all users"` - всі можуть читати групи
- `"Enable insert for authenticated users"` - авторизовані користувачі можуть створювати групи
- `"Enable update for group creators"` - тільки створник групи може її редагувати
- `"Enable delete for group creators"` - тільки створник групи може її видалити

**Для таблиці group_members:**
- `"Enable read access for all users"` - всі можуть бачити членство
- `"Enable insert for authenticated users"` - авторизовані користувачі можуть приєднуватися
- `"Enable update for group members"` - тільки учасник може оновлювати своє членство
- `"Enable delete for group members"` - тільки учасник може покинути групу

### Крок 3: Перевірка

Після виконання SQL скрипта перевірте:

1. **RLS політики створені:**
   ```sql
   SELECT 
       tablename,
       policyname,
       cmd,
       qual
   FROM pg_policies
   WHERE tablename IN ('groups', 'group_members')
   ORDER BY tablename, policyname;
   ```

2. **Тестовий запит працює:**
   ```sql
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

Після виправлення:
- ✅ Помилка 500 зникне
- ✅ Нескінченна рекурсія буде усунена
- ✅ Групи будуть завантажуватися без помилок
- ✅ RLS політики будуть працювати коректно

## Додаткові перевірки

Якщо потрібно, можна також перевірити:

1. **Структуру таблиць:**
   ```sql
   SELECT table_name, column_name, data_type 
   FROM information_schema.columns 
   WHERE table_name IN ('groups', 'group_members')
   ORDER BY table_name, ordinal_position;
   ```

2. **Індекси:**
   ```sql
   SELECT indexname, indexdef 
   FROM pg_indexes 
   WHERE tablename IN ('groups', 'group_members');
   ```

3. **Дані в таблицях:**
   ```sql
   SELECT COUNT(*) as groups_count FROM groups;
   SELECT COUNT(*) as members_count FROM group_members;
   ```

## Альтернативне рішення

Якщо проблема залишається, можна тимчасово вимкнути RLS для тестування:

```sql
-- Тимчасово вимкнути RLS (тільки для тестування)
ALTER TABLE groups DISABLE ROW LEVEL SECURITY;
ALTER TABLE group_members DISABLE ROW LEVEL SECURITY;

-- Після тестування знову увімкнути
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
```

**Але це не рекомендується для продакшену!** 