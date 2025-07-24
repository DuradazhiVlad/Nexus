# Nexus - Social Network

Соціальна мережа з підтримкою ігор, чатів та друзів.

## Деплой на GitHub Pages

### Автоматичний деплой
Проект налаштований для автоматичного деплою на GitHub Pages через GitHub Actions. При пуші в `main` гілку сайт автоматично оновиться.

### Ручний деплой
```bash
npm run deploy
```

### Розробка
```bash
npm install
npm run dev
```

### Білд
```bash
npm run build
npm run preview
```

## Технології
- React 18
- React Router (з підтримкою GitHub Pages)
- Tailwind CSS
- Supabase
- Vite

## Сумісність з GitHub Pages
- ✅ SPA роутинг працює правильно
- ✅ 404.html для обробки маршрутів
- ✅ Базові шляхи налаштовані
- ✅ GitHub Actions для автоматичного деплою
