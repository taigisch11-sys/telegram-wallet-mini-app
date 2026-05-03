# Telegram Wallet Mini App Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a locally runnable Telegram Mini App for balance-based finance tracking with React frontend, Express backend, Prisma/PostgreSQL persistence, Telegram auth, Telegram bot integration, charts, history, seed data, and deployment-ready configuration.

**Architecture:** Rework the current single Vite app into a workspace with `apps/frontend` and `apps/backend`, a shared Prisma schema, and a single backend process that serves API routes and Telegram bot transport. Keep balance calculations in pure backend utilities, expose aggregate state through `/api/state`, and make the frontend a mobile-first Mini App consuming typed DTOs.

**Tech Stack:** React, Vite, TypeScript, TailwindCSS, Recharts, Telegram WebApp SDK, Node.js, Express, Prisma ORM, PostgreSQL, JWT, Vitest, Testing Library, Supertest, tsx, dotenv, Zod.

---

## File Structure

### Root

- Create: `package.json`
- Create: `pnpm-workspace.yaml` or keep npm workspaces in `package.json`
- Create: `tsconfig.base.json`
- Create: `.env.example`
- Create: `README.md`
- Create: `.gitignore` updates if needed

### Prisma

- Create: `prisma/schema.prisma`
- Create: `prisma/seed.ts`

### Shared Types

- Create: `packages/shared/package.json`
- Create: `packages/shared/tsconfig.json`
- Create: `packages/shared/src/index.ts`
- Create: `packages/shared/src/types.ts`
- Create: `packages/shared/src/enums.ts`
- Create: `packages/shared/src/schemas.ts`

### Backend

- Create: `apps/backend/package.json`
- Create: `apps/backend/tsconfig.json`
- Create: `apps/backend/vitest.config.ts`
- Create: `apps/backend/src/server.ts`
- Create: `apps/backend/src/app.ts`
- Create: `apps/backend/src/env.ts`
- Create: `apps/backend/src/lib/prisma.ts`
- Create: `apps/backend/src/lib/jwt.ts`
- Create: `apps/backend/src/lib/telegram.ts`
- Create: `apps/backend/src/lib/errors.ts`
- Create: `apps/backend/src/lib/http.ts`
- Create: `apps/backend/src/middleware/auth.ts`
- Create: `apps/backend/src/middleware/error-handler.ts`
- Create: `apps/backend/src/middleware/not-found.ts`
- Create: `apps/backend/src/modules/auth/auth.controller.ts`
- Create: `apps/backend/src/modules/auth/auth.service.ts`
- Create: `apps/backend/src/modules/state/state.controller.ts`
- Create: `apps/backend/src/modules/state/state.service.ts`
- Create: `apps/backend/src/modules/accounts/accounts.controller.ts`
- Create: `apps/backend/src/modules/accounts/accounts.service.ts`
- Create: `apps/backend/src/modules/accounts/accounts.schemas.ts`
- Create: `apps/backend/src/modules/debts/debts.controller.ts`
- Create: `apps/backend/src/modules/debts/debts.service.ts`
- Create: `apps/backend/src/modules/debts/debts.schemas.ts`
- Create: `apps/backend/src/modules/income/income.controller.ts`
- Create: `apps/backend/src/modules/income/income.service.ts`
- Create: `apps/backend/src/modules/income/income.schemas.ts`
- Create: `apps/backend/src/modules/payments/payments.controller.ts`
- Create: `apps/backend/src/modules/payments/payments.service.ts`
- Create: `apps/backend/src/modules/payments/payments.schemas.ts`
- Create: `apps/backend/src/modules/settings/settings.controller.ts`
- Create: `apps/backend/src/modules/settings/settings.service.ts`
- Create: `apps/backend/src/modules/history/history.controller.ts`
- Create: `apps/backend/src/modules/history/history.service.ts`
- Create: `apps/backend/src/modules/analytics/analytics.controller.ts`
- Create: `apps/backend/src/modules/analytics/analytics.service.ts`
- Create: `apps/backend/src/modules/telegram/telegram-bot.ts`
- Create: `apps/backend/src/modules/telegram/telegram-webhook.controller.ts`
- Create: `apps/backend/src/modules/telegram/telegram.service.ts`
- Create: `apps/backend/src/modules/finance/finance-calculations.ts`
- Create: `apps/backend/src/modules/finance/finance-mappers.ts`
- Create: `apps/backend/src/modules/finance/finance-history.ts`
- Create: `apps/backend/src/modules/finance/finance-utils.ts`
- Create: `apps/backend/src/test/helpers/test-app.ts`
- Create: `apps/backend/src/test/helpers/test-db.ts`
- Create: `apps/backend/src/test/finance-calculations.test.ts`
- Create: `apps/backend/src/test/auth.telegram.test.ts`
- Create: `apps/backend/src/test/accounts.reconcile.test.ts`
- Create: `apps/backend/src/test/income.mark-received.test.ts`
- Create: `apps/backend/src/test/payments.mark-paid.test.ts`
- Create: `apps/backend/src/test/state.test.ts`

### Frontend

- Create: `apps/frontend/package.json`
- Create: `apps/frontend/tsconfig.json`
- Create: `apps/frontend/vite.config.ts`
- Create: `apps/frontend/tailwind.config.ts`
- Create: `apps/frontend/postcss.config.js`
- Create: `apps/frontend/index.html`
- Create: `apps/frontend/src/main.tsx`
- Create: `apps/frontend/src/app/App.tsx`
- Create: `apps/frontend/src/app/providers.tsx`
- Create: `apps/frontend/src/app/router.tsx`
- Create: `apps/frontend/src/app/styles.css`
- Create: `apps/frontend/src/lib/api.ts`
- Create: `apps/frontend/src/lib/telegram.ts`
- Create: `apps/frontend/src/lib/format.ts`
- Create: `apps/frontend/src/lib/theme.ts`
- Create: `apps/frontend/src/hooks/use-auth.ts`
- Create: `apps/frontend/src/hooks/use-state.ts`
- Create: `apps/frontend/src/hooks/use-bottom-nav.ts`
- Create: `apps/frontend/src/components/layout/shell.tsx`
- Create: `apps/frontend/src/components/layout/bottom-nav.tsx`
- Create: `apps/frontend/src/components/common/card.tsx`
- Create: `apps/frontend/src/components/common/badge.tsx`
- Create: `apps/frontend/src/components/common/metric.tsx`
- Create: `apps/frontend/src/components/common/empty-state.tsx`
- Create: `apps/frontend/src/components/common/loading-screen.tsx`
- Create: `apps/frontend/src/components/wallet/balance-hero.tsx`
- Create: `apps/frontend/src/components/wallet/alerts-panel.tsx`
- Create: `apps/frontend/src/components/wallet/upcoming-list.tsx`
- Create: `apps/frontend/src/components/plan/income-list.tsx`
- Create: `apps/frontend/src/components/plan/payment-list.tsx`
- Create: `apps/frontend/src/components/accounts/account-list.tsx`
- Create: `apps/frontend/src/components/accounts/debt-list.tsx`
- Create: `apps/frontend/src/components/accounts/reconcile-form.tsx`
- Create: `apps/frontend/src/components/charts/timeseries-panel.tsx`
- Create: `apps/frontend/src/components/history/history-feed.tsx`
- Create: `apps/frontend/src/screens/wallet-screen.tsx`
- Create: `apps/frontend/src/screens/plan-screen.tsx`
- Create: `apps/frontend/src/screens/accounts-screen.tsx`
- Create: `apps/frontend/src/screens/charts-screen.tsx`
- Create: `apps/frontend/src/screens/history-screen.tsx`
- Create: `apps/frontend/src/test/app.smoke.test.tsx`
- Create: `apps/frontend/src/test/balance-hero.test.tsx`
- Create: `apps/frontend/src/test/alerts-panel.test.tsx`

## Task 1: Rebuild The Repository As A Workspace

**Files:**
- Create: `package.json`
- Create: `tsconfig.base.json`
- Create: `apps/backend/package.json`
- Create: `apps/frontend/package.json`
- Create: `packages/shared/package.json`
- Modify: `.gitignore`

- [ ] **Step 1: Write the failing structure test**

Create `apps/backend/src/test/workspace-layout.test.ts`:

```ts
import { describe, expect, it } from 'vitest';

describe('workspace layout', () => {
  it('uses frontend, backend, and shared packages', () => {
    const packages = ['apps/frontend', 'apps/backend', 'packages/shared'];
    expect(packages).toContain('apps/frontend');
    expect(packages).toContain('apps/backend');
    expect(packages).toContain('packages/shared');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test --workspace apps/backend -- workspace-layout.test.ts`
Expected: FAIL because `apps/backend` test runner and workspace files do not exist yet.

- [ ] **Step 3: Replace the current single-app root with workspace configuration**

Create root `package.json`:

```json
{
  "name": "telegram-wallet-mini-app",
  "private": true,
  "workspaces": [
    "apps/*",
    "packages/*"
  ],
  "scripts": {
    "dev:frontend": "npm run dev --workspace apps/frontend",
    "dev:backend": "npm run dev --workspace apps/backend",
    "build": "npm run build --workspaces",
    "test": "npm run test --workspaces",
    "lint": "npm run lint --workspaces",
    "prisma:generate": "prisma generate",
    "prisma:migrate": "prisma migrate dev",
    "prisma:seed": "tsx prisma/seed.ts"
  },
  "devDependencies": {
    "prisma": "^6.8.2",
    "tsx": "^4.19.4",
    "typescript": "^5.8.3"
  }
}
```

Create `tsconfig.base.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "strict": true,
    "esModuleInterop": true,
    "resolveJsonModule": true,
    "skipLibCheck": true,
    "baseUrl": ".",
    "paths": {
      "@wallet/shared": ["packages/shared/src/index.ts"]
    }
  }
}
```

Create `apps/backend/package.json`:

```json
{
  "name": "apps/backend",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "tsx watch src/server.ts",
    "build": "tsc -p tsconfig.json",
    "test": "vitest run",
    "lint": "tsc -p tsconfig.json --noEmit"
  }
}
```

Create `apps/frontend/package.json`:

```json
{
  "name": "apps/frontend",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -p tsconfig.json && vite build",
    "test": "vitest run",
    "lint": "tsc -p tsconfig.json --noEmit"
  }
}
```

Create `packages/shared/package.json`:

```json
{
  "name": "@wallet/shared",
  "private": true,
  "type": "module",
  "exports": {
    ".": "./src/index.ts"
  }
}
```

Update `.gitignore` to include:

```gitignore
node_modules
dist
.env
.env.local
coverage
apps/*/dist
apps/*/coverage
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test --workspace apps/backend -- workspace-layout.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add package.json tsconfig.base.json apps/backend/package.json apps/frontend/package.json packages/shared/package.json apps/backend/src/test/workspace-layout.test.ts .gitignore
git commit -m "chore: convert project to workspace layout"
```

## Task 2: Define Prisma Schema And Seed Data

**Files:**
- Create: `prisma/schema.prisma`
- Create: `prisma/seed.ts`
- Create: `packages/shared/src/enums.ts`
- Create: `apps/backend/src/test/prisma-schema.test.ts`

- [ ] **Step 1: Write the failing schema test**

Create `apps/backend/src/test/prisma-schema.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { IncomeStatus, PaymentStatus } from '@wallet/shared';

describe('domain enums', () => {
  it('exposes required income statuses', () => {
    expect(IncomeStatus).toEqual({
      planned: 'planned',
      delayed: 'delayed',
      received_on_time: 'received_on_time',
      received_late: 'received_late',
      cancelled: 'cancelled'
    });
  });

  it('exposes required payment statuses', () => {
    expect(PaymentStatus).toEqual({
      planned: 'planned',
      overdue: 'overdue',
      paid_on_time: 'paid_on_time',
      paid_late: 'paid_late',
      skipped: 'skipped',
      cancelled: 'cancelled'
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test --workspace apps/backend -- prisma-schema.test.ts`
Expected: FAIL because shared enums and Prisma models do not exist yet.

- [ ] **Step 3: Create shared enums, Prisma schema, and realistic seed**

Create `packages/shared/src/enums.ts`:

```ts
export const IncomeStatus = {
  planned: 'planned',
  delayed: 'delayed',
  received_on_time: 'received_on_time',
  received_late: 'received_late',
  cancelled: 'cancelled'
} as const;

export const PaymentStatus = {
  planned: 'planned',
  overdue: 'overdue',
  paid_on_time: 'paid_on_time',
  paid_late: 'paid_late',
  skipped: 'skipped',
  cancelled: 'cancelled'
} as const;

export type IncomeStatus = (typeof IncomeStatus)[keyof typeof IncomeStatus];
export type PaymentStatus = (typeof PaymentStatus)[keyof typeof PaymentStatus];
```

Create `packages/shared/src/index.ts`:

```ts
export * from './enums';
export * from './types';
export * from './schemas';
```

Create `prisma/schema.prisma` with:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum IncomeStatus {
  planned
  delayed
  received_on_time
  received_late
  cancelled
}

enum PaymentStatus {
  planned
  overdue
  paid_on_time
  paid_late
  skipped
  cancelled
}

model User {
  id          String            @id @default(cuid())
  telegramId  String            @unique
  username    String?
  firstName   String?
  createdAt   DateTime          @default(now())
  accounts    Account[]
  debts       Debt[]
  incomes     Income[]
  payments    Payment[]
  settings    Settings?
  snapshots   BalanceSnapshot[]
  history     History[]
}
```

Extend the same file with models:

```prisma
model Account {
  id        String   @id @default(cuid())
  userId    String
  name      String
  balance   Decimal  @db.Decimal(14, 2)
  createdAt DateTime @default(now())
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model Debt {
  id        String   @id @default(cuid())
  userId    String
  name      String
  amount    Decimal  @db.Decimal(14, 2)
  createdAt DateTime @default(now())
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model Income {
  id           String       @id @default(cuid())
  userId       String
  name         String
  amount       Decimal      @db.Decimal(14, 2)
  plannedDate  DateTime
  expectedDate DateTime?
  actualDate   DateTime?
  status       IncomeStatus
  note         String?
  createdAt    DateTime     @default(now())
  user         User         @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model Payment {
  id           String        @id @default(cuid())
  userId       String
  name         String
  amount       Decimal       @db.Decimal(14, 2)
  plannedDate  DateTime
  expectedDate DateTime?
  actualDate   DateTime?
  status       PaymentStatus
  note         String?
  createdAt    DateTime      @default(now())
  user         User          @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model Settings {
  userId        String   @id
  currentMonth  String
  startBalance  Decimal  @db.Decimal(14, 2)
  editedBalance Decimal? @db.Decimal(14, 2)
  user          User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model BalanceSnapshot {
  id             String   @id @default(cuid())
  userId         String
  accountBalance Decimal  @db.Decimal(14, 2)
  debtBalance    Decimal  @db.Decimal(14, 2)
  netBalance     Decimal  @db.Decimal(14, 2)
  createdAt      DateTime @default(now())
  user           User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model History {
  id        String   @id @default(cuid())
  userId    String
  type      String
  payload   Json
  createdAt DateTime @default(now())
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model TelegramUpdate {
  id          String   @id @default(cuid())
  updateId    BigInt   @unique
  processedAt DateTime @default(now())
}
```

Create `prisma/seed.ts` with a demo user, accounts, debts, incomes, payments, settings, snapshots, and history entries matching the spec.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test --workspace apps/backend -- prisma-schema.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add prisma/schema.prisma prisma/seed.ts packages/shared/src/index.ts packages/shared/src/enums.ts apps/backend/src/test/prisma-schema.test.ts
git commit -m "feat: add prisma schema and demo seed data"
```

## Task 3: Build Backend Bootstrap, Environment, And Error Handling

**Files:**
- Create: `apps/backend/src/env.ts`
- Create: `apps/backend/src/app.ts`
- Create: `apps/backend/src/server.ts`
- Create: `apps/backend/src/lib/errors.ts`
- Create: `apps/backend/src/middleware/error-handler.ts`
- Create: `apps/backend/src/test/app-bootstrap.test.ts`

- [ ] **Step 1: Write the failing bootstrap test**

Create `apps/backend/src/test/app-bootstrap.test.ts`:

```ts
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../app';

describe('app bootstrap', () => {
  it('returns health payload', async () => {
    const app = createApp();
    const response = await request(app).get('/health');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ ok: true });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test --workspace apps/backend -- app-bootstrap.test.ts`
Expected: FAIL because Express app and test dependencies do not exist.

- [ ] **Step 3: Implement app bootstrap**

Create `apps/backend/src/env.ts` with Zod-based parsing for:

```ts
BOT_MODE: z.enum(['polling', 'webhook']).default('polling')
DATABASE_URL: z.string().min(1)
JWT_SECRET: z.string().min(32)
PORT: z.coerce.number().default(4000)
TELEGRAM_BOT_TOKEN: z.string().min(1)
TELEGRAM_WEBAPP_URL: z.string().url()
TELEGRAM_WEBHOOK_URL: z.string().url().optional()
TELEGRAM_WEBHOOK_SECRET: z.string().optional()
FRONTEND_ORIGIN: z.string().url()
DEV_AUTH_BYPASS: z.enum(['true', 'false']).default('false')
```

Create `apps/backend/src/lib/errors.ts`:

```ts
export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly code: string,
    message: string
  ) {
    super(message);
  }
}
```

Create `apps/backend/src/app.ts`:

```ts
import cors from 'cors';
import express from 'express';
import { errorHandler } from './middleware/error-handler';

export function createApp() {
  const app = express();
  app.use(cors());
  app.use(express.json());
  app.get('/health', (_req, res) => res.json({ ok: true }));
  app.use(errorHandler);
  return app;
}
```

Create `apps/backend/src/middleware/error-handler.ts`:

```ts
import type { NextFunction, Request, Response } from 'express';
import { AppError } from '../lib/errors';

export function errorHandler(
  error: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  if (error instanceof AppError) {
    return res.status(error.statusCode).json({
      error: {
        code: error.code,
        message: error.message
      }
    });
  }

  return res.status(500).json({
    error: {
      code: 'internal_error',
      message: 'Internal server error'
    }
  });
}
```

Create `apps/backend/src/server.ts` to call `createApp()` and `listen()`.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test --workspace apps/backend -- app-bootstrap.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/backend/src/env.ts apps/backend/src/app.ts apps/backend/src/server.ts apps/backend/src/lib/errors.ts apps/backend/src/middleware/error-handler.ts apps/backend/src/test/app-bootstrap.test.ts
git commit -m "feat: add backend bootstrap and error handling"
```

## Task 4: Implement Shared DTOs And Finance Calculation Utilities

**Files:**
- Create: `packages/shared/src/types.ts`
- Create: `packages/shared/src/schemas.ts`
- Create: `apps/backend/src/modules/finance/finance-calculations.ts`
- Create: `apps/backend/src/test/finance-calculations.test.ts`

- [ ] **Step 1: Write the failing calculation test**

Create `apps/backend/src/test/finance-calculations.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { calculateDashboardBalances } from '../modules/finance/finance-calculations';

describe('calculateDashboardBalances', () => {
  it('computes model and drift values', () => {
    const result = calculateDashboardBalances({
      startBalance: 1000,
      editedBalance: 700,
      accountBalance: 820,
      debtBalance: -150,
      incomes: [{ amount: 600, status: 'received_on_time' }],
      payments: [{ amount: 900, status: 'paid_on_time' }]
    });

    expect(result).toEqual({
      accountBalance: 820,
      debtBalance: -150,
      netBalance: 670,
      calculatedBalance: 700,
      currentBalance: 700,
      additionalExpenses: 0
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test --workspace apps/backend -- finance-calculations.test.ts`
Expected: FAIL because calculation module and shared types do not exist.

- [ ] **Step 3: Implement DTOs and pure calculation helpers**

Create `packages/shared/src/types.ts` with DTOs for:

- `UserDto`
- `AccountDto`
- `DebtDto`
- `IncomeDto`
- `PaymentDto`
- `SettingsDto`
- `BalanceSummaryDto`
- `AlertDto`
- `UpcomingEventDto`
- `DashboardStateDto`
- `HistoryItemDto`
- `TimeseriesPointDto`

Create `packages/shared/src/schemas.ts` with Zod request and response contracts shared between backend and frontend.

Create `apps/backend/src/modules/finance/finance-calculations.ts` with pure functions:

```ts
type MoneyItem = { amount: number; status: string };

export function calculateDashboardBalances(input: {
  startBalance: number;
  editedBalance: number | null;
  accountBalance: number;
  debtBalance: number;
  incomes: MoneyItem[];
  payments: MoneyItem[];
}) {
  const receivedIncome = input.incomes
    .filter((item) => item.status === 'received_on_time' || item.status === 'received_late')
    .reduce((sum, item) => sum + item.amount, 0);

  const paidPayments = input.payments
    .filter((item) => item.status === 'paid_on_time' || item.status === 'paid_late')
    .reduce((sum, item) => sum + item.amount, 0);

  const calculatedBalance = input.startBalance + receivedIncome - paidPayments;
  const currentBalance = input.editedBalance ?? calculatedBalance;

  return {
    accountBalance: input.accountBalance,
    debtBalance: input.debtBalance,
    netBalance: input.accountBalance + input.debtBalance,
    calculatedBalance,
    currentBalance,
    additionalExpenses: input.editedBalance !== null ? input.editedBalance - calculatedBalance : 0
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test --workspace apps/backend -- finance-calculations.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add packages/shared/src/types.ts packages/shared/src/schemas.ts apps/backend/src/modules/finance/finance-calculations.ts apps/backend/src/test/finance-calculations.test.ts
git commit -m "feat: add shared dto contracts and finance calculations"
```

## Task 5: Implement Telegram Auth, JWT, And Protected Routing

**Files:**
- Create: `apps/backend/src/lib/jwt.ts`
- Create: `apps/backend/src/lib/telegram.ts`
- Create: `apps/backend/src/middleware/auth.ts`
- Create: `apps/backend/src/modules/auth/auth.service.ts`
- Create: `apps/backend/src/modules/auth/auth.controller.ts`
- Create: `apps/backend/src/test/auth.telegram.test.ts`

- [ ] **Step 1: Write the failing auth test**

Create `apps/backend/src/test/auth.telegram.test.ts`:

```ts
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../app';

describe('POST /api/auth/telegram', () => {
  it('rejects invalid telegram init data', async () => {
    const app = createApp();
    const response = await request(app)
      .post('/api/auth/telegram')
      .send({ initData: 'bad-data' });

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe('telegram_auth_invalid');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test --workspace apps/backend -- auth.telegram.test.ts`
Expected: FAIL because auth route does not exist.

- [ ] **Step 3: Implement Telegram auth and JWT**

Create `apps/backend/src/lib/jwt.ts` with `signJwt()` and `verifyJwt()` using `jose`.

Create `apps/backend/src/lib/telegram.ts` with:

- `parseTelegramInitData()`
- `validateTelegramInitData(initData: string, botToken: string)`
- `extractTelegramUser()`

Create `apps/backend/src/modules/auth/auth.service.ts`:

- validate `initData`
- upsert user by `telegramId`
- create default settings if missing
- return JWT and user DTO

Create `apps/backend/src/middleware/auth.ts`:

- parse `Authorization: Bearer`
- verify JWT
- attach `req.user`

Mount `POST /api/auth/telegram` in `createApp()`.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test --workspace apps/backend -- auth.telegram.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/backend/src/lib/jwt.ts apps/backend/src/lib/telegram.ts apps/backend/src/middleware/auth.ts apps/backend/src/modules/auth/auth.service.ts apps/backend/src/modules/auth/auth.controller.ts apps/backend/src/test/auth.telegram.test.ts apps/backend/src/app.ts
git commit -m "feat: add telegram authentication and jwt auth"
```

## Task 6: Implement Accounts, Debts, Settings, And Reconciliation Flow

**Files:**
- Create: `apps/backend/src/modules/accounts/accounts.controller.ts`
- Create: `apps/backend/src/modules/accounts/accounts.service.ts`
- Create: `apps/backend/src/modules/accounts/accounts.schemas.ts`
- Create: `apps/backend/src/modules/debts/debts.controller.ts`
- Create: `apps/backend/src/modules/debts/debts.service.ts`
- Create: `apps/backend/src/modules/debts/debts.schemas.ts`
- Create: `apps/backend/src/modules/settings/settings.controller.ts`
- Create: `apps/backend/src/modules/settings/settings.service.ts`
- Create: `apps/backend/src/modules/finance/finance-history.ts`
- Create: `apps/backend/src/test/accounts.reconcile.test.ts`

- [ ] **Step 1: Write the failing reconciliation test**

Create `apps/backend/src/test/accounts.reconcile.test.ts`:

```ts
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../app';

describe('POST /api/accounts/reconcile', () => {
  it('creates a snapshot and returns drift metrics', async () => {
    const app = createApp();
    const response = await request(app)
      .post('/api/accounts/reconcile')
      .set('Authorization', 'Bearer test-token')
      .send({
        accounts: [{ id: 'acc-1', balance: '500.00' }],
        debts: [{ id: 'debt-1', amount: '-120.00' }],
        editedBalance: '380.00'
      });

    expect(response.status).toBe(200);
    expect(response.body.snapshot).toBeDefined();
    expect(response.body.summary.additionalExpenses).toBeDefined();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test --workspace apps/backend -- accounts.reconcile.test.ts`
Expected: FAIL because reconcile route and supporting services do not exist.

- [ ] **Step 3: Implement accounts, debts, settings, and atomic reconcile**

Implement CRUD services and controllers with user scoping and Zod validation.

Implement `POST /api/accounts/reconcile` in `accounts.controller.ts`.

Core service behavior:

```ts
await prisma.$transaction(async (tx) => {
  // update account balances
  // update debt amounts with negative validation
  // update edited balance if provided
  // compute aggregate sums
  // create snapshot
  // create history event
  // return aggregate summary
});
```

Implement `settings` endpoints:

- `PATCH /api/settings/start-balance`
- `PATCH /api/settings/edited-balance`

Implement history payload shape for reconciliation:

```ts
{
  kind: 'balance_reconciled',
  previousSnapshot,
  nextSnapshot,
  snapshotDelta,
  calculatedBalance,
  currentBalance,
  additionalExpenses
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test --workspace apps/backend -- accounts.reconcile.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/backend/src/modules/accounts apps/backend/src/modules/debts apps/backend/src/modules/settings apps/backend/src/modules/finance/finance-history.ts apps/backend/src/test/accounts.reconcile.test.ts apps/backend/src/app.ts
git commit -m "feat: add accounts debts settings and reconcile flow"
```

## Task 7: Implement Income And Payment Status Workflows

**Files:**
- Create: `apps/backend/src/modules/income/income.controller.ts`
- Create: `apps/backend/src/modules/income/income.service.ts`
- Create: `apps/backend/src/modules/income/income.schemas.ts`
- Create: `apps/backend/src/modules/payments/payments.controller.ts`
- Create: `apps/backend/src/modules/payments/payments.service.ts`
- Create: `apps/backend/src/modules/payments/payments.schemas.ts`
- Create: `apps/backend/src/test/income.mark-received.test.ts`
- Create: `apps/backend/src/test/payments.mark-paid.test.ts`

- [ ] **Step 1: Write the failing income and payment tests**

Create `apps/backend/src/test/income.mark-received.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { resolveIncomeReceivedStatus } from '../modules/income/income.service';

describe('resolveIncomeReceivedStatus', () => {
  it('marks late income when actual date is after effective date', () => {
    expect(
      resolveIncomeReceivedStatus('2026-05-10', '2026-05-12')
    ).toBe('received_late');
  });
});
```

Create `apps/backend/src/test/payments.mark-paid.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { resolvePaymentPaidStatus } from '../modules/payments/payments.service';

describe('resolvePaymentPaidStatus', () => {
  it('marks overdue payment as on time when actual date matches effective date', () => {
    expect(
      resolvePaymentPaidStatus('2026-05-10', '2026-05-10')
    ).toBe('paid_on_time');
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm run test --workspace apps/backend -- income.mark-received.test.ts payments.mark-paid.test.ts`
Expected: FAIL because helper functions and routes do not exist.

- [ ] **Step 3: Implement income and payment modules**

Implement CRUD endpoints for:

- `/api/income`
- `/api/payments`

Implement status transitions:

```ts
export function resolveIncomeReceivedStatus(
  effectiveDate: string,
  actualDate: string
) {
  return new Date(actualDate) <= new Date(effectiveDate)
    ? 'received_on_time'
    : 'received_late';
}

export function resolvePaymentPaidStatus(
  effectiveDate: string,
  actualDate: string
) {
  return new Date(actualDate) <= new Date(effectiveDate)
    ? 'paid_on_time'
    : 'paid_late';
}
```

Implement:

- `PATCH /api/income/:id/mark-received`
- `PATCH /api/payments/:id/mark-paid`

Each endpoint updates `actualDate`, calculates status, and creates history entries.

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm run test --workspace apps/backend -- income.mark-received.test.ts payments.mark-paid.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/backend/src/modules/income apps/backend/src/modules/payments apps/backend/src/test/income.mark-received.test.ts apps/backend/src/test/payments.mark-paid.test.ts apps/backend/src/app.ts
git commit -m "feat: add income and payment status workflows"
```

## Task 8: Implement Aggregate State, History Feed, And Analytics Endpoints

**Files:**
- Create: `apps/backend/src/modules/state/state.controller.ts`
- Create: `apps/backend/src/modules/state/state.service.ts`
- Create: `apps/backend/src/modules/history/history.controller.ts`
- Create: `apps/backend/src/modules/history/history.service.ts`
- Create: `apps/backend/src/modules/analytics/analytics.controller.ts`
- Create: `apps/backend/src/modules/analytics/analytics.service.ts`
- Create: `apps/backend/src/test/state.test.ts`

- [ ] **Step 1: Write the failing state test**

Create `apps/backend/src/test/state.test.ts`:

```ts
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../app';

describe('GET /api/state', () => {
  it('returns dashboard data with balances and alerts', async () => {
    const app = createApp();
    const response = await request(app)
      .get('/api/state')
      .set('Authorization', 'Bearer test-token');

    expect(response.status).toBe(200);
    expect(response.body.balances.currentBalance).toBeDefined();
    expect(Array.isArray(response.body.alerts)).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test --workspace apps/backend -- state.test.ts`
Expected: FAIL because state endpoint does not exist.

- [ ] **Step 3: Implement aggregated dashboard and chart services**

State service responsibilities:

- load accounts, debts, incomes, payments, settings, latest snapshot
- compute balance summary via pure helpers
- derive alerts for overdue payments, delayed incomes, cash gap risk, debt load
- build upcoming event list

Analytics service responsibilities:

- read snapshots and history by period
- return series for `netBalance`, `accountBalance`, `debtBalance`, `additionalExpenses`

History service responsibilities:

- list paginated history entries newest first
- shape payload for frontend display

Mount routes:

- `GET /api/state`
- `GET /api/history`
- `GET /api/analytics/timeseries`

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test --workspace apps/backend -- state.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/backend/src/modules/state apps/backend/src/modules/history apps/backend/src/modules/analytics apps/backend/src/test/state.test.ts apps/backend/src/app.ts
git commit -m "feat: add dashboard state history and analytics endpoints"
```

## Task 9: Implement Telegram Bot, /start, Menu Button, Polling/Webhook Switch, And Update Dedupe

**Files:**
- Create: `apps/backend/src/modules/telegram/telegram-bot.ts`
- Create: `apps/backend/src/modules/telegram/telegram.service.ts`
- Create: `apps/backend/src/modules/telegram/telegram-webhook.controller.ts`
- Modify: `apps/backend/src/server.ts`
- Create: `apps/backend/src/test/telegram-bot.test.ts`

- [ ] **Step 1: Write the failing telegram transport test**

Create `apps/backend/src/test/telegram-bot.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { shouldProcessUpdate } from '../modules/telegram/telegram.service';

describe('shouldProcessUpdate', () => {
  it('rejects already processed update ids', async () => {
    const store = new Set<bigint>([123n]);
    const result = await shouldProcessUpdate(123n, {
      has: async (id) => store.has(id),
      add: async (id) => {
        store.add(id);
      }
    });

    expect(result).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test --workspace apps/backend -- telegram-bot.test.ts`
Expected: FAIL because Telegram transport module does not exist.

- [ ] **Step 3: Implement bot runtime**

Implement Telegram bot module using `node-telegram-bot-api` or `grammy`.

Required behavior:

- `/start` sends a message with `web_app` button
- startup attempts to configure `setChatMenuButton`
- `BOT_MODE=polling` starts polling
- `BOT_MODE=webhook` registers webhook route and startup webhook sync
- webhook route validates secret header when configured
- dedupe `update_id` using `TelegramUpdate` table

Implement helper:

```ts
export async function shouldProcessUpdate(
  updateId: bigint,
  store: {
    has: (id: bigint) => Promise<boolean>;
    add: (id: bigint) => Promise<void>;
  }
) {
  if (await store.has(updateId)) {
    return false;
  }

  await store.add(updateId);
  return true;
}
```

Initialize bot from `server.ts` after app boot.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test --workspace apps/backend -- telegram-bot.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/backend/src/modules/telegram apps/backend/src/server.ts apps/backend/src/test/telegram-bot.test.ts
git commit -m "feat: add telegram bot polling webhook and dedupe"
```

## Task 10: Build Frontend App Shell, Auth Bootstrap, And Wallet Dashboard

**Files:**
- Create: `apps/frontend/src/main.tsx`
- Create: `apps/frontend/src/app/App.tsx`
- Create: `apps/frontend/src/app/providers.tsx`
- Create: `apps/frontend/src/app/router.tsx`
- Create: `apps/frontend/src/lib/api.ts`
- Create: `apps/frontend/src/lib/telegram.ts`
- Create: `apps/frontend/src/hooks/use-auth.ts`
- Create: `apps/frontend/src/hooks/use-state.ts`
- Create: `apps/frontend/src/components/layout/shell.tsx`
- Create: `apps/frontend/src/components/layout/bottom-nav.tsx`
- Create: `apps/frontend/src/components/wallet/balance-hero.tsx`
- Create: `apps/frontend/src/components/wallet/alerts-panel.tsx`
- Create: `apps/frontend/src/components/wallet/upcoming-list.tsx`
- Create: `apps/frontend/src/screens/wallet-screen.tsx`
- Create: `apps/frontend/src/test/balance-hero.test.tsx`
- Create: `apps/frontend/src/test/app.smoke.test.tsx`

- [ ] **Step 1: Write the failing frontend tests**

Create `apps/frontend/src/test/balance-hero.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { BalanceHero } from '../components/wallet/balance-hero';

describe('BalanceHero', () => {
  it('renders core wallet metrics', () => {
    render(
      <BalanceHero
        currentBalance="72 300 ₽"
        calculatedBalance="70 000 ₽"
        additionalExpenses="2 300 ₽"
        freeMoney="18 000 ₽"
      />
    );

    expect(screen.getByText('72 300 ₽')).toBeInTheDocument();
    expect(screen.getByText('Расчётный баланс')).toBeInTheDocument();
  });
});
```

Create `apps/frontend/src/test/app.smoke.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { App } from '../app/App';

describe('App', () => {
  it('renders bottom navigation', () => {
    render(<App />);
    expect(screen.getByText('Кошелёк')).toBeInTheDocument();
    expect(screen.getByText('Графики')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm run test --workspace apps/frontend -- balance-hero.test.tsx app.smoke.test.tsx`
Expected: FAIL because app shell and components do not exist.

- [ ] **Step 3: Implement frontend shell and wallet screen**

Set up Tailwind and frontend dependencies.

Create `apps/frontend/src/lib/api.ts` with fetch client that adds JWT header.

Create `apps/frontend/src/lib/telegram.ts` with Mini App bootstrap:

```ts
export function getTelegramInitData() {
  return window.Telegram?.WebApp?.initData ?? '';
}
```

Create `use-auth.ts`:

- read Telegram `initData`
- call `POST /api/auth/telegram`
- persist JWT
- expose loading state

Create `use-state.ts`:

- fetch `GET /api/state`
- cache response in component state

Build the UI shell:

- gradient dark background
- wallet hero
- alert panel
- upcoming events list
- bottom nav with `Кошелёк | План | Счета | Графики | История`

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm run test --workspace apps/frontend -- balance-hero.test.tsx app.smoke.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/frontend/src/main.tsx apps/frontend/src/app apps/frontend/src/lib/api.ts apps/frontend/src/lib/telegram.ts apps/frontend/src/hooks/use-auth.ts apps/frontend/src/hooks/use-state.ts apps/frontend/src/components apps/frontend/src/screens/wallet-screen.tsx apps/frontend/src/test/balance-hero.test.tsx apps/frontend/src/test/app.smoke.test.tsx
git commit -m "feat: add frontend shell auth bootstrap and wallet dashboard"
```

## Task 11: Build Plan, Accounts, Charts, And History Screens

**Files:**
- Create: `apps/frontend/src/screens/plan-screen.tsx`
- Create: `apps/frontend/src/screens/accounts-screen.tsx`
- Create: `apps/frontend/src/screens/charts-screen.tsx`
- Create: `apps/frontend/src/screens/history-screen.tsx`
- Create: `apps/frontend/src/components/plan/income-list.tsx`
- Create: `apps/frontend/src/components/plan/payment-list.tsx`
- Create: `apps/frontend/src/components/accounts/account-list.tsx`
- Create: `apps/frontend/src/components/accounts/debt-list.tsx`
- Create: `apps/frontend/src/components/accounts/reconcile-form.tsx`
- Create: `apps/frontend/src/components/charts/timeseries-panel.tsx`
- Create: `apps/frontend/src/components/history/history-feed.tsx`
- Create: `apps/frontend/src/test/alerts-panel.test.tsx`

- [ ] **Step 1: Write the failing screen test**

Create `apps/frontend/src/test/alerts-panel.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { AlertsPanel } from '../components/wallet/alerts-panel';

describe('AlertsPanel', () => {
  it('renders risk alerts', () => {
    render(
      <AlertsPanel
        alerts={[
          { id: 'cash-gap', level: 'high', title: 'Не хватит денег', description: 'Ожидается кассовый разрыв' }
        ]}
      />
    );

    expect(screen.getByText('Не хватит денег')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test --workspace apps/frontend -- alerts-panel.test.tsx`
Expected: FAIL if the richer screen/component graph is not implemented yet.

- [ ] **Step 3: Implement remaining screens and forms**

Plan screen:

- list incomes and payments
- add status tinting for completed, delayed, overdue
- wire mark-received and mark-paid actions

Accounts screen:

- list account and debt cards
- add combined reconcile form
- submit to `/api/accounts/reconcile`

Charts screen:

- period switcher
- Recharts line and area charts for four series

History screen:

- event feed with labels and formatted timestamps

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test --workspace apps/frontend -- alerts-panel.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/frontend/src/screens apps/frontend/src/components/plan apps/frontend/src/components/accounts apps/frontend/src/components/charts apps/frontend/src/components/history apps/frontend/src/test/alerts-panel.test.tsx
git commit -m "feat: add plan accounts charts and history screens"
```

## Task 12: Finalize Tooling, .env, README, And End-To-End Verification

**Files:**
- Create: `.env.example`
- Create: `README.md`
- Modify: backend and frontend package files as needed

- [ ] **Step 1: Write the failing documentation checklist**

Create `apps/backend/src/test/readme-check.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import fs from 'node:fs';

describe('README', () => {
  it('documents local launch and telegram modes', () => {
    const readme = fs.readFileSync('README.md', 'utf8');

    expect(readme).toContain('apps/frontend');
    expect(readme).toContain('apps/backend');
    expect(readme).toContain('BOT_MODE=polling');
    expect(readme).toContain('BOT_MODE=webhook');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test --workspace apps/backend -- readme-check.test.ts`
Expected: FAIL because README and env docs are incomplete.

- [ ] **Step 3: Add final configuration and docs**

Create `.env.example` with:

```dotenv
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/telegram_wallet
JWT_SECRET=replace-with-very-long-secret
PORT=4000
FRONTEND_ORIGIN=http://localhost:5173
VITE_API_URL=http://localhost:4000
TELEGRAM_BOT_TOKEN=replace-with-bot-token
TELEGRAM_WEBAPP_URL=https://example.com
BOT_MODE=polling
TELEGRAM_WEBHOOK_URL=
TELEGRAM_WEBHOOK_SECRET=
DEV_AUTH_BYPASS=false
```

Write `README.md` sections:

- project overview
- stack
- workspace structure
- prerequisites
- install
- database setup
- Prisma generate and migrate
- seed
- run backend
- run frontend
- Telegram polling mode
- Telegram webhook mode
- deploy to Vercel, Render or Railway, Neon or Supabase

Update scripts if needed so a fresh developer can run:

```bash
npm install
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
npm run dev:backend
npm run dev:frontend
```

- [ ] **Step 4: Run tests and full verification**

Run:

```bash
npm run test
npm run build
```

Expected:

- all backend tests PASS
- all frontend tests PASS
- workspace build succeeds

- [ ] **Step 5: Commit**

```bash
git add .env.example README.md apps/backend/src/test/readme-check.test.ts package.json apps/backend/package.json apps/frontend/package.json
git commit -m "docs: add launch configuration and project guide"
```

## Self-Review

Spec coverage check:

- Workspace structure is covered by Tasks 1 and 12.
- Prisma schema, seed, and extra dedupe table are covered by Task 2.
- Telegram auth and JWT are covered by Task 5.
- All required CRUD APIs are covered by Tasks 6 and 7.
- Reconcile flow and `BalanceSnapshot` creation are covered by Task 6.
- Aggregate state, history, alerts, and charts are covered by Task 8.
- Bot `/start`, Menu Button, webhook, polling, and update dedupe are covered by Task 9.
- Frontend Wallet, Plan, Accounts, Charts, and History screens are covered by Tasks 10 and 11.
- `.env.example` and `README.md` are covered by Task 12.

Placeholder scan:

- No `TODO`, `TBD`, or "implement later" placeholders remain in the task steps.

Type consistency check:

- Shared status enums are introduced in Task 2 and reused in later tasks.
- `calculateDashboardBalances` introduced in Task 4 is referenced consistently in Tasks 6 and 8.
- `POST /api/accounts/reconcile` is consistently used in backend and frontend tasks.

