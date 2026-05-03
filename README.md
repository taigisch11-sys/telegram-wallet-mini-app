# Telegram Mini App "Кошелек"

Балансовый учет финансов в формате Telegram Mini App. Пользователь не вводит каждую трату, а периодически сверяет реальные остатки по счетам и долгам, отмечает доходы и обязательные платежи. Приложение рассчитывает баланс, свободные деньги, просрочки, риски и нераспределенные расходы.

## Стек

- Frontend: React, Vite, TypeScript, TailwindCSS, Recharts, Telegram WebApp SDK
- Backend: Node.js, Express, TypeScript, Prisma ORM
- Database: PostgreSQL
- Auth: Telegram `initData` + JWT
- Telegram: `/start`, WebApp-кнопка, Menu Button, polling/webhook, защита от дублей `update_id`

## Структура

- `apps/frontend` - интерфейс Telegram Mini App
- `apps/backend` - API, бизнес-логика и Telegram bot runtime
- `packages/shared` - общие DTO, enum и схемы
- `prisma` - схема БД, миграции и seed
- `docker-compose.local.yml` - локальный PostgreSQL на этом ПК

## Локальное хранилище на этом ПК

Данные можно временно хранить прямо на этом компьютере в PostgreSQL внутри Docker. Данные сохраняются в Docker volume `telegram-wallet-postgres-data` и не пропадают при остановке контейнера.

```powershell
npm run local:db:start
```

Подключение:

```dotenv
DATABASE_URL=postgresql://wallet:wallet_local_password@localhost:5432/telegram_wallet
```

Остановить базу без удаления данных:

```powershell
npm run local:db:stop
```

Удалить локальные данные полностью:

```powershell
npm run local:db:reset
```

## Локальный запуск

```powershell
npm install
npm run prisma:generate
npm run local:db:start
```

Backend с локальной БД:

```powershell
$env:DATABASE_URL="postgresql://wallet:wallet_local_password@localhost:5432/telegram_wallet"
$env:BOT_MODE="polling"
$env:DEV_AUTH_BYPASS="true"
npm run dev:backend
```

Frontend:

```powershell
npm run dev:frontend
```

Адреса:

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:4000`
- Healthcheck: `http://localhost:4000/health`

## Временная бесплатная публикация

Для тестирования Telegram Mini App без платных тарифов можно использовать:

- локальный backend и frontend на этом ПК;
- локальный PostgreSQL в Docker;
- бесплатный HTTPS-туннель, например Cloudflare Tunnel.

Схема:

```text
Telegram -> HTTPS tunnel -> this PC -> frontend/backend -> local PostgreSQL
```

Важно: это временный вариант. Если ПК выключен, спит или потерял интернет, приложение будет недоступно.

## Production

Рекомендуемая полноценная схема:

- Frontend: Vercel, Netlify, Cloudflare Pages или другой static hosting
- Backend: Render/Railway/Fly.io/Koyeb или VPS
- Database: Neon/Supabase/PostgreSQL

Для production backend должен работать с:

```dotenv
BOT_MODE=webhook
DEV_AUTH_BYPASS=false
TELEGRAM_WEBHOOK_URL=https://your-backend-url/api/telegram/webhook
TELEGRAM_WEBHOOK_SECRET=long-random-secret
TELEGRAM_WEBAPP_URL=https://your-frontend-url
FRONTEND_ORIGIN=https://your-frontend-url
```

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

## Проверка

```powershell
npm run test
npm run build
```
