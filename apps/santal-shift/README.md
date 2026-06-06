# Санталь Смена

Telegram Mini App для подбора смен администраторов и помощников врача в медицинской клинике Санталь.

Приложение публикуется как один Cloudflare Worker: он отдает мобильный интерфейс, API, Telegram webhook, cron-уведомления и слой синхронизации с Google Sheets.

## Локальный запуск

```bash
npm install
npm run test --workspace @santal/shift
npm run build --workspace @santal/shift
npm run dev --workspace @santal/shift
```

## Production URL

```text
https://santal-shift-app.taigisch11.workers.dev/
```

## Google Sheets

Рабочая таблица задается переменной `GOOGLE_SHEET_ID`.

Для записи и чтения данных в production нужен Google service account с доступом редактора к таблице.

Обязательные GitHub secrets:

- `SANTAL_GOOGLE_SERVICE_ACCOUNT_EMAIL`
- `SANTAL_GOOGLE_PRIVATE_KEY`

Внешние шаги Google:

1. Включить Google Sheets API в проекте Google Cloud.
2. Создать отдельный service account, например `santal-shift-sync`.
3. Создать JSON key и взять из него `client_email` и `private_key`.
4. Выдать `client_email` права редактора на рабочую Google Таблицу.
5. Добавить `client_email` в `SANTAL_GOOGLE_SERVICE_ACCOUNT_EMAIL`.
6. Добавить `private_key` в `SANTAL_GOOGLE_PRIVATE_KEY`, сохранив переносы строк.

После добавления секретов нужно вручную запустить GitHub Actions workflow `Deploy Santal Shift Mini App`. При ручном запуске workflow инициализирует структуру таблицы через:

```bash
curl -X POST \
  -H "Authorization: Bearer <ADMIN_SETUP_TOKEN>" \
  https://santal-shift-app.taigisch11.workers.dev/api/admin/setup-sheet
```

Листы приложения:

- `Настройки_клиники`
- `Филиалы`
- `Администраторы`
- `Смены`
- `Заявки`
- `Назначения`
- `Ставки`
- `Праздники`
- `Истории_новости`
- `Выплаты`
- `Начисления`
- `Шахматка`
- `Справочники`
- `Аудит_лог`
- `Уведомления`
- `Sync_State`

## Telegram

Обязательные GitHub secrets:

- `SANTAL_TELEGRAM_BOT_TOKEN`
- `SANTAL_TELEGRAM_WEBHOOK_SECRET`
- `SANTAL_TELEGRAM_TOKEN_ROTATED_AT`

`SANTAL_TELEGRAM_TOKEN_ROTATED_AT` нужен как релизный флаг безопасности. Он подтверждает, что токен бота был перевыпущен перед публичным запуском. Значение указывается в ISO-формате:

```text
2026-06-06T00:00:00.000Z
```

Workflow настраивает:

- Bot commands: `/start`, `/my`, `/today`, `/money`, `/help`
- Menu Button `Смены`
- Webhook `/api/telegram/webhook`
- Cron-уведомления каждый день в 09:00 по Томску

## Проверка релиза

Локальный preflight:

```bash
npm run santal:preflight
```

Он проверяет GitHub secrets, live readiness и печатает команды для завершения релиза после получения новых секретов.

Endpoint readiness:

```bash
curl https://santal-shift-app.taigisch11.workers.dev/api/release/readiness
```

Он возвращает:

- `ready`
- `marketReadinessPercent`
- `criticalBlockers`
- `nextActions`
- безопасные boolean-проверки без значений секретов

Публичный релиз считается готовым только при:

```json
{
  "ready": true,
  "marketReadinessPercent": 100
}
```

Manual market release через GitHub Actions блокируется, если readiness меньше 100%.

## Ограничение MVP

Google Sheets используется как временное backoffice-хранилище и журнал. Для низкой конкуренции пилота этого достаточно, но для масштабирования запись смен лучше перенести в транзакционное хранилище, например PostgreSQL, Durable Object или очередь с сериализацией по `shiftId`.

## Дорожная карта до 100%

Актуальный чек-лист находится в:

```text
docs/santal-shift-market-release-roadmap.md
```

## Минимальный smoke test

```bash
npm run test --workspace @santal/shift
npm run build --workspace @santal/shift
curl https://santal-shift-app.taigisch11.workers.dev/health
curl https://santal-shift-app.taigisch11.workers.dev/api/release/readiness
```
