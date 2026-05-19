import { Hono } from "hono";
import { jwtVerify, SignJWT } from "jose";
import { z } from "zod";
import { id, sql } from "./db";
import type { WorkerEnv } from "./env";
import { verifyTelegramInitData } from "./telegram";

type Role = "coach" | "student";
type SessionStatus = "planned" | "in_progress" | "done" | "missed";

type TrainingUser = {
  id: string;
  telegramId: string;
  username: string | null;
  firstName: string | null;
  role: Role;
  createdAt: string;
};

const roleSchema = z.object({ role: z.enum(["coach", "student"]) });
const studentSchema = z.object({
  name: z.string().trim().min(2).max(80),
  goal: z.string().trim().min(1).max(160).default("Персональное ведение")
});
const statusSchema = z.object({ status: z.enum(["planned", "in_progress", "done", "missed"]) });
const messageSchema = z.object({
  body: z.string().trim().min(1).max(1200),
  studentId: z.string().nullable().optional(),
  context: z.string().nullable().optional()
});
const topUpSchema = z.object({
  amount: z.number().positive().max(1_000_000),
  note: z.string().trim().min(1).max(120),
  studentId: z.string().nullable().optional()
});
const templatePlanSchema = z.object({
  studentId: z.string().nullable().optional()
});

function trainingSecret(env: WorkerEnv) {
  if (!env.TRAINING_JWT_SECRET) throw new Error("TRAINING_JWT_SECRET is not configured");
  return new TextEncoder().encode(env.TRAINING_JWT_SECRET);
}

async function signTrainingToken(env: WorkerEnv, user: TrainingUser) {
  return new SignJWT({ sub: user.id, aud: "training", telegram_id: user.telegramId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(trainingSecret(env));
}

async function verifyTrainingToken(env: WorkerEnv, token: string) {
  const result = await jwtVerify(token, trainingSecret(env), { audience: "training" });
  return result.payload.sub;
}

async function findOrCreateTrainingUser(
  env: WorkerEnv,
  input: { telegramId: string; username?: string | null; firstName?: string | null }
) {
  const db = sql(env);
  const existing = await db`
    SELECT id, "telegramId", username, "firstName", role, "createdAt"
    FROM "TrainingUser"
    WHERE "telegramId" = ${input.telegramId}
    LIMIT 1
  `;
  if (existing[0]) return existing[0] as TrainingUser;

  const rows = await db`
    INSERT INTO "TrainingUser" (id, "telegramId", username, "firstName", role, "createdAt")
    VALUES (${id()}, ${input.telegramId}, ${input.username ?? null}, ${input.firstName ?? null}, 'student', NOW())
    RETURNING id, "telegramId", username, "firstName", role, "createdAt"
  `;
  return rows[0] as TrainingUser;
}

async function requireTrainingAuth(c: any, next: () => Promise<void>) {
  const header = c.req.header("Authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice("Bearer ".length) : "";
  if (!token) return c.json({ error: { message: "Нужна авторизация Telegram" } }, 401);

  let userId: string | undefined;
  try {
    userId = String(await verifyTrainingToken(c.env, token));
  } catch {
    return c.json({ error: { message: "Недействительный токен тренировок" } }, 401);
  }

  const rows = await sql(c.env)`
    SELECT id, "telegramId", username, "firstName", role, "createdAt"
    FROM "TrainingUser"
    WHERE id = ${userId}
    LIMIT 1
  `;
  if (!rows[0]) return c.json({ error: { message: "Пользователь тренировок не найден" } }, 401);
  c.set("trainingUser", rows[0]);
  await next();
}

function asNumber(value: unknown) {
  if (typeof value === "number") return value;
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function userDisplayName(row: any) {
  return row.firstName || row.username || "Ученик";
}

async function trainingState(env: WorkerEnv, user: TrainingUser) {
  const db = sql(env);
  const students =
    user.role === "coach"
      ? await db`
          SELECT u.id, COALESCE(u."firstName", u.username, 'Ученик') AS name, u.username, cs.goal,
                 COALESCE(cs.risk, 'green') AS risk, COALESCE(cs.compliance, 100) AS compliance,
                 COALESCE(SUM(t.amount), 0) AS balance
          FROM "TrainingCoachStudent" cs
          JOIN "TrainingUser" u ON u.id = cs."studentId"
          LEFT JOIN "TrainingBalanceTransaction" t ON t."userId" = u.id AND t.status = 'success'
          WHERE cs."coachId" = ${user.id} AND cs.status = 'active'
          GROUP BY u.id, cs.goal, cs.risk, cs.compliance
          ORDER BY cs."joinedAt" DESC
        `
      : [];

  const coachRows =
    user.role === "student"
      ? await db`
          SELECT c.id, COALESCE(c."firstName", c.username, 'Тренер') AS name, c.username, cs.goal,
                 'green' AS risk, 100 AS compliance, 0 AS balance
          FROM "TrainingCoachStudent" cs
          JOIN "TrainingUser" c ON c.id = cs."coachId"
          WHERE cs."studentId" = ${user.id} AND cs.status = 'active'
          ORDER BY cs."joinedAt" DESC
          LIMIT 1
        `
      : [];

  const plans =
    user.role === "coach"
      ? await db`
          SELECT id, "coachId", "studentId", title, goal, "startDate", weeks, status
          FROM "TrainingPlan"
          WHERE "coachId" = ${user.id}
          ORDER BY "createdAt" DESC
        `
      : await db`
          SELECT id, "coachId", "studentId", title, goal, "startDate", weeks, status
          FROM "TrainingPlan"
          WHERE "studentId" = ${user.id}
          ORDER BY "createdAt" DESC
        `;

  const sessions =
    user.role === "coach"
      ? await db`
          SELECT id, "planId", "coachId", "studentId", title, "scheduledDate", status, focus, "durationMin", intensity
          FROM "TrainingSession"
          WHERE "coachId" = ${user.id}
          ORDER BY "scheduledDate" ASC
        `
      : await db`
          SELECT id, "planId", "coachId", "studentId", title, "scheduledDate", status, focus, "durationMin", intensity
          FROM "TrainingSession"
          WHERE "studentId" = ${user.id}
          ORDER BY "scheduledDate" ASC
        `;

  const exercises =
    user.role === "coach"
      ? await db`
          SELECT e.id, e."sessionId", e.name, e.sets, e.reps, e.weight, e."restSec", e.notes, COALESCE(e."actualSets", 0) AS "actualSets"
          FROM "TrainingExercise" e
          JOIN "TrainingSession" s ON s.id = e."sessionId"
          WHERE s."coachId" = ${user.id}
          ORDER BY s."scheduledDate", e."sortOrder"
        `
      : await db`
          SELECT e.id, e."sessionId", e.name, e.sets, e.reps, e.weight, e."restSec", e.notes, COALESCE(e."actualSets", 0) AS "actualSets"
          FROM "TrainingExercise" e
          JOIN "TrainingSession" s ON s.id = e."sessionId"
          WHERE s."studentId" = ${user.id}
          ORDER BY s."scheduledDate", e."sortOrder"
        `;

  const messages =
    user.role === "coach"
      ? await db`
          SELECT id, "coachId", "studentId", "senderId", body, context, "createdAt"
          FROM "TrainingChatMessage"
          WHERE "coachId" = ${user.id}
          ORDER BY "createdAt" ASC
          LIMIT 100
        `
      : await db`
          SELECT id, "coachId", "studentId", "senderId", body, context, "createdAt"
          FROM "TrainingChatMessage"
          WHERE "studentId" = ${user.id}
          ORDER BY "createdAt" ASC
          LIMIT 100
        `;

  const transactions =
    user.role === "coach"
      ? await db`
          SELECT DISTINCT t.id, t."userId", t.kind, t.amount, t.status, t.note, t."createdAt"
          FROM "TrainingBalanceTransaction" t
          LEFT JOIN "TrainingCoachStudent" cs ON cs."studentId" = t."userId"
          WHERE t."userId" = ${user.id} OR cs."coachId" = ${user.id}
          ORDER BY t."createdAt" DESC
          LIMIT 100
        `
      : await db`
          SELECT id, "userId", kind, amount, status, note, "createdAt"
          FROM "TrainingBalanceTransaction"
          WHERE "userId" = ${user.id}
          ORDER BY "createdAt" DESC
          LIMIT 100
        `;

  return {
    user,
    coach: coachRows[0]
      ? {
          id: coachRows[0].id,
          name: coachRows[0].name,
          username: coachRows[0].username,
          goal: coachRows[0].goal,
          risk: "green",
          compliance: 100,
          balance: 0
        }
      : null,
    students: students.map((row: any) => ({
      id: row.id,
      name: row.name,
      username: row.username,
      goal: row.goal,
      risk: row.risk,
      compliance: asNumber(row.compliance),
      balance: asNumber(row.balance)
    })),
    plans,
    sessions: sessions.map((row: any) => ({
      id: row.id,
      planId: row.planId,
      coachId: row.coachId,
      studentId: row.studentId,
      title: row.title,
      scheduledDate: row.scheduledDate,
      status: row.status,
      focus: row.focus,
      durationMin: row.durationMin,
      intensity: row.intensity
    })),
    exercises: exercises.map((row: any) => ({
      id: row.id,
      sessionId: row.sessionId,
      name: row.name,
      sets: row.sets,
      reps: row.reps,
      weight: row.weight,
      restSec: row.restSec,
      notes: row.notes,
      actualSets: row.actualSets
    })),
    messages,
    transactions: transactions.map((row: any) => ({
      id: row.id,
      userId: row.userId,
      kind: row.kind,
      amount: asNumber(row.amount),
      status: row.status,
      note: row.note,
      createdAt: row.createdAt
    }))
  };
}

async function ensureCoachStudent(env: WorkerEnv, coach: TrainingUser, preferredStudentId?: string | null) {
  const db = sql(env);
  if (preferredStudentId) {
    const preferred = await db`
      SELECT u.id, COALESCE(u."firstName", u.username, 'Ученик') AS name
      FROM "TrainingCoachStudent" cs
      JOIN "TrainingUser" u ON u.id = cs."studentId"
      WHERE cs."coachId" = ${coach.id} AND cs."studentId" = ${preferredStudentId} AND cs.status = 'active'
      LIMIT 1
    `;
    if (preferred[0]) return preferred[0];
  }

  const existing = await db`
    SELECT u.id, COALESCE(u."firstName", u.username, 'Ученик') AS name
    FROM "TrainingCoachStudent" cs
    JOIN "TrainingUser" u ON u.id = cs."studentId"
    WHERE cs."coachId" = ${coach.id} AND cs.status = 'active'
    ORDER BY cs."joinedAt" DESC
    LIMIT 1
  `;
  if (existing[0]) return existing[0];

  const studentId = id();
  const student = await db`
    INSERT INTO "TrainingUser" (id, "telegramId", username, "firstName", role, "createdAt")
    VALUES (${studentId}, ${`manual:${coach.id}:${Date.now()}`}, NULL, 'Первый ученик', 'student', NOW())
    RETURNING id, COALESCE("firstName", username, 'Ученик') AS name
  `;
  await db`
    INSERT INTO "TrainingCoachStudent" (id, "coachId", "studentId", status, goal, risk, compliance, "joinedAt")
    VALUES (${id()}, ${coach.id}, ${studentId}, 'active', 'Стартовый план', 'green', 100, NOW())
  `;
  return student[0];
}

async function createTemplatePlan(env: WorkerEnv, coach: TrainingUser, preferredStudentId?: string | null) {
  const db = sql(env);
  const student = await ensureCoachStudent(env, coach, preferredStudentId);
  const planId = id();
  const sessionA = id();
  const sessionB = id();
  const now = new Date();
  const secondDate = new Date(now);
  secondDate.setDate(secondDate.getDate() + 2);

  await db`
    INSERT INTO "TrainingPlan" (id, "coachId", "studentId", title, goal, "startDate", weeks, status, "createdAt")
    VALUES (${planId}, ${coach.id}, ${student.id}, 'Силовой блок: неделя 1', 'Техника, объем и понятная обратная связь', ${now.toISOString()}, 4, 'active', NOW())
  `;
  await db`
    INSERT INTO "TrainingSession" (id, "planId", "coachId", "studentId", title, "scheduledDate", status, focus, "durationMin", intensity, "createdAt")
    VALUES
      (${sessionA}, ${planId}, ${coach.id}, ${student.id}, 'Full Body A', ${now.toISOString()}, 'planned', 'Сила', 45, 6, NOW()),
      (${sessionB}, ${planId}, ${coach.id}, ${student.id}, 'Recovery Flow', ${secondDate.toISOString()}, 'planned', 'Мобилити', 28, 4, NOW())
  `;
  await db`
    INSERT INTO "TrainingExercise" (id, "sessionId", name, sets, reps, weight, "restSec", notes, "sortOrder", "actualSets", "createdAt")
    VALUES
      (${id()}, ${sessionA}, 'Присед с паузой', 4, '5', 'RPE 7', 120, 'Пауза 1 сек внизу, корпус жесткий.', 1, 0, NOW()),
      (${id()}, ${sessionA}, 'Жим гантелей лежа', 3, '8', 'умеренно', 90, 'Лопатки сведены, движение подконтрольное.', 2, 0, NOW()),
      (${id()}, ${sessionA}, 'Тяга горизонтального блока', 3, '10', 'легко-средне', 75, 'Не дергать корпусом.', 3, 0, NOW()),
      (${id()}, ${sessionB}, '90/90 бедра', 2, '8/сторона', 'свой вес', 30, 'Работать без боли.', 1, 0, NOW())
  `;
}

type TelegramWebhookUpdate = {
  update_id: number;
  message?: {
    chat?: { id: number | string };
    text?: string;
  };
};

async function wasTrainingUpdateProcessed(env: WorkerEnv, updateId: number) {
  try {
    await sql(env)`
      INSERT INTO "TrainingTelegramUpdate" (id, "updateId", "processedAt")
      VALUES (${id()}, ${String(updateId)}, NOW())
    `;
    return false;
  } catch (error) {
    const code = typeof error === "object" && error !== null && "code" in error ? String(error.code) : null;
    if (code === "23505" || (error instanceof Error && error.message.includes("TrainingTelegramUpdate_updateId_key"))) return true;
    throw error;
  }
}

async function sendTrainingStartMessage(env: WorkerEnv, chatId: number | string) {
  if (!env.TRAINING_TELEGRAM_BOT_TOKEN || !env.TRAINING_TELEGRAM_WEBAPP_URL) {
    throw new Error("Training Telegram bot is not configured");
  }

  await fetch(`https://api.telegram.org/bot${env.TRAINING_TELEGRAM_BOT_TOKEN}/setChatMenuButton`, {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify({
      chat_id: chatId,
      menu_button: {
        type: "web_app",
        text: "Тренировки",
        web_app: { url: env.TRAINING_TELEGRAM_WEBAPP_URL }
      }
    })
  });

  const response = await fetch(`https://api.telegram.org/bot${env.TRAINING_TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify({
      chat_id: chatId,
      text: "Откройте Тренировки: планы, отметки подходов, баланс и связь с тренером в Telegram.",
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: "Открыть Тренировки",
              web_app: { url: env.TRAINING_TELEGRAM_WEBAPP_URL }
            }
          ]
        ]
      }
    })
  });

  if (!response.ok) throw new Error("Не удалось отправить сообщение Telegram");
}

export function registerTrainingRoutes(app: Hono<any>) {
  app.get("/training/health", async (c) => c.json({ ok: true, app: "training" }));

  app.post("/training/api/auth/telegram", async (c) => {
    const body = await c.req.json<{ initData?: string }>();
    if (!body.initData) return c.json({ error: { message: "Не переданы данные Telegram" } }, 400);
    if (!c.env.TRAINING_TELEGRAM_BOT_TOKEN) return c.json({ error: { message: "Бот тренировок не настроен" } }, 500);

    const telegramUser = await verifyTelegramInitData(body.initData, c.env.TRAINING_TELEGRAM_BOT_TOKEN);
    const user = await findOrCreateTrainingUser(c.env, {
      telegramId: String(telegramUser.id),
      username: telegramUser.username ?? null,
      firstName: telegramUser.first_name ?? null
    });
    const token = await signTrainingToken(c.env, user);
    return c.json({ token });
  });

  app.post("/training/api/telegram/webhook", async (c) => {
    const expected = c.env.TRAINING_TELEGRAM_WEBHOOK_SECRET;
    if (!expected && c.env.NODE_ENV === "production") {
      return c.json({ ok: false, error: "Training webhook secret is required" }, 500);
    }
    if (expected && c.req.header("X-Telegram-Bot-Api-Secret-Token") !== expected) {
      return c.json({ ok: false }, 401);
    }

    const update = await c.req.json<TelegramWebhookUpdate>().catch(() => null);
    if (!update?.update_id || (await wasTrainingUpdateProcessed(c.env, update.update_id))) {
      return c.json({ ok: true });
    }

    const chatId = update.message?.chat?.id;
    if (chatId && update.message?.text?.startsWith("/start")) {
      await sendTrainingStartMessage(c.env, chatId);
    }

    return c.json({ ok: true });
  });

  app.use("/training/api/*", async (c, next) => {
    if (c.req.path === "/training/api/auth/telegram" || c.req.path === "/training/api/telegram/webhook") {
      await next();
      return;
    }
    return requireTrainingAuth(c, next);
  });

  app.get("/training/api/state", async (c) => {
    const user = c.get("trainingUser") as TrainingUser;
    return c.json(await trainingState(c.env, user));
  });

  app.patch("/training/api/role", async (c) => {
    const user = c.get("trainingUser") as TrainingUser;
    const body = roleSchema.parse(await c.req.json());
    if (body.role !== user.role) {
      const activity = await sql(c.env)`
        SELECT EXISTS (
          SELECT 1 FROM "TrainingCoachStudent" WHERE "coachId" = ${user.id} OR "studentId" = ${user.id}
          UNION ALL
          SELECT 1 FROM "TrainingPlan" WHERE "coachId" = ${user.id} OR "studentId" = ${user.id}
          UNION ALL
          SELECT 1 FROM "TrainingChatMessage" WHERE "coachId" = ${user.id} OR "studentId" = ${user.id}
          UNION ALL
          SELECT 1 FROM "TrainingBalanceTransaction" WHERE "userId" = ${user.id}
        ) AS locked
      `;
      if (activity[0]?.locked) {
        return c.json({ error: { message: "Роль уже закреплена рабочими данными" } }, 409);
      }
    }
    const rows = await sql(c.env)`
      UPDATE "TrainingUser"
      SET role = ${body.role}
      WHERE id = ${user.id}
      RETURNING id, "telegramId", username, "firstName", role, "createdAt"
    `;
    return c.json(await trainingState(c.env, rows[0] as TrainingUser));
  });

  app.post("/training/api/students", async (c) => {
    const user = c.get("trainingUser") as TrainingUser;
    if (user.role !== "coach") return c.json({ error: { message: "Добавлять учеников может только тренер" } }, 403);
    const body = studentSchema.parse(await c.req.json());
    const studentId = id();
    await sql(c.env)`
      INSERT INTO "TrainingUser" (id, "telegramId", username, "firstName", role, "createdAt")
      VALUES (${studentId}, ${`manual:${user.id}:${Date.now()}`}, NULL, ${body.name}, 'student', NOW())
    `;
    await sql(c.env)`
      INSERT INTO "TrainingCoachStudent" (id, "coachId", "studentId", status, goal, risk, compliance, "joinedAt")
      VALUES (${id()}, ${user.id}, ${studentId}, 'active', ${body.goal}, 'green', 100, NOW())
    `;
    return c.json(await trainingState(c.env, user), 201);
  });

  app.post("/training/api/plans/template", async (c) => {
    const user = c.get("trainingUser") as TrainingUser;
    if (user.role !== "coach") return c.json({ error: { message: "Планы создает тренер" } }, 403);
    const body = templatePlanSchema.parse(await c.req.json().catch(() => ({})));
    await createTemplatePlan(c.env, user, body.studentId);
    return c.json(await trainingState(c.env, user), 201);
  });

  app.patch("/training/api/sessions/:id/status", async (c) => {
    const user = c.get("trainingUser") as TrainingUser;
    const body = statusSchema.parse(await c.req.json()) as { status: SessionStatus };
    const sessionRows = await sql(c.env)`
      SELECT id, "studentId", status
      FROM "TrainingSession"
      WHERE id = ${c.req.param("id")} AND ("coachId" = ${user.id} OR "studentId" = ${user.id})
      LIMIT 1
    `;
    const session = sessionRows[0] as { id: string; studentId: string | null; status: SessionStatus } | undefined;
    if (!session) return c.json({ error: { message: "Тренировка не найдена" } }, 404);

    await sql(c.env)`UPDATE "TrainingSession" SET status = ${body.status} WHERE id = ${session.id}`;
    if (body.status === "done" && session.status !== "done" && session.studentId) {
      await sql(c.env)`
        INSERT INTO "TrainingBalanceTransaction" (id, "userId", kind, amount, status, note, "createdAt")
        VALUES (${id()}, ${session.studentId}, 'charge', -2000, 'success', 'Списание за выполненную тренировку', NOW())
      `;
    }
    return c.json(await trainingState(c.env, user));
  });

  app.post("/training/api/messages", async (c) => {
    const user = c.get("trainingUser") as TrainingUser;
    const body = messageSchema.parse(await c.req.json());
    let coachId = user.id;
    let studentId = body.studentId ?? user.id;

    if (user.role === "student") {
      const coachRows = await sql(c.env)`
        SELECT "coachId"
        FROM "TrainingCoachStudent"
        WHERE "studentId" = ${user.id} AND status = 'active'
        ORDER BY "joinedAt" DESC
        LIMIT 1
      `;
      coachId = coachRows[0]?.coachId ?? user.id;
      studentId = user.id;
    }

    if (user.role === "coach" && body.studentId) {
      const allowed = await sql(c.env)`
        SELECT id FROM "TrainingCoachStudent"
        WHERE "coachId" = ${user.id} AND "studentId" = ${body.studentId}
        LIMIT 1
      `;
      if (!allowed[0]) return c.json({ error: { message: "Ученик не связан с тренером" } }, 403);
    }

    await sql(c.env)`
      INSERT INTO "TrainingChatMessage" (id, "coachId", "studentId", "senderId", body, context, "createdAt")
      VALUES (${id()}, ${coachId}, ${studentId}, ${user.id}, ${body.body}, ${body.context ?? null}, NOW())
    `;
    return c.json(await trainingState(c.env, user), 201);
  });

  app.post("/training/api/balance/top-up", async (c) => {
    const user = c.get("trainingUser") as TrainingUser;
    const body = topUpSchema.parse(await c.req.json());
    let targetUserId = user.id;
    if (user.role === "coach") {
      if (!body.studentId) return c.json({ error: { message: "Выберите ученика для пополнения" } }, 400);
      const allowed = await sql(c.env)`
        SELECT id FROM "TrainingCoachStudent"
        WHERE "coachId" = ${user.id} AND "studentId" = ${body.studentId} AND status = 'active'
        LIMIT 1
      `;
      if (!allowed[0]) return c.json({ error: { message: "Ученик не связан с тренером" } }, 403);
      targetUserId = body.studentId;
    }
    await sql(c.env)`
      INSERT INTO "TrainingBalanceTransaction" (id, "userId", kind, amount, status, note, "createdAt")
      VALUES (${id()}, ${targetUserId}, 'topup', ${body.amount}, 'pending', ${body.note}, NOW())
    `;
    return c.json(await trainingState(c.env, user), 201);
  });
}
