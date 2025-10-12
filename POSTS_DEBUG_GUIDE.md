# Діагностика проблем з постами

## Поточний стан
Профіль завантажується успішно, але є проблема з завантаженням постів (помилка 400).

## Що додано для діагностики:

### 1. 🔍 Покращене логування
- Додано детальне логування в `RightColumn.tsx`
- Показує точно, де виникає помилка при завантаженні постів

### 2. 🧪 Компонент PostsTest
- Тестує структуру таблиці `posts`
- Перевіряє простий та складний запити
- Показує детальну інформацію про помилки

## Кроки для діагностики:

### 1. Запустіть додаток
```bash
npm run dev
```

### 2. Відкрийте сторінку профілю
- Подивіться на компонент "Тест таблиці posts"
- Натисніть кнопку "Тестувати таблицю posts"

### 3. Перевірте консоль браузера
- Подивіться на повідомлення з емоціями 🔍, ✅, ❌
- Знайдіть точну причину помилки 400

## Можливі причини помилки 400:

### 1. Неправильна структура запиту
**Проблема:** SQL запит містить неправильний синтаксис
**Рішення:** Виправити запит відповідно до структури БД

### 2. Відсутні таблиці
**Проблема:** Таблиці `post_likes` або `post_comments` не існують
**Рішення:** Створити відсутні таблиці або виправити запит

### 3. Неправильні RLS політики
**Проблема:** Політики безпеки блокують доступ до даних
**Рішення:** Налаштувати правильні RLS політики

### 4. Неправильна структура таблиці posts
**Проблема:** Таблиця має іншу структуру, ніж очікується
**Рішення:** Перевірити та виправити структуру таблиці

## Очікувана структура таблиці posts:

```sql
CREATE TABLE posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  content text NOT NULL,
  media_url text,
  media_type text CHECK (media_type IN ('photo', 'video', 'document')),
  likes_count integer DEFAULT 0,
  comments_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

## Очікувана структура таблиці post_likes:

```sql
CREATE TABLE post_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid REFERENCES posts(id) ON DELETE CASCADE NOT NULL,
  user_id uuid NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(post_id, user_id)
);
```

## Очікувана структура таблиці post_comments:

```sql
CREATE TABLE post_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid REFERENCES posts(id) ON DELETE CASCADE NOT NULL,
  user_id uuid NOT NULL,
  content text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

## RLS політики для постів:

```sql
-- posts
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view posts"
  ON posts FOR SELECT
  USING (true);

CREATE POLICY "Users can create posts"
  ON posts FOR INSERT
  WITH CHECK (auth.uid() IN (
    SELECT auth_user_id FROM user_profiles WHERE id = user_id
  ));

-- post_likes
ALTER TABLE post_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view post likes"
  ON post_likes FOR SELECT
  USING (true);

CREATE POLICY "Users can manage their likes"
  ON post_likes FOR ALL
  USING (auth.uid() = user_id);

-- post_comments
ALTER TABLE post_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view post comments"
  ON post_comments FOR SELECT
  USING (true);

CREATE POLICY "Users can create comments"
  ON post_comments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their comments"
  ON post_comments FOR UPDATE
  USING (auth.uid() = user_id);
```

## Наступні кроки:

1. **Запустіть тест** - натисніть "Тестувати таблицю posts"
2. **Проаналізуйте результат** - подивіться на повідомлення в компоненті
3. **Виправте проблему** - відповідно до знайденої причини
4. **Видаліть тестові компоненти** - після виправлення

## Видалення тестових компонентів:

Після виправлення проблем видаліть:
- `<PostsTest />` з `ProfileNew.tsx`
- `<SupabaseTest />` з `ProfileNew.tsx`
- Файли `PostsTest.tsx` та `SupabaseTest.tsx`
- Логування з `RightColumn.tsx`

## Контакт:
Надішліть результат тестування для додаткової допомоги.



