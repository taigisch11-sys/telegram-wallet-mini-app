# Telegram Wallet UX Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the Telegram Mini App UI to feel close to Telegram Wallet while preserving existing finance data flows.

**Architecture:** Keep the current React component boundaries. Update the shell, wallet hero, home screen rows, and shared cards/styles only; API, auth, persistence, and business logic stay unchanged.

**Tech Stack:** React, Vite, TypeScript, TailwindCSS, lucide-react.

---

### Task 1: Wallet-Like Shell

**Files:**
- Modify: `apps/frontend/src/components/layout/shell.tsx`
- Modify: `apps/frontend/src/app/styles.css`

- [ ] Replace the current header with a centered Telegram-style title, mini-app subtitle, close/more affordances, and a rounded glass dock navigation.
- [ ] Keep navigation labels Russian and retain all current screen IDs.
- [ ] Run `npm run test --workspace @wallet/frontend`.

### Task 2: Main Wallet Surface

**Files:**
- Modify: `apps/frontend/src/components/wallet/balance-hero.tsx`
- Modify: `apps/frontend/src/screens/wallet-screen.tsx`
- Modify: `apps/frontend/src/components/wallet/upcoming-list.tsx`
- Modify: `apps/frontend/src/components/wallet/alerts-panel.tsx`
- Modify: `apps/frontend/src/components/common/card.tsx`

- [ ] Rebuild the balance section around a centered large balance and Telegram Wallet-like quick action buttons.
- [ ] Add asset-like account and debt rows with round icons, right-aligned amounts, and pill surfaces.
- [ ] Keep empty states clear for new users with zero balances and no demo data.
- [ ] Run `npm run build --workspace @wallet/frontend`.

### Task 3: Publish

**Files:**
- Commit changed frontend files and this plan.

- [ ] Run full `npm run test` and `npm run build`.
- [ ] Commit changes.
- [ ] Push to `master` and watch GitHub Pages deploy.
