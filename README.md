# Гардероб — React + Vite

Порт исходного одностраничного прототипа (`index.html` со всем инлайн CSS/JS)
на React + Vite + TypeScript. Экраны, дизайн-токены, IndexedDB-хранение и
алгоритм удаления фона перенесены 1:1 — поведение и внешний вид не менялись,
поменялась только структура кода.

## Запуск

```bash
npm install
npm run dev
```

Откроется на `http://localhost:5173`. Работает и вне Telegram — скрипт
`telegram-web-app.js` подключён, но просто ничего не делает без окружения TMA.

## Структура

```
src/
  types.ts                  — типы Item/Look/AppState
  data/categories.tsx       — 4 категории вещей + плейсхолдер-иконки
  lib/db.ts                 — IndexedDB-слой (та же схема, что в прототипе)
  lib/bgRemoval.ts          — текущий flood-fill алгоритм удаления фона
  lib/format.ts             — склонения, случайные имена, даты
  context/WardrobeContext.tsx — состояние гардероба/луков + мутации
  components/                — TabBar, ItemCard, LookCard, Sheet
  screens/                   — Home, Items, Looks, Profile
  screens/sheets/             — AddItemSheet, LookSheet, LookDetailSheet
```

## Что дальше по роадмапу

Этот коммит закрывает **шаг 1** (React-скелет + перенос экранов).
Следующие шаги, каждый — отдельная, не ломающая предыдущую:

2. Supabase: схема таблиц + Storage-бакет
3. Заменить `src/lib/db.ts` на Supabase-клиент за тем же интерфейсом
   (`loadStateFromDB`/`saveStateToDB`), чтобы остальной код не менялся
4. Auth через `initData` (валидация HMAC на edge-функции)
5. Заменить `src/lib/bgRemoval.ts` на `@imgly/background-removal`,
   сохранив сигнатуру `(file: File) => Promise<string>`
6. Look Builder на `react-konva` — drag/scale/rotate/z-index вместо
   выбора вещей чипами
7. Telegram: `@telegram-apps/sdk-react`, MainButton/BackButton/Haptics,
   `shareToChat` для готового коллажа
8. Деплой статики + регистрация Mini App в BotFather
