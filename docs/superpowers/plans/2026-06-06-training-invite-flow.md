# Training Invite Flow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the MVP invite flow so a coach can create a Telegram invite link and a student can accept it into the coach-student workspace.

**Architecture:** The Cloudflare Worker remains the source of truth for production data. A new `TrainingInvite` table stores one-time invite codes, while frontend stores invite codes from URL parameters in `localStorage` until Telegram auth completes. The UI exposes a compact coach invite sheet and a student acceptance card without changing the existing demo/local fallback behavior.

**Tech Stack:** React + Vite + TypeScript frontend, Hono Cloudflare Worker, Neon Postgres via raw SQL, Prisma schema/migrations for database documentation and deploy compatibility, Vitest/Playwright for verification.

---

### Task 1: Database Contract

**Files:**
- Modify: `prisma/schema.prisma`
- Create: `prisma/migrations/20260606170000_training_invites/migration.sql`

- [ ] **Step 1: Add Prisma model**

Add `TrainingInvite` with fields: `id`, `coachId`, `code`, `status`, `expiresAt`, `createdAt`, `acceptedAt`, `acceptedByUserId`, relation to `TrainingUser` coach and accepted student.

- [ ] **Step 2: Add migration**

Create a backward-compatible SQL migration using `CREATE TABLE IF NOT EXISTS`, `CREATE UNIQUE INDEX IF NOT EXISTS`, and non-destructive indexes.

- [ ] **Step 3: Verify schema**

Run: `npm run prisma:generate`

Expected: Prisma client generation succeeds.

### Task 2: Worker Invite API

**Files:**
- Modify: `apps/worker/src/training.ts`

- [ ] **Step 1: Write expected API behavior**

Endpoints:
- `POST /training/api/invites`: coach only, creates an active invite with code and Telegram/startapp URL.
- `POST /training/api/invites/accept`: student only, accepts a code, creates `TrainingCoachStudent`, marks invite accepted.

- [ ] **Step 2: Implement validation**

Use zod schemas for create and accept payloads. Code must be short, URL-safe, unique, and case-insensitive on accept.

- [ ] **Step 3: Implement security checks**

Reject non-coach invite creation, self-acceptance, expired invite, already accepted invite, cancelled invite, and duplicate active coach-student link.

- [ ] **Step 4: Return fresh state**

Both endpoints should return `trainingState(env, user)` plus invite metadata where useful for frontend.

- [ ] **Step 5: Verify Worker types**

Run: `npm run lint --workspace @wallet/worker`

Expected: TypeScript exits 0.

### Task 3: Frontend Invite UX

**Files:**
- Modify: `apps/training/src/App.tsx`
- Modify: `apps/training/src/styles.css`

- [ ] **Step 1: Add frontend types and API methods**

Add invite-related types and methods: `createInvite`, `acceptInvite`, URL invite extraction, and persistent local invite code.

- [ ] **Step 2: Add coach UI**

Add a compact button/card in coach home/admin/menu: "Пригласить ученика". Show generated Telegram link, copy action, expiry hint, and fallback manual code.

- [ ] **Step 3: Add student UI**

When invite code exists, show a top card: coach invitation pending, accept button, error/success states. In local/demo mode, make the card educational and do not pretend data is saved remotely.

- [ ] **Step 4: Keep demo safe**

Demo mode must keep visual sample data and never write real invite data.

### Task 4: Regression Tests

**Files:**
- Modify: `apps/training/src/App.test.tsx`

- [ ] **Step 1: Add coach invite UI test**

Mock successful `/training/api/invites` response and assert link/code appear after clicking "Пригласить ученика".

- [ ] **Step 2: Add student accept test**

Seed URL/localStorage invite code, mock successful `/training/api/invites/accept`, click accept, assert accepted state and coach/student relationship appears.

- [ ] **Step 3: Add failure-state test**

Mock expired/already-used response and assert clear Russian error copy.

- [ ] **Step 4: Verify tests**

Run: `npm run test --workspace @training/frontend -- --run`

Expected: all training tests pass.

### Task 5: Release Verification

**Files:**
- Modify: `docs/training-release-roadmap.md`

- [ ] **Step 1: Run local gates**

Run:
- `npm run lint --workspace @training/frontend`
- `npm run test --workspace @training/frontend -- --run`
- `npm run build --workspace @training/frontend`
- `npm run lint --workspace @wallet/worker`

- [ ] **Step 2: Deploy in safe order**

Deploy Worker with migration-ready code, ensure database table exists, then deploy GitHub Pages frontend.

- [ ] **Step 3: Run production smoke**

Check:
- training URL returns 200
- `/training/health` returns ok
- coach invite UI renders
- student invite card renders with `?invite=<code>`
- console issues are empty

- [ ] **Step 4: Update roadmap**

Mark completed items under Stage 2 only after production smoke passes.
