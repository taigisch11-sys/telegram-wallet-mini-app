# Cloudflare Worker Backend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a Cloudflare Workers backend that can serve the Telegram Wallet Mini App for free while keeping Neon as PostgreSQL storage.

**Architecture:** Keep the existing Express backend intact. Add `apps/worker` as a Hono-based Worker using `@neondatabase/serverless` for SQL access, `jose` for JWT, shared schemas/types, and CORS for GitHub Pages. Implement the core API surface used by the frontend first, with webhook-ready Telegram auth.

**Tech Stack:** Cloudflare Workers, Hono, Neon serverless SQL, TypeScript, jose, zod, wrangler.

---

### Task 1: Scaffold Worker package

**Files:**
- Create: `apps/worker/package.json`
- Create: `apps/worker/tsconfig.json`
- Create: `apps/worker/wrangler.toml.example`
- Modify: `package.json`

- [ ] Add workspace package `@wallet/worker` with scripts `dev`, `build`, `test`, and `deploy`.
- [ ] Add Worker dependencies: `hono`, `@neondatabase/serverless`, `jose`.
- [ ] Add dev dependency: `wrangler`.
- [ ] Add root script `deploy:worker`.

### Task 2: Implement Worker foundation

**Files:**
- Create: `apps/worker/src/env.ts`
- Create: `apps/worker/src/http.ts`
- Create: `apps/worker/src/auth.ts`
- Create: `apps/worker/src/db.ts`
- Create: `apps/worker/src/index.ts`

- [ ] Define Worker env bindings: `DATABASE_URL`, `JWT_SECRET`, `TELEGRAM_BOT_TOKEN`, `FRONTEND_ORIGIN`, `TELEGRAM_WEBAPP_URL`, `TELEGRAM_WEBHOOK_SECRET`.
- [ ] Add CORS for GitHub Pages and local dev.
- [ ] Add JWT auth middleware with `test-token` only when explicitly enabled by env.
- [ ] Add `/health` route.

### Task 3: Implement state and account APIs

**Files:**
- Create: `apps/worker/src/money.ts`
- Create: `apps/worker/src/telegram.ts`
- Create: `apps/worker/src/state.ts`
- Modify: `apps/worker/src/index.ts`

- [ ] Implement Telegram `initData` verification.
- [ ] Implement user bootstrap and settings bootstrap.
- [ ] Implement `POST /api/auth/telegram`.
- [ ] Implement `GET /api/state`.
- [ ] Implement accounts and debts CRUD used by the frontend.
- [ ] Implement `POST /api/accounts/reconcile`.

### Task 4: Implement planning APIs

**Files:**
- Create: `apps/worker/src/planning.ts`
- Modify: `apps/worker/src/index.ts`

- [ ] Implement income and payment list/create/update/delete.
- [ ] Implement mark received/paid endpoints.
- [ ] Implement settings endpoints.
- [ ] Implement history list and analytics timeseries.

### Task 5: Deploy wiring and verification

**Files:**
- Modify: `.github/workflows/deploy-frontend-pages.yml`
- Create: `.github/workflows/deploy-worker.yml`
- Modify: `README.md`

- [ ] Add Cloudflare Worker deploy workflow using GitHub secrets.
- [ ] Document required Cloudflare secrets and variables.
- [ ] Run `npm run test`, `npm run build`, and `npm run build --workspace @wallet/worker`.
- [ ] Deploy Worker after Cloudflare auth is available.
- [ ] Set GitHub Pages variable `VITE_API_URL` to Worker URL and rerun Pages deploy.
