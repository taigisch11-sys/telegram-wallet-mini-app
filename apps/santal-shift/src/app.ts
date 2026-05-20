import { Hono } from "hono";
import {
  cancelAssignment,
  buildScheduleBoard,
  checkInAssignment,
  completeAssignment,
  confirmAssignment,
  createDemoState,
  deriveMoneySummary,
  myAssignments,
  takeShift,
  visibleShiftsForAdmin,
  type Admin,
  type AppState
} from "./domain";
import type { WorkerEnv } from "./env";
import { appendAccrual, appendAssignment, appendAudit, loadState, setupSpreadsheet } from "./sheets";
import { callTelegramApi, verifyTelegramInitData } from "./telegram";
import { renderAppHtml } from "./ui";

type AppBindings = { Bindings: WorkerEnv };

let memoryState: AppState = createDemoState("2026-05-20");
const processedUpdates = new Set<number>();

export function createApp() {
  const app = new Hono<AppBindings>();

  app.onError((error, c) => {
    return c.json({ ok: false, message: error instanceof Error ? error.message : "Внутренняя ошибка" }, errorStatus(error));
  });

  app.get("/", (c) => c.html(renderAppHtml()));
  app.get("/health", (c) => c.json({ ok: true, app: "santal-shift", time: new Date().toISOString() }));
  app.get("/api/release/readiness", (c) => c.json(buildReleaseReadiness(c.env)));

  app.get("/api/bootstrap", async (c) => {
    const { state, sync } = await currentState(c.env);
    const identity = await resolveIdentity(c.env, c.req.header("X-Telegram-Init-Data"), c.req.header("X-Demo-Admin-Id"));
    const admin = identity.telegramUser
      ? findAuthorizedAdmin(state, identity.telegramUser.id, c.env, sync)
      : findAdminOrDefault(state, identity.demoAdminId);
    memoryState = state;

    return c.json({
      ok: true,
      state: serializeState(memoryState, admin, sync)
    });
  });

  app.post("/api/shifts/take", async (c) => {
    const body = await c.req.json<{ shiftId?: string; initData?: string }>();
    if (!body.shiftId) return c.json({ ok: false, message: "Не выбрана смена" }, 400);

    const loaded = await currentState(c.env);
    memoryState = loaded.state;
    const identity = await resolveIdentity(c.env, body.initData || c.req.header("X-Telegram-Init-Data"), c.req.header("X-Demo-Admin-Id"));
    const admin = identity.telegramUser ? findAuthorizedAdmin(memoryState, identity.telegramUser.id, c.env, loaded.sync) : findAdminOrDefault(memoryState, identity.demoAdminId);

    const result = takeShift(memoryState, {
      shiftId: body.shiftId,
      adminId: admin.id,
      nowIso: new Date().toISOString()
    });
    memoryState = result.state;
    if (!result.ok) return c.json({ ok: false, reason: result.reason, message: takeShiftMessage(result.reason) }, 409);
    const shift = memoryState.shifts.find((item) => item.id === body.shiftId);
    if (shift) await appendAssignment(c.env, { assignment: result.assignment, admin, shift });

    await appendAudit(c.env, [
      `audit_${Date.now()}_${result.assignment.id}`,
      new Date().toISOString(),
      "telegram_user",
      admin.id,
      "shift.take",
      "shift",
      body.shiftId,
      JSON.stringify({ assignmentId: result.assignment.id }),
      "mini_app",
      "success",
      ""
    ]);

    return c.json({ ok: true, assignment: result.assignment, state: serializeState(memoryState, admin, loaded.sync) });
  });

  app.post("/api/assignments/:id/:action", async (c) => {
    const body = (await c.req.json<{ initData?: string; reason?: string }>().catch(() => ({}))) as {
      initData?: string;
      reason?: string;
    };
    const loaded = await currentState(c.env);
    memoryState = loaded.state;
    const identity = await resolveIdentity(c.env, body.initData || c.req.header("X-Telegram-Init-Data"), c.req.header("X-Demo-Admin-Id"));
    const admin = identity.telegramUser ? findAuthorizedAdmin(memoryState, identity.telegramUser.id, c.env, loaded.sync) : findAdminOrDefault(memoryState, identity.demoAdminId);
    const id = c.req.param("id");
    const action = c.req.param("action");
    const nowIso = new Date().toISOString();
    const beforeAssignment = memoryState.assignments.find((item) => item.id === id && item.adminId === admin.id);
    if (!beforeAssignment) return c.json({ ok: false, message: "Назначение не найдено" }, 404);

    if (action === "confirm") memoryState = confirmAssignment(memoryState, { assignmentId: id, adminId: admin.id, nowIso });
    else if (action === "check-in") memoryState = checkInAssignment(memoryState, { assignmentId: id, adminId: admin.id, nowIso });
    else if (action === "complete") {
      memoryState = completeAssignment(memoryState, { assignmentId: id, adminId: admin.id, nowIso });
      const assignment = memoryState.assignments.find((item) => item.id === id);
      const shift = assignment ? memoryState.shifts.find((item) => item.id === assignment.shiftId) : undefined;
      if (assignment && shift) await appendAccrual(c.env, { assignment, shift, status: "draft", comment: "Завершено через Mini App" });
    }
    else if (action === "cancel") memoryState = cancelAssignment(memoryState, { assignmentId: id, adminId: admin.id, nowIso, reason: body.reason });
    else return c.json({ ok: false, message: "Неизвестное действие" }, 400);

    const assignment = memoryState.assignments.find((item) => item.id === id);
    const shift = assignment ? memoryState.shifts.find((item) => item.id === assignment.shiftId) : undefined;
    if (assignment && shift && assignment.updatedAt !== beforeAssignment.updatedAt) {
      await appendAssignment(c.env, { assignment, admin, shift, cancelReason: body.reason });
      await appendAudit(c.env, [
        `audit_${Date.now()}_${assignment.id}_${action}`,
        new Date().toISOString(),
        "telegram_user",
        admin.id,
        `assignment.${action}`,
        "assignment",
        assignment.id,
        JSON.stringify({ status: assignment.status, shiftId: assignment.shiftId }),
        "mini_app",
        "success",
        ""
      ]);
    }

    return c.json({ ok: true, state: serializeState(memoryState, admin, loaded.sync) });
  });

  app.post("/api/admin/setup-sheet", async (c) => {
    const token = c.req.header("Authorization")?.replace(/^Bearer\s+/i, "") || c.req.header("X-Admin-Setup-Token");
    if (!c.env.ADMIN_SETUP_TOKEN || token !== c.env.ADMIN_SETUP_TOKEN) {
      return c.json({ ok: false, message: "Нет доступа" }, 403);
    }
    const result = await setupSpreadsheet(c.env);
    return c.json({ ok: true, result });
  });

  app.get("/api/sheets/schema", (c) => {
    return c.json({
      ok: true,
      spreadsheetId: c.env.GOOGLE_SHEET_ID,
      tabs: [
        "Настройки_клиники",
        "Филиалы",
        "Администраторы",
        "Смены",
        "Заявки",
        "Назначения",
        "Ставки",
        "Праздники",
        "Истории_новости",
        "Выплаты",
        "Начисления",
        "Шахматка",
        "Справочники",
        "Аудит_лог",
        "Sync_State"
      ]
    });
  });

  app.post("/api/telegram/webhook", async (c) => {
    const secret = c.req.header("X-Telegram-Bot-Api-Secret-Token");
    if (c.env.TELEGRAM_WEBHOOK_SECRET && secret !== c.env.TELEGRAM_WEBHOOK_SECRET) {
      return c.json({ ok: false }, 403);
    }
    const update = await c.req.json<{ update_id?: number; message?: { chat?: { id: number }; text?: string } }>();
    if (typeof update.update_id === "number") {
      if (processedUpdates.has(update.update_id)) return c.json({ ok: true, duplicate: true });
      processedUpdates.add(update.update_id);
      if (processedUpdates.size > 1000) processedUpdates.clear();
    }

    const chatId = update.message?.chat?.id;
    if (chatId && update.message?.text?.startsWith("/start")) {
      await callTelegramApi(c.env.TELEGRAM_BOT_TOKEN, "sendMessage", {
        chat_id: chatId,
        text: "Откройте «Санталь Смена», чтобы подобрать смену, подтвердить выход и увидеть начисления.",
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: "Открыть смены",
                web_app: { url: c.env.SANTAL_WEBAPP_URL || new URL(c.req.url).origin }
              }
            ]
          ]
        }
      });
    }
    return c.json({ ok: true });
  });

  return app;
}

async function currentState(env: WorkerEnv): Promise<{ state: AppState; sync: Awaited<ReturnType<typeof loadState>>["sync"] }> {
  const loaded = await loadState(env);
  if (loaded.sync.connected) return loaded;
  return { state: memoryState, sync: loaded.sync };
}

async function resolveIdentity(env: WorkerEnv, initData?: string, demoAdminId?: string): Promise<{ telegramUser?: { id: string; username?: string; firstName?: string; lastName?: string }; demoAdminId?: string }> {
  if (initData) return { telegramUser: await verifyTelegramInitData(initData, env.TELEGRAM_BOT_TOKEN) };
  if (env.APP_ENV !== "production" || env.ALLOW_WEB_PREVIEW === "true") return { demoAdminId };
  throw new Error("Откройте приложение из Telegram");
}

function findAdminOrDefault(state: AppState, adminId?: string): Admin {
  return state.admins.find((admin) => admin.id === adminId) ?? state.admins[0];
}

function findAuthorizedAdmin(
  state: AppState,
  telegramUserId: string,
  env: WorkerEnv,
  sync: Awaited<ReturnType<typeof loadState>>["sync"]
): Admin {
  const admin = state.admins.find((item) => item.telegramUserId === telegramUserId);
  if (admin?.status === "active") return admin;
  if (!sync.connected && !hasGoogleCredentials(env)) return findAdminOrDefault(state);
  if (env.APP_ENV !== "production" || env.ALLOW_WEB_PREVIEW === "true") return state.admins[0];
  throw new Error("Ваш Telegram не найден в листе «Администраторы» или профиль не активен");
}

function errorStatus(error: unknown): 401 | 403 | 500 {
  const message = error instanceof Error ? error.message : "";
  if (message.includes("Откройте приложение") || message.includes("Telegram init data") || message.includes("Telegram initData") || message.includes("Invalid Telegram")) return 401;
  if (message.includes("Telegram не найден") || message.includes("профиль не активен")) return 403;
  return 500;
}

function buildReleaseReadiness(env: WorkerEnv) {
  const checks = {
    appEnvProduction: releaseCheck(env.APP_ENV === "production", "APP_ENV должен быть production"),
    webPreviewDisabled: releaseCheck(env.ALLOW_WEB_PREVIEW !== "true", "ALLOW_WEB_PREVIEW должен быть выключен"),
    webAppUrl: releaseCheck(isHttpsUrl(env.SANTAL_WEBAPP_URL), "SANTAL_WEBAPP_URL должен быть HTTPS URL"),
    telegramBotToken: releaseCheck(hasValue(env.TELEGRAM_BOT_TOKEN), "TELEGRAM_BOT_TOKEN задан"),
    telegramWebhookSecret: releaseCheck(hasValue(env.TELEGRAM_WEBHOOK_SECRET), "TELEGRAM_WEBHOOK_SECRET задан"),
    adminSetupToken: releaseCheck(hasValue(env.ADMIN_SETUP_TOKEN), "ADMIN_SETUP_TOKEN задан"),
    googleSheetId: releaseCheck(hasValue(env.GOOGLE_SHEET_ID), "GOOGLE_SHEET_ID задан"),
    googleServiceAccountEmail: releaseCheck(hasValue(env.GOOGLE_SERVICE_ACCOUNT_EMAIL), "GOOGLE_SERVICE_ACCOUNT_EMAIL задан"),
    googlePrivateKey: releaseCheck(hasValue(env.GOOGLE_PRIVATE_KEY), "GOOGLE_PRIVATE_KEY задан")
  };
  return {
    ok: true,
    ready: Object.values(checks).every((check) => check.ok),
    generatedAt: new Date().toISOString(),
    checks
  };
}

function releaseCheck(ok: boolean, message: string) {
  return { ok, message };
}

function hasValue(value?: string): boolean {
  return Boolean(value?.trim());
}

function isHttpsUrl(value?: string): boolean {
  if (!value) return false;
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

function hasGoogleCredentials(env: WorkerEnv): boolean {
  return Boolean(env.GOOGLE_SHEET_ID && env.GOOGLE_SERVICE_ACCOUNT_EMAIL && env.GOOGLE_PRIVATE_KEY);
}

function serializeState(state: AppState, admin: Admin, sync: Awaited<ReturnType<typeof loadState>>["sync"]) {
  return {
    settings: state.settings,
    sync,
    branches: state.branches,
    admin,
    visibleShifts: visibleShiftsForAdmin(state, admin.id),
    myShifts: myAssignments(state, admin.id),
    stories: state.stories.filter((story) => story.status === "published").sort((left, right) => left.priority - right.priority),
    money: deriveMoneySummary(state, admin.id),
    scheduleBoard: buildScheduleBoard(state)
  };
}

function takeShiftMessage(reason: string): string {
  return (
    {
      not_found: "Смена не найдена",
      inactive_admin: "Профиль не активен для записи на смены",
      duplicate: "Вы уже записаны на эту смену",
      filled: "Смену уже разобрали",
      overlap: "Смена пересекается с вашим графиком",
      closed: "Смена закрыта для записи"
    }[reason] || "Не удалось взять смену"
  );
}
