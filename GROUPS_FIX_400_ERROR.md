# Виправлення помилки 400 при завантаженні груп

## Проблема

Отримуєте помилку 400 при спробі завантажити групи:
```
Failed to load resource: the server responded with a status of 400 ()
Error fetching groups: Object
```

## Причини помилки 400

1. **Неправильні foreign key constraints** - таблиця `groups` посилається на неправильну таблицю
2. **Відсутні поля** - у таблиці `groups` відсутні поля, які використовуються в коді
3. **Проблеми з RLS політиками** - неправильні політики безпеки
4. **Неправильні індекси** - відсутні необхідні індекси

## Рішення

### 1. Виконайте SQL скрипт для виправлення БД

Запустіть `fix_groups_400_error.sql` в Supabase SQL Editor:

```sql
-- Цей скрипт:
-- 1. Перевірить структуру таблиць
-- 2. Додасть відсутні поля
-- 3. Виправить foreign key constraints
-- 4. Створить необхідні індекси
-- 5. Виправить RLS політики
```

### 2. Код розділений по файлах

Я розділив код на окремі файли для кращої читабельності:

#### Створені файли:
- `src/pages/groups/services/groupsService.ts` - сервіс для роботи з групами
- `src/pages/groups/utils/groupsFilters.ts` - утиліти для фільтрації
- `src/pages/groups/components/GroupCard.tsx` - компонент картки групи
- `src/pages/groups/components/GroupsFilters.tsx` - компонент фільтрів
- `src/pages/groups/components/CreateGroupModal.tsx` - модальне вікно створення групи

#### Оновлений файл:
- `src/pages/groups/hooks/useGroups.ts` - виправлений хук з використанням нових сервісів

### 3. Основні зміни в коді

#### В `useGroups.ts`:
```typescript
// Було: Складений JOIN запит з помилкою 400
const { data, error: groupsError } = await supabase
  .from('groups')
  .select(`
    *,
    creator:user_profiles!groups_created_by_fkey (
      id,
      name,
      last_name,
      avatar
    )
  `);

// Стало: Розділені запити без JOIN
const groupsData = await GroupsService.getAllGroups();
const creatorsMap = await GroupsService.getGroupCreators(creatorIds);
const membershipsMap = await GroupsService.getUserMemberships(user.id);
```

#### Переваги нового підходу:
- ✅ Уникаємо складних JOIN запитів
- ✅ Краща продуктивність
- ✅ Легше діагностувати помилки
- ✅ Код розділений по файлах
- ✅ Краща читабельність

### 4. Структура файлів

```
src/pages/groups/
├── components/
│   ├── GroupCard.tsx          # Картка групи
│   ├── GroupsFilters.tsx      # Фільтри
│   └── CreateGroupModal.tsx   # Модальне вікно створення
├── services/
│   └── groupsService.ts       # Сервіс для роботи з БД
├── utils/
│   └── groupsFilters.ts       # Утиліти для фільтрації
├── hooks/
│   └── useGroups.ts          # Основний хук (оновлений)
└── types.ts                  # Типи
```

### 5. Кроки для застосування виправлень

1. **Виконайте SQL скрипт**:
   ```sql
   -- Запустіть fix_groups_400_error.sql в Supabase SQL Editor
   ```

2. **Перевірте структуру БД**:
   ```sql
   -- Запустіть test_groups_functionality.sql для перевірки
   ```

3. **Код вже оновлений** - всі файли створені та оновлені

4. **Тестування**:
   - Запустіть додаток
   - Перейдіть на сторінку груп
   - Перевірте консоль браузера
   - Спробуйте створити групу

### 6. Діагностика проблем

#### Якщо все ще є помилка 400:

1. **Перевірте консоль браузера** - подивіться детальну помилку
2. **Перевірте Supabase Dashboard** - подивіться логи запитів
3. **Запустіть тестовий запит**:
   ```sql
   SELECT * FROM groups WHERE is_active = true LIMIT 5;
   ```

#### Можливі проблеми:

1. **Таблиця user_profiles не існує**:
   ```sql
   -- Перевірте чи існує таблиця
   SELECT EXISTS (
       SELECT FROM information_schema.tables 
       WHERE table_schema = 'public' 
       AND table_name = 'user_profiles'
   );
   ```

2. **RLS політики блокують запити**:
   ```sql
   -- Перевірте RLS політики
   SELECT * FROM pg_policies WHERE tablename = 'groups';
   ```

3. **Відсутні індекси**:
   ```sql
   -- Перевірте індекси
   SELECT * FROM pg_indexes WHERE tablename = 'groups';
   ```

### 7. Логування

Код містить детальне логування:
- `🔍` - початок операції
- `✅` - успішне виконання
- `❌` - помилка

Перевірте консоль браузера для діагностики.

### 8. Результат

Після застосування виправлень:
- ✅ Помилка 400 буде виправлена
- ✅ Групи будуть завантажуватися правильно
- ✅ Код буде краще організований
- ✅ Легше діагностувати проблеми
- ✅ Краща продуктивність

### 9. Додаткові перевірки

Якщо проблеми залишаються:

1. **Перевірте авторизацію** - користувач повинен бути авторизований
2. **Перевірте RLS політики** - можуть блокувати запити
3. **Перевірте foreign key constraints** - можуть бути неправильними
4. **Перевірте структуру таблиць** - всі поля повинні існувати 