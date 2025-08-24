# Інструкції для встановлення WebRTC

Для повноцінної роботи аудіо та відео дзвінків необхідно встановити наступні бібліотеки:

```bash
npm install simple-peer
npm install @types/simple-peer --save-dev
```

## Опис компонентів

### CallManager

Компонент `CallManager` відповідає за керування WebRTC з'єднанням та обробку аудіо/відео потоків. Він використовує Supabase Realtime для обміну сигналами між користувачами.

### CallButtons

Компонент `CallButtons` надає інтерфейс для ініціювання аудіо та відео дзвінків.

## Інтеграція

Для повної інтеграції після встановлення бібліотек:

1. Замініть поточні кнопки дзвінків у `Messages.tsx` на компонент `CallButtons`:

```jsx
import { CallButtons } from '../../components/calls';

// В заголовку чату замість поточних кнопок:
{authUser && selectedConversation.participant && (
  <CallButtons
    currentUserId={authUser.id}
    participantId={selectedConversation.participant.auth_user_id}
    participantName={`${selectedConversation.participant.name} ${selectedConversation.participant.last_name || ''}`}
    participantAvatar={selectedConversation.participant.avatar}
  />
)}
```

## Обмеження

Поточна реалізація має наступні обмеження:

1. Необхідне встановлення бібліотеки simple-peer для роботи WebRTC
2. Для повноцінної роботи в продакшн середовищі рекомендується використовувати TURN сервер
3. Для мобільних пристроїв можуть знадобитися додаткові адаптери