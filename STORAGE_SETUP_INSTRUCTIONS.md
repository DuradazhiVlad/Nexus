# Налаштування Supabase Storage для завантаження медіа

## Проблема

Отримуєте помилку "Bucket not found" при спробі завантажити медіа файли. Це означає, що в вашому Supabase проекті не створені необхідні Storage buckets.

## Рішення

### Крок 1: Створення Storage Buckets

1. Відкрийте ваш Supabase проект
2. Перейдіть до **SQL Editor**
3. Скопіюйте та виконайте весь скрипт з файлу `setup_storage_buckets.sql`

Або виконайте цей SQL код:

```sql
-- Створюємо необхідні buckets
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('avatars', 'avatars', true),
  ('covers', 'covers', true),
  ('posts', 'posts', true),
  ('media', 'media', true)
ON CONFLICT (id) DO NOTHING;
```

### Крок 2: Налаштування RLS політик

Після створення buckets, виконайте цей код для налаштування політик безпеки:

```sql
-- Політики для bucket 'avatars'
CREATE POLICY "Avatar images are publicly accessible" ON storage.objects
FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own avatar" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own avatar" ON storage.objects
FOR DELETE USING (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Політики для bucket 'covers'
CREATE POLICY "Cover images are publicly accessible" ON storage.objects
FOR SELECT USING (bucket_id = 'covers');

CREATE POLICY "Users can upload their own cover" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'covers' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own cover" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'covers' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own cover" ON storage.objects
FOR DELETE USING (
  bucket_id = 'covers' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Політики для bucket 'posts'
CREATE POLICY "Post media are publicly accessible" ON storage.objects
FOR SELECT USING (bucket_id = 'posts');

CREATE POLICY "Authenticated users can upload post media" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'posts' 
  AND auth.uid() IS NOT NULL
);

CREATE POLICY "Users can update their own post media" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'posts' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own post media" ON storage.objects
FOR DELETE USING (
  bucket_id = 'posts' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Політики для bucket 'media'
CREATE POLICY "Media files are publicly accessible" ON storage.objects
FOR SELECT USING (bucket_id = 'media');

CREATE POLICY "Authenticated users can upload media" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'media' 
  AND auth.uid() IS NOT NULL
);

CREATE POLICY "Users can update their own media" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'media' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own media" ON storage.objects
FOR DELETE USING (
  bucket_id = 'media' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);
```

### Крок 3: Перевірка

Після виконання скриптів, перевірте що buckets створені:

```sql
-- Перевіряємо створені buckets
SELECT 
  id,
  name,
  public,
  created_at
FROM storage.buckets
ORDER BY created_at;
```

### Крок 4: Тестування

1. Перезапустіть додаток: `npm run dev`
2. Спробуйте завантажити зображення профілю
3. Спробуйте додати медіа до посту

## Що робить кожен bucket

- **`avatars`** - для зображень профілів користувачів
- **`covers`** - для обкладинок профілів
- **`posts`** - для медіа файлів у постах
- **`media`** - для загального медіа контенту

## Безпека

Всі buckets налаштовані як публічні для читання, але завантаження дозволено тільки авторизованим користувачам. Користувачі можуть видаляти тільки свої файли.

## Після налаштування

Після виконання цих кроків функціональність завантаження медіа повинна працювати коректно:

- ✅ Завантаження аватара профілю
- ✅ Завантаження обкладинки профілю  
- ✅ Додавання медіа до постів
- ✅ Перегляд завантажених файлів 