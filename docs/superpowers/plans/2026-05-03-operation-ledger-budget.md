# Operation Ledger Budget Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move the app toward an account operation journal while keeping the existing MVP usable: transfers and debt repayments become first-class operations, monthly payment schedules are easy to create, and duplicate Telegram chrome is removed.

**Architecture:** Add shared operation and planned-operation types, pure ledger helpers, and compatible UI/API surfaces. Existing `Income` and `Payment` remain supported while new `PlannedOperation` and `Operation` records become the preferred source for budget/timeline behavior.

**Tech Stack:** React + Vite + TypeScript, TailwindCSS, Node/Express, Cloudflare Worker, Prisma, PostgreSQL, Vitest.

---

### Task 1: Ledger Helpers

**Files:**
- Create: `packages/shared/src/ledger.ts`
- Modify: `packages/shared/src/enums.ts`
- Modify: `packages/shared/src/types.ts`
- Modify: `packages/shared/src/schemas.ts`
- Modify: `packages/shared/src/index.ts`
- Test: `apps/backend/src/test/operation-ledger.test.ts`

- [ ] **Step 1: Write failing tests for debt repayment and monthly schedules**

```ts
import { describe, expect, it } from "vitest";
import { applyOperationEntries, generateMonthlySchedule } from "@wallet/shared";

describe("operation ledger helpers", () => {
  it("applies a debt repayment without changing net worth", () => {
    const result = applyOperationEntries(
      { accounts: [{ id: "card", balance: 50000 }], debts: [{ id: "credit", amount: -30000 }] },
      [
        { targetType: "account", targetId: "card", amount: -10000 },
        { targetType: "debt", targetId: "credit", amount: 10000 }
      ]
    );

    expect(result.accounts[0].balance).toBe(40000);
    expect(result.debts[0].amount).toBe(-20000);
    expect(result.netDelta).toBe(0);
  });

  it("generates monthly payments with a different final amount", () => {
    const rows = generateMonthlySchedule({
      startDate: "2026-05-22",
      count: 11,
      amount: "15485",
      finalAmount: "12500"
    });

    expect(rows).toHaveLength(11);
    expect(rows[0]).toMatchObject({ plannedDate: "2026-05-22", amount: "15485.00" });
    expect(rows[10]).toMatchObject({ plannedDate: "2027-03-22", amount: "12500.00" });
  });
});
```

- [ ] **Step 2: Run `npm run test --workspace @wallet/backend -- operation-ledger.test.ts` and confirm RED**

Expected failure: `applyOperationEntries` and `generateMonthlySchedule` are not exported.

- [ ] **Step 3: Implement the shared helpers and types**

Create enum values for operation kinds, DTOs for actual and planned operations, schemas for planned operation creation, and pure functions for schedule generation and applying ledger entries.

- [ ] **Step 4: Run the backend ledger test and confirm GREEN**

Run: `npm run test --workspace @wallet/backend -- operation-ledger.test.ts`

### Task 2: Backend And Worker Compatibility

**Files:**
- Modify: `prisma/schema.prisma`
- Create: `prisma/migrations/20260503160000_operation_ledger/migration.sql`
- Modify: `apps/backend/src/app.ts`
- Create: `apps/backend/src/modules/operations/operations.controller.ts`
- Create: `apps/backend/src/modules/operations/operations.service.ts`
- Create: `apps/backend/src/modules/planned-operations/planned-operations.controller.ts`
- Create: `apps/backend/src/modules/planned-operations/planned-operations.service.ts`
- Modify: `apps/backend/src/modules/state/state.service.ts`
- Modify: `apps/worker/src/index.ts`
- Modify: `apps/worker/src/state.ts`

- [ ] **Step 1: Add Prisma models**

Add `Operation`, `OperationEntry`, `PlannedOperation`, and `OperationSeries` with user ownership, planned status, kind, optional source account and target debt fields.

- [ ] **Step 2: Add API routes**

Expose:
- `GET /api/operations`
- `POST /api/operations`
- `GET /api/planned-operations`
- `POST /api/planned-operations`
- `POST /api/planned-operations/series`
- `PATCH /api/planned-operations/:id/mark-done`
- `DELETE /api/planned-operations/:id`

- [ ] **Step 3: Keep old income/payment endpoints working**

When marking old income/payment as done, also create a journal operation so timeline/history can move to operations gradually.

- [ ] **Step 4: Mirror the same behavior in the Worker API**

Use raw SQL in `apps/worker/src/state.ts` and routes in `apps/worker/src/index.ts` so the published Cloudflare API supports the new UI.

### Task 3: Frontend UX

**Files:**
- Modify: `apps/frontend/src/components/layout/shell.tsx`
- Modify: `apps/frontend/src/app/App.tsx`
- Modify: `apps/frontend/src/screens/plan-screen.tsx`
- Modify: `apps/frontend/src/components/wallet/finance-timeline.tsx`
- Modify: `apps/frontend/src/lib/api.ts`
- Modify: `apps/frontend/src/lib/local-finance.ts`
- Test: `apps/frontend/src/test/app.smoke.test.tsx`
- Test: `apps/frontend/src/test/plan-screen.test.tsx`
- Test: `apps/frontend/src/test/timeline.test.tsx`

- [ ] **Step 1: Replace duplicate internal Telegram chrome**

The top app area should show the selected period and a `+` quick action instead of `Закрыть` and a second menu button. The bottom navigation remains the only menu entry.

- [ ] **Step 2: Add a lightweight schedule builder**

Payment and debt-repayment creation get an expandable `Создать график` block with count, monthly cadence, and optional different final payment.

- [ ] **Step 3: Add debt repayment as a visible plan item type**

The user can choose a source account and target debt. Completing it decreases the source account and increases the debt balance.

- [ ] **Step 4: Show operation-aware timeline**

Fixed actual operations appear on the exact actual date. Unallocated movement remains distributed between reconciliations.

### Task 4: Verification And Publish

**Files:**
- No new source files unless tests reveal defects.

- [ ] **Step 1: Run focused tests**

Run:
- `npm run test --workspace @wallet/backend -- operation-ledger.test.ts`
- `npm run test --workspace @wallet/frontend -- plan-screen.test.tsx app.smoke.test.tsx timeline.test.tsx`

- [ ] **Step 2: Run full verification**

Run:
- `npm run test`
- `npm run build`
- `git diff --check`

- [ ] **Step 3: Commit and push only intended files**

Run:
- `git status --short`
- `git add` only touched project files
- `git commit -m "Add operation ledger planning flow"`
- `git push`
