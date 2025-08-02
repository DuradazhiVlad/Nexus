# Екстрене виправлення RLS рекурсії для groups

## Проблема

Продовжуємо отримувати помилку:
```
Error fetching groups: {code: '42P17', details: null, hint: null, message: 'infinite recursion detected in policy for relation "group_members"'}
```

## Екстрене рішення

### Крок 1: Тимчасово вимкніть RLS

Виконайте цей SQL в Supabase SQL Editor:

```sql
-- Тимчасово вимкнути RLS для тестування
ALTER TABLE groups DISABLE ROW LEVEL SECURITY;
ALTER TABLE group_members DISABLE ROW LEVEL SECURITY;

-- Видалити всі політики
DROP POLICY IF EXISTS "Users can view group memberships" ON group_members;
DROP POLICY IF EXISTS "Users can join groups" ON group_members;
DROP POLICY IF EXISTS "Users can leave groups" ON group_members;
DROP POLICY IF EXISTS "Group members can view group memberships" ON group_members;
DROP POLICY IF EXISTS "Group creators can manage members" ON group_members;
DROP POLICY IF EXISTS "Enable read access for all users" ON group_members;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON group_members;
DROP POLICY IF EXISTS "Enable update for group members" ON group_members;
DROP POLICY IF EXISTS "Enable delete for group members" ON group_members;

DROP POLICY IF EXISTS "Anyone can view public groups" ON groups;
DROP POLICY IF EXISTS "Group members can view private groups" ON groups;
DROP POLICY IF EXISTS "Authenticated users can create groups" ON groups;
DROP POLICY IF EXISTS "Group creators can update groups" ON groups;
DROP POLICY IF EXISTS "Enable read access for all users" ON groups;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON groups;
DROP POLICY IF EXISTS "Enable update for group creators" ON groups;
DROP POLICY IF EXISTS "Enable delete for group creators" ON groups;
```

### Крок 2: Перевірте що працює

Після виконання вищевказаного SQL, перевірте чи працює додаток:

1. **Відкрийте додаток** - групи повинні завантажуватися без помилок
2. **Спробуйте створити групу** - повинно працювати
3. **Спробуйте приєднатися до групи** - повинно працювати

### Крок 3: Якщо все працює, створіть прості політики

```sql
-- Увімкнути RLS знову
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;

-- Створити максимально прості політики
CREATE POLICY "groups_select_policy" ON groups
    FOR SELECT USING (true);

CREATE POLICY "groups_insert_policy" ON groups
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "groups_update_policy" ON groups
    FOR UPDATE USING (auth.uid() = created_by);

CREATE POLICY "groups_delete_policy" ON groups
    FOR DELETE USING (auth.uid() = created_by);

CREATE POLICY "group_members_select_policy" ON group_members
    FOR SELECT USING (true);

CREATE POLICY "group_members_insert_policy" ON group_members
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "group_members_update_policy" ON group_members
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "group_members_delete_policy" ON group_members
    FOR DELETE USING (auth.uid() = user_id);
```

## Альтернативне рішення - повністю вимкнути RLS

Якщо проблема залишається, можна тимчасово залишити RLS вимкненим:

```sql
-- Залишити RLS вимкненим для тестування
ALTER TABLE groups DISABLE ROW LEVEL SECURITY;
ALTER TABLE group_members DISABLE ROW LEVEL SECURITY;
```

**⚠️ УВАГА: Це небезпечно для продакшену! Використовуйте тільки для тестування.**

## Перевірка

Після виконання SQL скриптів:

1. **Перевірте чи працює додаток**
2. **Спробуйте створити групу**
3. **Спробуйте приєднатися до групи**
4. **Перевірте чи відображаються групи**

## Якщо все працює

Якщо додаток працює без RLS, це означає що проблема була в RLS політиках. Можна:

1. **Залишити RLS вимкненим** для тестування
2. **Створити прості політики** пізніше
3. **Додати безпеку на рівні додатку** замість RLS

## Наступні кроки

1. **Запустіть SQL скрипт** `fix_groups_rls_emergency.sql`
2. **Перевірте чи працює додаток**
3. **Повідомте результат** - чи зникла помилка 