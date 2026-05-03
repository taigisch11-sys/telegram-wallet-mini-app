import { Hono } from "hono";
import { cors } from "hono/cors";
import { z } from "zod";
import { markDoneSchema, settingsEditedBalanceSchema, settingsStartBalanceSchema } from "@wallet/shared";
import { authUser, findOrCreateUser, requireAuth, signToken } from "./auth";
import { id, sql } from "./db";
import type { WorkerEnv } from "./env";
import {
  createAccount,
  createDebt,
  createIncome,
  createPayment,
  dashboardState,
  deleteAccount,
  deleteDebt,
  deleteIncome,
  deletePayment,
  history,
  reconcile,
  timeseries,
  updateIncome,
  updatePayment
} from "./state";
import { verifyTelegramInitData } from "./telegram";

type AppEnv = {
  Bindings: WorkerEnv;
  Variables: {
    user: Awaited<ReturnType<typeof findOrCreateUser>>;
  };
};

const app = new Hono<AppEnv>();

app.use(
  "*",
  cors({
    origin: (origin, c) => {
      const allowed = [c.env.FRONTEND_ORIGIN, "http://localhost:5173", "http://127.0.0.1:5173"].filter(Boolean);
      return allowed.includes(origin) ? origin : allowed[0] ?? origin;
    },
    allowHeaders: ["Content-Type", "Authorization", "X-Telegram-Bot-Api-Secret-Token"],
    allowMethods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    credentials: false
  })
);

app.onError((error, c) => {
  if (error instanceof z.ZodError) {
    return c.json({ error: { message: "Некорректные данные", details: error.flatten() } }, 400);
  }
  return c.json({ error: { message: error.message || "Внутренняя ошибка" } }, 500);
});

app.get("/health", (c) => c.json({ ok: true }));

app.post("/api/auth/telegram", async (c) => {
  const body = await c.req.json<{ initData?: string }>();
  if (!body.initData) return c.json({ error: { message: "Не переданы данные Telegram" } }, 400);

  const telegramUser = await verifyTelegramInitData(body.initData, c.env.TELEGRAM_BOT_TOKEN);
  const user = await findOrCreateUser(c.env, {
    telegramId: String(telegramUser.id),
    username: telegramUser.username ?? null,
    firstName: telegramUser.first_name ?? null
  });
  const token = await signToken(c.env, user.id);
  return c.json({ token });
});

app.use("/api/*", async (c, next) => {
  if (c.req.path === "/api/telegram/webhook") {
    await next();
    return;
  }
  return requireAuth(c, next);
});

app.get("/api/state", async (c) => {
  const user = await authUser(c);
  return c.json(await dashboardState(c.env, user.id));
});

app.get("/api/accounts", async (c) => {
  const user = await authUser(c);
  return c.json((await dashboardState(c.env, user.id)).accounts);
});

app.post("/api/accounts", async (c) => {
  const user = await authUser(c);
  const account = await createAccount(c.env, user.id, await c.req.json());
  await sql(c.env)`
    INSERT INTO "History" (id, "userId", type, payload, "createdAt")
    VALUES (${id()}, ${user.id}, 'account_created', ${JSON.stringify(account)}, NOW())
  `;
  return c.json(account, 201);
});

app.patch("/api/accounts/:id", async (c) => {
  const user = await authUser(c);
  const body = await c.req.json<{ name?: string; balance?: string | number }>();
  const rows = await sql(c.env)`
    UPDATE "Account"
    SET name = COALESCE(${body.name ?? null}, name), balance = COALESCE(${body.balance === undefined ? null : String(body.balance)}, balance)
    WHERE id = ${c.req.param("id")} AND "userId" = ${user.id}
    RETURNING id, name, balance, "createdAt"
  `;
  return c.json(rows[0] ?? null);
});

app.delete("/api/accounts/:id", async (c) => {
  const user = await authUser(c);
  return c.json(await deleteAccount(c.env, user.id, c.req.param("id")));
});

app.post("/api/accounts/reconcile", async (c) => {
  const user = await authUser(c);
  return c.json(await reconcile(c.env, user.id, await c.req.json()));
});

app.get("/api/debts", async (c) => {
  const user = await authUser(c);
  return c.json((await dashboardState(c.env, user.id)).debts);
});

app.post("/api/debts", async (c) => {
  const user = await authUser(c);
  const debt = await createDebt(c.env, user.id, await c.req.json());
  await sql(c.env)`
    INSERT INTO "History" (id, "userId", type, payload, "createdAt")
    VALUES (${id()}, ${user.id}, 'debt_created', ${JSON.stringify(debt)}, NOW())
  `;
  return c.json(debt, 201);
});

app.patch("/api/debts/:id", async (c) => {
  const user = await authUser(c);
  const body = await c.req.json<{ name?: string; amount?: string | number }>();
  const rows = await sql(c.env)`
    UPDATE "Debt"
    SET name = COALESCE(${body.name ?? null}, name), amount = COALESCE(${body.amount === undefined ? null : String(body.amount)}, amount)
    WHERE id = ${c.req.param("id")} AND "userId" = ${user.id}
    RETURNING id, name, amount, "createdAt"
  `;
  return c.json(rows[0] ?? null);
});

app.delete("/api/debts/:id", async (c) => {
  const user = await authUser(c);
  return c.json(await deleteDebt(c.env, user.id, c.req.param("id")));
});

app.get("/api/income", async (c) => {
  const user = await authUser(c);
  return c.json((await dashboardState(c.env, user.id)).income);
});

app.post("/api/income", async (c) => {
  const user = await authUser(c);
  return c.json(await createIncome(c.env, user.id, await c.req.json()), 201);
});

app.patch("/api/income/:id", async (c) => {
  const user = await authUser(c);
  return c.json(await updateIncome(c.env, user.id, c.req.param("id"), await c.req.json()));
});

app.patch("/api/income/:id/mark-received", async (c) => {
  const user = await authUser(c);
  const body = markDoneSchema.parse(await c.req.json().catch(() => ({})));
  await sql(c.env)`
    UPDATE "Income"
    SET status = CASE WHEN "plannedDate"::date >= CURRENT_DATE THEN 'received_on_time'::"IncomeStatus" ELSE 'received_late'::"IncomeStatus" END,
        "actualDate" = ${body.actualDate ? new Date(body.actualDate).toISOString() : new Date().toISOString()}
    WHERE id = ${c.req.param("id")} AND "userId" = ${user.id}
  `;
  await sql(c.env)`INSERT INTO "History" (id, "userId", type, payload, "createdAt") VALUES (${id()}, ${user.id}, 'income_received', ${JSON.stringify({ id: c.req.param("id") })}, NOW())`;
  return c.json({ ok: true });
});

app.delete("/api/income/:id", async (c) => {
  const user = await authUser(c);
  return c.json(await deleteIncome(c.env, user.id, c.req.param("id")));
});

app.get("/api/payments", async (c) => {
  const user = await authUser(c);
  return c.json((await dashboardState(c.env, user.id)).payments);
});

app.post("/api/payments", async (c) => {
  const user = await authUser(c);
  return c.json(await createPayment(c.env, user.id, await c.req.json()), 201);
});

app.patch("/api/payments/:id", async (c) => {
  const user = await authUser(c);
  return c.json(await updatePayment(c.env, user.id, c.req.param("id"), await c.req.json()));
});

app.patch("/api/payments/:id/mark-paid", async (c) => {
  const user = await authUser(c);
  const body = markDoneSchema.parse(await c.req.json().catch(() => ({})));
  await sql(c.env)`
    UPDATE "Payment"
    SET status = CASE WHEN "plannedDate"::date >= CURRENT_DATE THEN 'paid_on_time'::"PaymentStatus" ELSE 'paid_late'::"PaymentStatus" END,
        "actualDate" = ${body.actualDate ? new Date(body.actualDate).toISOString() : new Date().toISOString()}
    WHERE id = ${c.req.param("id")} AND "userId" = ${user.id}
  `;
  await sql(c.env)`INSERT INTO "History" (id, "userId", type, payload, "createdAt") VALUES (${id()}, ${user.id}, 'payment_paid', ${JSON.stringify({ id: c.req.param("id") })}, NOW())`;
  return c.json({ ok: true });
});

app.delete("/api/payments/:id", async (c) => {
  const user = await authUser(c);
  return c.json(await deletePayment(c.env, user.id, c.req.param("id")));
});

app.patch("/api/settings/start-balance", async (c) => {
  const user = await authUser(c);
  const body = settingsStartBalanceSchema.parse(await c.req.json());
  await sql(c.env)`
    UPDATE "Settings"
    SET "startBalance" = ${body.startBalance}, "currentMonth" = COALESCE(${body.currentMonth ?? null}, "currentMonth")
    WHERE "userId" = ${user.id}
  `;
  return c.json({ ok: true });
});

app.patch("/api/settings/edited-balance", async (c) => {
  const user = await authUser(c);
  const body = settingsEditedBalanceSchema.parse(await c.req.json());
  await sql(c.env)`UPDATE "Settings" SET "editedBalance" = ${body.editedBalance} WHERE "userId" = ${user.id}`;
  return c.json({ ok: true });
});

app.get("/api/history", async (c) => {
  const user = await authUser(c);
  return c.json(await history(c.env, user.id));
});

app.get("/api/analytics/timeseries", async (c) => {
  const user = await authUser(c);
  return c.json(await timeseries(c.env, user.id));
});

type TelegramWebhookUpdate = {
  update_id: number;
  message?: {
    chat?: { id: number | string };
    text?: string;
  };
};

async function wasTelegramUpdateProcessed(env: WorkerEnv, updateId: number) {
  try {
    await sql(env)`
      INSERT INTO "TelegramUpdate" (id, "updateId", "processedAt")
      VALUES (${id()}, ${String(updateId)}, NOW())
    `;
    return false;
  } catch (error) {
    const code = typeof error === "object" && error !== null && "code" in error ? String(error.code) : null;
    if (code === "23505" || (error instanceof Error && error.message.includes("TelegramUpdate_updateId_key"))) {
      return true;
    }
    throw error;
  }
}

async function sendTelegramStartMessage(env: WorkerEnv, chatId: number | string) {
  const response = await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text: "Откройте Кошелёк, чтобы сверить баланс и план платежей.",
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: "Открыть Кошелёк",
              web_app: { url: env.TELEGRAM_WEBAPP_URL }
            }
          ]
        ]
      }
    })
  });

  if (!response.ok) {
    throw new Error("Не удалось отправить сообщение Telegram");
  }
}

app.post("/api/telegram/webhook", async (c) => {
  const expected = c.env.TELEGRAM_WEBHOOK_SECRET;
  if (expected && c.req.header("X-Telegram-Bot-Api-Secret-Token") !== expected) {
    return c.json({ ok: false }, 401);
  }

  const update = await c.req.json<TelegramWebhookUpdate>().catch(() => null);
  if (!update?.update_id || (await wasTelegramUpdateProcessed(c.env, update.update_id))) {
    return c.json({ ok: true });
  }

  const chatId = update.message?.chat?.id;
  if (chatId && update.message?.text?.startsWith("/start")) {
    await sendTelegramStartMessage(c.env, chatId);
  }

  return c.json({ ok: true });
});

export default app;
