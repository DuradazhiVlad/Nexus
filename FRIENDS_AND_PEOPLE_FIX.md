# Виправлення сторінок Друзі та Люди

## Проблема

Сторінки "Друзі" та "Люди" не працювали через невідповідність між структурою бази даних та логікою додатку:

1. **Таблиці `friendships` та `friend_requests`** посилалися на `auth.users(id)`
2. **Таблиця `users`** має `auth_user_id` що посилається на `auth.users(id)`
3. **Додаток** намагався використовувати `auth_user_id` для пошуку друзів, але таблиці дружб використовували `auth.users(id)`

## Рішення

### 1. Виправлення бази даних

Виконайте SQL скрипт `fix_friends_database_mismatch.sql`:

```sql
-- Змінюємо foreign keys щоб посилатися на users(id)
ALTER TABLE friendships 
ADD CONSTRAINT friendships_user1_id_fkey 
FOREIGN KEY (user1_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE friendships 
ADD CONSTRAINT friendships_user2_id_fkey 
FOREIGN KEY (user2_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE friend_requests 
ADD CONSTRAINT friend_requests_sender_id_fkey 
FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE friend_requests 
ADD CONSTRAINT friend_requests_receiver_id_fkey 
FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE;
```

### 2. Оновлення RLS політик

Оновлені політики для роботи з `users(id)` замість `auth.users(id)`:

```sql
CREATE POLICY "Users can view their own friend requests" ON friend_requests
  FOR SELECT USING (
    sender_id IN (SELECT id FROM users WHERE auth_user_id = auth.uid()) OR
    receiver_id IN (SELECT id FROM users WHERE auth_user_id = auth.uid())
  );
```

### 3. Оновлення коду додатку

#### Friends.tsx
- Додано `currentUserId` для зберігання ID з таблиці `users`
- Оновлено `fetchFriends()` для використання `users(id)` замість `auth_user_id`
- Оновлено `fetchRequests()` для правильного пошуку запитів
- Оновлено `addFriend()` для використання `users(id)`

#### PeopleService.ts
- Додано отримання `users(id)` через `auth_user_id`
- Оновлено всі методи для роботи з `users(id)`
- Виправлено логіку пошуку дружб та запитів

#### UserCard.tsx
- Оновлено `getFriendStatus()` для використання `user.id`
- Виправлено логіку пошуку запитів на дружбу
- Оновлено навігацію до профілів користувачів

## Результат

Після застосування цих виправлень:

1. **Сторінка Друзі** буде правильно показувати список друзів
2. **Сторінка Люди** буде працювати на deployed версії
3. **Функціональність додавання друзів** буде працювати коректно
4. **Навігація до профілів** буде працювати правильно

## Інструкції для застосування

1. Виконайте SQL скрипт `fix_friends_database_mismatch.sql` в Supabase SQL Editor
2. Перезапустіть додаток: `npm run dev`
3. Перевірте роботу сторінок "Друзі" та "Люди"
4. Протестуйте функціональність додавання друзів

## Перевірка

Після виправлень перевірте:

- [ ] Сторінка "Друзі" показує список друзів
- [ ] Сторінка "Люди" працює на deployed версії
- [ ] Можна додавати нових друзів
- [ ] Можна приймати/відхиляти запити на дружбу
- [ ] Навігація до профілів користувачів працює
- [ ] Пошук користувачів працює 