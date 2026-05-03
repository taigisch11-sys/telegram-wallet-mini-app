# Telegram Wallet Mini App Design

## Goal

Build a production-ready Telegram Mini App "Wallet" for balance-based personal finance tracking. The app should let users maintain actual balances across accounts and debts, track planned incomes and payments, reconcile differences between expected and actual money movement, and interact through both a Telegram Mini App frontend and a Telegram bot entrypoint.

## Product Summary

The product is not an expense tracker with line-by-line transaction input. Instead, it is a balance reconciliation system:

- Users periodically update the real balances of their accounts and debts.
- Users mark planned incomes as received and planned payments as paid.
- The system derives current, calculated, and adjusted balances.
- Differences between modeled and real money become visible as additional or unallocated expenses.

This makes the product closer to a control panel for cashflow discipline than to a traditional accounting ledger.

## Scope

This first release includes:

- Full backend API with authentication, finance entities, aggregation logic, history, analytics, and Telegram bot integration.
- Full frontend Mini App with mobile-first dark UI.
- PostgreSQL data model with Prisma schema and seed data.
- Local launch flow with Telegram bot support in both polling and webhook modes, selected by environment variable.
- Deployment documentation for Vercel, Render or Railway, and Neon or Supabase.

This first release does not include:

- Multi-user household or shared ledgers.
- Recurring schedule generation engine.
- File attachments.
- Push notifications outside Telegram bot messages.
- Full bookkeeping or per-transaction import.

## Architecture

The repository will be reorganized into a workspace with the following top-level structure:

- `apps/frontend`
- `apps/backend`
- `prisma`
- `.env.example`
- `README.md`
- `package.json`

The implementation uses a single backend process with modular separation rather than multiple deployable services.

### Frontend

The frontend is a Telegram Mini App built with:

- React
- Vite
- TypeScript
- TailwindCSS
- Recharts
- Telegram WebApp SDK

The frontend is mobile-first, dark-themed, and optimized for Telegram in-app browsing. It communicates only with the backend API using JWT authentication obtained after Telegram initData validation.

### Backend

The backend is built with:

- Node.js
- Express
- TypeScript
- Prisma ORM
- PostgreSQL

The backend process contains the following modules:

- `auth`: validates Telegram `initData`, creates or updates users, issues JWT, protects API routes.
- `telegram`: initializes the bot, sets the menu button, handles `/start`, supports webhook or long polling, deduplicates `update_id`.
- `accounts`: CRUD for financial accounts.
- `debts`: CRUD for debts.
- `income`: CRUD plus mark-as-received flow.
- `payments`: CRUD plus mark-as-paid flow.
- `settings`: current month, start balance, edited balance.
- `snapshots`: balance adjustment workflow and snapshot creation.
- `state`: aggregate dashboard endpoint.
- `analytics`: chart shaping, forecast, risk indicators.
- `history`: audit and event feed generation.

### Telegram Integration

The Telegram bot is part of the backend application lifecycle.

- `/start` sends a message with a button that opens the Mini App.
- Menu Button is configured automatically on startup when bot credentials are present.
- Bot mode is environment-driven:
  - `BOT_MODE=polling` for local development by default
  - `BOT_MODE=webhook` for public deployment or local tunnel workflows
- Duplicate Telegram updates are blocked using persistent storage of processed `update_id` values.

## Data Model

### User

- `id`
- `telegramId`
- `username`
- `firstName`
- `createdAt`

Purpose: owner of all finance data and Telegram identity binding.

### Account

- `id`
- `userId`
- `name`
- `balance`
- `createdAt`

Purpose: stores actual current balance for each wallet, card, bank account, or cash container.

### Debt

- `id`
- `userId`
- `name`
- `amount`
- `createdAt`

Purpose: stores current debt values as negative money. Validation must enforce negative values.

### Income

- `id`
- `userId`
- `name`
- `amount`
- `plannedDate`
- `expectedDate`
- `actualDate`
- `status`
- `note`

Statuses:

- `planned`
- `delayed`
- `received_on_time`
- `received_late`
- `cancelled`

### Payment

- `id`
- `userId`
- `name`
- `amount`
- `plannedDate`
- `expectedDate`
- `actualDate`
- `status`
- `note`

Statuses:

- `planned`
- `overdue`
- `paid_on_time`
- `paid_late`
- `skipped`
- `cancelled`

### Settings

- `userId`
- `currentMonth`
- `startBalance`
- `editedBalance`

Purpose: stores the active planning period baseline and optional manual override of the modeled balance.

### BalanceSnapshot

- `id`
- `userId`
- `accountBalance`
- `debtBalance`
- `netBalance`
- `createdAt`

Purpose: immutable record of reconciliation checkpoints after manual balance updates.

### History

- `id`
- `userId`
- `type`
- `payload`
- `createdAt`

Purpose: stores user-visible activity events and backend-generated audit facts.

### TelegramUpdate

Additional persistence is required for bot safety:

- `id`
- `updateId`
- `processedAt`

Purpose: block duplicate Telegram update processing across retries and restarts.

This table is an implementation necessity for the stated deduplication requirement even though it is not listed in the original business entities.

## Domain Rules

### Effective Date

For both `Income` and `Payment`:

- `effectiveDate = expectedDate ?? plannedDate`

This value is computed in backend services and response mappers. It does not need to be stored in the database.

### Core Balances

- `accountBalance = SUM(accounts.balance)`
- `debtBalance = SUM(debts.amount)`
- `netBalance = accountBalance + debtBalance`

### Calculated Balance

`calculatedBalance` is the model-based balance for the active period:

- `startBalance`
- plus total of incomes with status `received_on_time` or `received_late`
- minus total of payments with status `paid_on_time` or `paid_late`

Formula:

`calculatedBalance = startBalance + receivedIncome - paidPayments`

### Current Balance

- `currentBalance = editedBalance ?? calculatedBalance`

### Additional Expenses

- if `editedBalance` exists:
  - `additionalExpenses = editedBalance - calculatedBalance`
- otherwise:
  - `additionalExpenses = 0`

This value can be negative if real life is better than the model, but the main UI should primarily highlight negative drift as spending leakage.

### Status Interpretation

Income:

- `planned`: expected but not received
- `delayed`: expected date passed or manual delay state before receipt
- `received_on_time`: received and actual date is on or before effective date
- `received_late`: received and actual date is after effective date
- `cancelled`: removed from expected future cashflow

Payment:

- `planned`: expected but not paid
- `overdue`: effective date passed without payment
- `paid_on_time`: paid and actual date is on or before effective date
- `paid_late`: paid and actual date is after effective date
- `skipped`: intentionally not paid and excluded from cashflow facts
- `cancelled`: removed from planning scope

### Forecast and Risk Indicators

`freeMoney` is defined as:

- `freeMoney = currentBalance - requiredUpcomingPayments`

Where `requiredUpcomingPayments` counts upcoming `planned` and `overdue` payments within the selected forecast window and excludes `cancelled`, `skipped`, and already paid items.

Indicators:

- cash gap risk: projected balance goes below zero after upcoming required payments
- debt load: `abs(debtBalance) / max(accountBalance, 1)`
- delayed income warning: income effective date is before today and status is not received or cancelled
- overdue payment warning: payment effective date is before today and status is not paid, skipped, or cancelled

Threshold presentation:

- low debt load: less than 0.3
- medium debt load: from 0.3 to less than 0.7
- high debt load: 0.7 or above

These thresholds are UI rules and can be tuned later without schema changes.

## Balance Adjustment Workflow

This is the main product feature.

### User Flow

1. User opens the `Accounts` screen.
2. User edits actual balances for accounts and actual amounts for debts.
3. User submits one combined reconciliation action.
4. Backend updates balances and creates a `BalanceSnapshot`.
5. Backend compares the new snapshot with the previous snapshot.
6. Backend returns updated aggregate state and records detailed history.

### Transaction Rules

The reconciliation endpoint must run in a single database transaction:

1. Load current user accounts and debts.
2. Update changed account balances.
3. Update changed debt amounts, validating that each amount remains negative.
4. Recompute `accountBalance`, `debtBalance`, `netBalance`.
5. Create `BalanceSnapshot`.
6. Load previous snapshot if it exists.
7. Compute snapshot delta and modeled delta.
8. Create `History` event with structured payload.

### Reconciliation Output

The result payload should include:

- new `accountBalance`
- new `debtBalance`
- new `netBalance`
- previous snapshot values if available
- `snapshotDelta`
- `calculatedBalance`
- `currentBalance`
- `additionalExpenses`
- summary of related completed incomes
- summary of related completed payments
- inferred unexplained drift

The backend will not attempt to automatically assign unexplained drift to concrete categories. It only exposes the difference clearly.

## API Design

All API routes are under `/api`.

### Auth

- `POST /api/auth/telegram`

Request:

- `initData`

Behavior:

- validate Telegram signature using bot token
- extract Telegram user payload
- create or update user
- create settings if missing
- return JWT and user payload

### State

- `GET /api/state`

Returns:

- user summary
- balances
- alerts
- upcoming events
- charts preview
- counts by status
- latest snapshot summary

### Accounts

- `GET /api/accounts`
- `POST /api/accounts`
- `PATCH /api/accounts/:id`
- `DELETE /api/accounts/:id`

### Debts

- `GET /api/debts`
- `POST /api/debts`
- `PATCH /api/debts/:id`
- `DELETE /api/debts/:id`

### Income

- `GET /api/income`
- `POST /api/income`
- `PATCH /api/income/:id`
- `PATCH /api/income/:id/mark-received`
- `DELETE /api/income/:id`

`mark-received` behavior:

- accepts optional `actualDate`
- sets status to `received_on_time` or `received_late` based on effective date comparison
- stores `actualDate`
- creates history event

### Payments

- `GET /api/payments`
- `POST /api/payments`
- `PATCH /api/payments/:id`
- `PATCH /api/payments/:id/mark-paid`
- `DELETE /api/payments/:id`

`mark-paid` behavior:

- accepts optional `actualDate`
- sets status to `paid_on_time` or `paid_late` based on effective date comparison
- stores `actualDate`
- creates history event

### Settings

- `PATCH /api/settings/start-balance`
- `PATCH /api/settings/edited-balance`

### History

- `GET /api/history`

### Snapshot Reconciliation

The specification needs one dedicated endpoint to satisfy the main feature cleanly:

- `POST /api/accounts/reconcile`

Request:

- list of account balance updates
- list of debt amount updates
- optional `editedBalance`

Response:

- new snapshot
- updated balances
- calculated drift metrics
- generated history event

This endpoint is an implementation addition required to support the described workflow in a single atomic action.

### Analytics

The frontend graphs require backend-prepared timeseries:

- `GET /api/analytics/timeseries?period=week|month|quarter|year`

Returns:

- net balance series
- account balance series
- debt balance series
- additional expenses series

## Frontend Experience

### Visual Direction

- dark theme
- minimalism
- compact cards
- soft contrast surfaces
- Telegram-native feel without cloning Telegram Wallet exactly
- mobile-first spacing and typography

### Navigation

Bottom navigation:

- `Кошелёк`
- `План`
- `Счета`
- `Графики`
- `История`

### Wallet Screen

Shows:

- large `currentBalance`
- `calculatedBalance`
- `additionalExpenses`
- `freeMoney`
- warnings banner
- list of nearest events

This screen is powered primarily by `GET /api/state`.

### Plan Screen

Shows:

- incomes list
- payments list
- status filters
- fast actions to mark income received
- fast actions to mark payment paid

Card states:

- completed: dimmed
- delayed or overdue: highlighted
- upcoming: neutral

### Accounts Screen

Shows:

- account cards
- debt cards
- totals
- reconciliation form

The reconciliation form is the core interaction:

- edit all balances in one place
- submit once
- immediately see updated current numbers and history

### Charts Screen

Supports periods:

- week
- month
- quarter
- year

Charts:

- net balance
- money on accounts
- debts
- additional expenses

### History Screen

Shows a reverse-chronological feed of:

- reconciliation snapshots
- account changes
- debt changes
- marked income events
- marked payment events
- start balance and edited balance changes

## Error Handling

Backend must provide consistent JSON error responses with:

- human-readable message
- machine-readable error code

Critical validation rules:

- debt amount must remain negative
- account and debt records must belong to authenticated user
- payment and income amounts must be positive
- required dates must be valid ISO date values
- Telegram auth requests must reject invalid signature

Frontend must:

- show inline validation for forms
- show safe fallback states for empty data
- surface API failures as lightweight toast or banner messages
- avoid blocking navigation on non-critical fetch failures

## Security

Authentication flow:

1. Telegram Mini App provides `initData`.
2. Frontend posts it to backend.
3. Backend validates signature using bot token.
4. Backend issues JWT.
5. Frontend stores JWT in memory and local persistence suitable for Mini App session continuity.

Authorization:

- every protected route resolves user from JWT
- every resource query is scoped by `userId`

Telegram bot safety:

- ignore duplicate `update_id`
- verify webhook requests through route secrecy and bot token configuration

## Local Development

The project must support both Telegram and non-Telegram friendly development.

Required environment toggles:

- database connection
- backend port
- frontend public API URL
- JWT secret
- Telegram bot token
- WebApp URL
- bot mode
- webhook URL

Local mode defaults:

- frontend via Vite
- backend via tsx or equivalent dev runner
- Prisma against local or hosted PostgreSQL
- bot in polling mode unless `BOT_MODE=webhook`

## Deployment

Expected production split:

- frontend on Vercel
- backend on Render or Railway
- PostgreSQL on Neon or Supabase

Webhook mode in production:

- public backend URL
- Telegram webhook configured on boot or via command
- frontend WebApp URL points to production frontend domain

## Seed Data

Seed data should create one demo user with:

- multiple accounts
- multiple debts
- a mix of planned and completed incomes
- a mix of planned, overdue, and paid payments
- settings
- several snapshots
- history entries

The seed must let a developer launch the project and immediately see realistic UI states without manual data entry.

## Testing Strategy

### Backend

- unit tests for balance calculations, status transitions, risk indicators, and reconciliation math
- integration tests for Telegram auth, major CRUD endpoints, mark-received, mark-paid, and reconcile flow

### Frontend

- component tests for balance summary, state cards, and warnings
- integration or smoke tests for primary screens and bottom navigation

### Manual Verification

- launch frontend locally
- launch backend locally
- authenticate through Telegram flow or dev fallback strategy used only when explicit dev flag is enabled
- create, update, and reconcile balances
- mark incomes and payments
- confirm charts and history update correctly

## Implementation Notes

- Shared TypeScript DTOs should be stored in a small common package or shared folder to keep frontend and backend status enums aligned.
- Monetary values should use decimal database types and string-safe transport handling to avoid floating point drift.
- Date logic should normalize on UTC-safe storage with explicit formatting on the frontend.
- The backend should centralize calculation logic in pure utility functions to make testing reliable.

## Decisions Confirmed

- Telegram bot support is included in v1.
- Both polling and webhook modes are supported.
- Local development defaults to polling.
- The backend remains a single process with internal module separation.
- The Mini App is a balance-based finance tracker, not a transaction-entry ledger.

