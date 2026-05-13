import cors from "cors";
import express from "express";
import type TelegramBot from "node-telegram-bot-api";
import { env } from "./env";
import { errorHandler } from "./middleware/error-handler";
import { notFoundHandler } from "./middleware/not-found";
import { requireAuth } from "./middleware/auth";
import { accountsRouter } from "./modules/accounts/accounts.controller";
import { analyticsRouter } from "./modules/analytics/analytics.controller";
import { authRouter } from "./modules/auth/auth.controller";
import { categoriesRouter } from "./modules/categories/categories.controller";
import { debtsRouter } from "./modules/debts/debts.controller";
import { historyRouter } from "./modules/history/history.controller";
import { incomeRouter } from "./modules/income/income.controller";
import { operationsRouter } from "./modules/operations/operations.controller";
import { paymentsRouter } from "./modules/payments/payments.controller";
import { plannedOperationsRouter } from "./modules/planned-operations/planned-operations.controller";
import { settingsRouter } from "./modules/settings/settings.controller";
import { stateRouter } from "./modules/state/state.controller";
import { createTelegramWebhookRouter } from "./modules/telegram/telegram-webhook.controller";

export function createApp(bot: TelegramBot | null = null) {
  const app = express();
  app.use(cors({ origin: env.FRONTEND_ORIGIN, credentials: true }));
  app.use(express.json());

  app.get("/health", (_req, res) => res.json({ ok: true }));
  app.use("/api/auth", authRouter);
  app.use("/api/telegram", createTelegramWebhookRouter(bot));

  app.use("/api/state", requireAuth, stateRouter);
  app.use("/api/accounts", requireAuth, accountsRouter);
  app.use("/api/categories", requireAuth, categoriesRouter);
  app.use("/api/debts", requireAuth, debtsRouter);
  app.use("/api/income", requireAuth, incomeRouter);
  app.use("/api/payments", requireAuth, paymentsRouter);
  app.use("/api/operations", requireAuth, operationsRouter);
  app.use("/api/planned-operations", requireAuth, plannedOperationsRouter);
  app.use("/api/settings", requireAuth, settingsRouter);
  app.use("/api/history", requireAuth, historyRouter);
  app.use("/api/analytics", requireAuth, analyticsRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}
