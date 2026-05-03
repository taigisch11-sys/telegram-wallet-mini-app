# Telegram Mini App "Кошелёк"

Балансовый учёт финансов в формате Telegram Mini App. Пользователь не вводит каждую трату, а периодически сверяет реальные остатки по счетам и долгам, отмечает доходы и обязательные платежи, а приложение показывает текущий баланс, прогноз, просрочки и нераспределённые расходы.

## Стек

- Frontend: React, Vite, TypeScript, TailwindCSS, Recharts, Telegram WebApp SDK
- Backend: Node.js, Express, TypeScript, Prisma ORM
- Database: PostgreSQL
- Auth: Telegram `initData` + JWT
- Telegram: `/start`, WebApp-кнопка, Menu Button, polling/webhook, защита от дублей `update_id`

## Структура

- `apps/frontend` — интерфейс Telegram Mini App
- `apps/backend` — API, бизнес-логика и Telegram bot runtime
- `packages/shared` — общие DTO, enum и схемы валидации
- `prisma` — схема БД и seed
- `.env.example` — локальный шаблон окружения
- `.env.production.example` — production-шаблон окружения

## Локальный запуск

```bash
npm install
npm run prisma:generate
npm run prisma:migrate
npm run dev:backend
npm run dev:frontend
```

Локальные адреса:

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:4000`
- Healthcheck: `http://localhost:4000/health`

## База данных

Для локальной разработки нужен PostgreSQL и `DATABASE_URL` в `.env`.

Команды:

```bash
npm run prisma:migrate
npm run prisma:deploy
npm run prisma:seed
```

Для production используется `npm run prisma:deploy`. Seed в production запускать не нужно, если не нужны тестовые данные.

## Telegram

Локально:

```dotenv
BOT_MODE=polling
TELEGRAM_BOT_TOKEN=123456:token
TELEGRAM_WEBAPP_URL=https://your-public-frontend-url
DEV_AUTH_BYPASS=true
```

Production:

```dotenv
BOT_MODE=webhook
TELEGRAM_WEBHOOK_URL=https://your-backend-url/api/telegram/webhook
TELEGRAM_WEBHOOK_SECRET=long-random-secret
TELEGRAM_WEBAPP_URL=https://your-frontend-url
DEV_AUTH_BYPASS=false
```

При запуске backend в webhook-режиме приложение регистрирует webhook и Menu Button автоматически.

## API

- `POST /api/auth/telegram`
- `GET /api/state`
- `GET /api/accounts`
- `POST /api/accounts`
- `PATCH /api/accounts/:id`
- `DELETE /api/accounts/:id`
- `POST /api/accounts/reconcile`
- `GET /api/debts`
- `POST /api/debts`
- `PATCH /api/debts/:id`
- `DELETE /api/debts/:id`
- `GET /api/income`
- `POST /api/income`
- `PATCH /api/income/:id`
- `PATCH /api/income/:id/mark-received`
- `DELETE /api/income/:id`
- `GET /api/payments`
- `POST /api/payments`
- `PATCH /api/payments/:id`
- `PATCH /api/payments/:id/mark-paid`
- `DELETE /api/payments/:id`
- `PATCH /api/settings/start-balance`
- `PATCH /api/settings/edited-balance`
- `GET /api/history`
- `GET /api/analytics/timeseries?period=week|month|quarter|year`

## Публикация

Рекомендуемая схема:

- Frontend: Vercel
- Backend: Render
- Database: Neon или Supabase PostgreSQL

### Vercel

1. Импортируйте репозиторий.
2. Используйте корневой `vercel.json`.
3. Добавьте env:
   `VITE_API_URL=https://your-backend-url`
4. После деплоя вставьте Vercel URL в backend env `TELEGRAM_WEBAPP_URL` и `FRONTEND_ORIGIN`.

### Render

1. Подключите репозиторий.
2. Используйте `render.yaml`.
3. Добавьте env из `.env.production.example`.
4. Укажите `DATABASE_URL` от Neon/Supabase.
5. Backend сам выполнит `prisma migrate deploy` перед стартом.

### Neon или Supabase

1. Создайте PostgreSQL database.
2. Скопируйте connection string с `sslmode=require`.
3. Вставьте его в Render env `DATABASE_URL`.

## Проверка

```bash
npm run test
npm run build
```

Ожидаемый результат:

- backend tests проходят
- frontend component tests проходят
- production build проходит

