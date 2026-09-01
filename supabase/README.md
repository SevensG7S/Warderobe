# Supabase — схема и как она стыкуется с авторизацией

## Порядок применения

```bash
supabase link --project-ref <your-project-ref>
supabase db push
```

Или вручную через SQL Editor в дашборде Supabase, по порядку:
`0001_init.sql` → `0002_storage.sql`.

## Модель владения

`owner`/`profiles.id` — это **Supabase auth uid** (`auth.users.id`), не
`tg_user_id` напрямую. Так все политики RLS — это просто `owner = auth.uid()`,
без кастомных JWT-claims и Custom Access Token Hook.

`tg_user_id` живёт в `profiles` как обычная колонка с `unique`-constraint —
это то, что связывает повторный визит из Telegram с уже существующим uid.

## Как это будет работать (шаг 4, ещё не реализовано)

1. Клиент получает `window.Telegram.WebApp.initData` и шлёт его в edge-функцию.
2. Edge-функция валидирует HMAC-подпись `initData` секретным токеном бота.
3. Если подпись верна — функция (с **service-role key**, в обход RLS):
   - ищет `profiles` по `tg_user_id` из initData;
   - если не находит — создаёт нового auth-пользователя через
     `supabase.auth.admin.createUser()` (анонимного, без email/пароля) и
     строку в `profiles` с этим `tg_user_id`;
   - генерирует для этого uid сессию (`generateLink`/`signInWithIdToken`-
     эквивалент для service-role) и возвращает `access_token`/`refresh_token`
     клиенту.
4. Клиент кладёт токены в supabase-js клиент — дальше все запросы идут от
   имени этого uid, и RLS-политики из `0001_init.sql` просто работают.

Ничего в схеме менять на этом шаге не придётся — `profiles.id` уже рассчитан
именно на этот сценарий.

## Хранение фото

Бакет `wardrobe-photos` приватный. Путь объекта — всегда
`{auth.uid()}/{item_id}.png`, это же соглашение проверяют политики storage.
Отдавать фото клиенту нужно через `createSignedUrl()`, а не публичный URL.

## Что НЕ покрыто в этой миграции

- Сама edge-функция авторизации (шаг 4)
- Замена `src/lib/db.ts` на supabase-js клиент (шаг 3)
- Загрузка файла в Storage при сохранении вещи (тоже шаг 3-4)
