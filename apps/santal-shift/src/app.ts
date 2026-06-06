import { Hono } from "hono";
import {
  cancelAssignment,
  buildScheduleBoard,
  calculateShiftPay,
  checkInAssignment,
  completeAssignment,
  confirmAssignment,
  createDemoState,
  deriveMoneySummary,
  myAssignments,
  takeShift,
  visibleShiftsForAdmin,
  type Assignment,
  type Admin,
  type AppState,
  type Branch,
  type Shift
} from "./domain";
import type { WorkerEnv } from "./env";
import { buildDailyNotification } from "./notifications";
import { appendAccrual, appendAssignment, appendAudit, appendNotification, loadNotificationKeys, loadState, setupSpreadsheet } from "./sheets";
import { callTelegramApi, verifyTelegramInitData } from "./telegram";
import { renderAppHtml } from "./ui";

type AppBindings = { Bindings: WorkerEnv };
type StateSync = Awaited<ReturnType<typeof loadState>>["sync"];

let memoryState: AppState = createDemoState("2026-05-20");
const processedUpdates = new Set<number>();
const productionStorageMessage = "Хранилище данных не подключено. Попросите координатора завершить настройку Google Sheets.";

export function createApp() {
  const app = new Hono<AppBindings>();

  app.onError((error, c) => {
    return c.json({ ok: false, message: error instanceof Error ? error.message : "Внутренняя ошибка" }, errorStatus(error));
  });

  app.get("/", (c) => c.html(renderAppHtml()));
  app.get("/health", (c) => c.json({ ok: true, app: "santal-shift", time: new Date().toISOString() }));
  app.get("/api/release/readiness", (c) => c.json(buildReleaseReadiness(c.env)));

  app.get("/api/bootstrap", async (c) => {
    const identity = await resolveIdentity(c.env, c.req.header("X-Telegram-Init-Data"), c.req.header("X-Demo-Admin-Id"));
    const { state, sync } = await currentState(c.env);
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
    if (shift) {
      await sendAssignmentMessage(c.env, identity.telegramUser?.id ?? admin.telegramUserId, admin, shift, result.assignment, "Смена добавлена");
    }

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
      await sendAssignmentMessage(c.env, identity.telegramUser?.id ?? admin.telegramUserId, admin, shift, assignment, assignmentActionTitle(action));
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
        "Уведомления",
        "Sync_State"
      ]
    });
  });

  app.post("/api/telegram/webhook", async (c) => {
    const secret = c.req.header("X-Telegram-Bot-Api-Secret-Token");
    if (isStrictProduction(c.env) && !c.env.TELEGRAM_WEBHOOK_SECRET) {
      return c.json({ ok: false, message: "Telegram webhook secret не настроен" }, 503);
    }
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
    const text = update.message?.text?.trim() || "";
    if (chatId && text.startsWith("/")) {
      const loaded = await currentState(c.env);
      memoryState = loaded.state;
      const admin = findAdminByTelegramChat(memoryState, chatId);
      await sendTelegramCommandReply(c.env, chatId, new URL(c.req.url).origin, memoryState, admin, text);
    }
    return c.json({ ok: true });
  });

  return app;
}

export async function handleScheduled(_: ScheduledController, env: WorkerEnv, ctx: ExecutionContext): Promise<void> {
  ctx.waitUntil(sendDailyTelegramDigest(env));
}

async function sendDailyTelegramDigest(env: WorkerEnv): Promise<void> {
  const loaded = await currentState(env).catch((error) => {
    console.error(error);
    return undefined;
  });
  if (!loaded) return;
  memoryState = loaded.state;
  const sentNotificationKeys = await loadNotificationKeys(env);
  for (const admin of memoryState.admins.filter((item) => item.status === "active" && item.canTakeShifts)) {
    const chatId = telegramChatId(admin.telegramUserId);
    if (!chatId) continue;
    const assistant = buildAssistantSummary(memoryState, admin);
    const notification = buildDailyNotification(admin.id, String(chatId), assistant);
    if (!notification || sentNotificationKeys.has(notification.key)) continue;
    const sent = await sendTelegramMessage(env, chatId, notification.message, assistant.primaryAction);
    if (!sent) continue;
    sentNotificationKeys.add(notification.key);
    await appendNotification(env, {
      ...notification,
      status: "sent",
      sentAt: new Date().toISOString()
    });
  }
}

async function currentState(env: WorkerEnv): Promise<{ state: AppState; sync: StateSync }> {
  const loaded = await loadState(env);
  if (loaded.sync.connected) return loaded;
  if (isStrictProduction(env)) throw new Error(productionStorageMessage);
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

function findAdminByTelegramChat(state: AppState, chatId: number): Admin | undefined {
  return state.admins.find((admin) => admin.telegramUserId === String(chatId));
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

function errorStatus(error: unknown): 401 | 403 | 500 | 503 {
  const message = error instanceof Error ? error.message : "";
  if (message.includes("Откройте приложение") || message.includes("Telegram init data") || message.includes("Telegram initData") || message.includes("Invalid Telegram")) return 401;
  if (message.includes("Telegram не найден") || message.includes("профиль не активен")) return 403;
  if (message.includes("Хранилище данных не подключено") || message.includes("Google Sheets credentials")) return 503;
  return 500;
}

function buildReleaseReadiness(env: WorkerEnv) {
  const checks = {
    appEnvProduction: releaseCheck("appEnvProduction", env.APP_ENV === "production", "APP_ENV должен быть production", "Установить APP_ENV=production в Worker."),
    webPreviewDisabled: releaseCheck("webPreviewDisabled", env.ALLOW_WEB_PREVIEW !== "true", "ALLOW_WEB_PREVIEW должен быть выключен", "Установить ALLOW_WEB_PREVIEW=false для публичного релиза."),
    webAppUrl: releaseCheck("webAppUrl", isHttpsUrl(env.SANTAL_WEBAPP_URL), "SANTAL_WEBAPP_URL должен быть HTTPS URL", "Указать публичный HTTPS URL Mini App."),
    telegramBotToken: releaseCheck("telegramBotToken", hasValue(env.TELEGRAM_BOT_TOKEN), "TELEGRAM_BOT_TOKEN задан", "Добавить SANTAL_TELEGRAM_BOT_TOKEN в GitHub secrets."),
    telegramTokenRotation: releaseCheck("telegramTokenRotation", hasValue(env.TELEGRAM_TOKEN_ROTATED_AT), "Telegram bot token должен быть перевыпущен перед рынком", "Перевыпустить токен в BotFather, обновить SANTAL_TELEGRAM_BOT_TOKEN и задать SANTAL_TELEGRAM_TOKEN_ROTATED_AT."),
    telegramWebhookSecret: releaseCheck("telegramWebhookSecret", hasValue(env.TELEGRAM_WEBHOOK_SECRET), "TELEGRAM_WEBHOOK_SECRET задан", "Добавить SANTAL_TELEGRAM_WEBHOOK_SECRET в GitHub secrets."),
    adminSetupToken: releaseCheck("adminSetupToken", hasValue(env.ADMIN_SETUP_TOKEN), "ADMIN_SETUP_TOKEN задан", "Добавить SANTAL_ADMIN_SETUP_TOKEN в GitHub secrets."),
    googleSheetId: releaseCheck("googleSheetId", hasValue(env.GOOGLE_SHEET_ID), "GOOGLE_SHEET_ID задан", "Указать id рабочей Google таблицы в wrangler.toml."),
    googleServiceAccountEmail: releaseCheck("googleServiceAccountEmail", hasValue(env.GOOGLE_SERVICE_ACCOUNT_EMAIL), "GOOGLE_SERVICE_ACCOUNT_EMAIL задан", "Добавить SANTAL_GOOGLE_SERVICE_ACCOUNT_EMAIL и выдать этому аккаунту доступ редактора к таблице."),
    googlePrivateKey: releaseCheck("googlePrivateKey", hasValue(env.GOOGLE_PRIVATE_KEY), "GOOGLE_PRIVATE_KEY задан", "Добавить SANTAL_GOOGLE_PRIVATE_KEY в GitHub secrets.")
  };
  const allChecks = Object.values(checks);
  const failedChecks = allChecks.filter((check) => !check.ok);
  const criticalBlockers = failedChecks.map(({ id, message, fix }) => ({ id, message, fix }));
  return {
    ok: true,
    ready: failedChecks.length === 0,
    marketReadinessPercent: Math.round((allChecks.filter((check) => check.ok).length / allChecks.length) * 100),
    generatedAt: new Date().toISOString(),
    checks,
    criticalBlockers,
    warnings: [],
    nextActions: criticalBlockers.map((blocker) => blocker.fix)
  };
}

function releaseCheck(id: string, ok: boolean, message: string, fix: string) {
  return { id, ok, message, severity: "critical" as const, fix };
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

function isStrictProduction(env: WorkerEnv): boolean {
  return env.APP_ENV === "production" && env.ALLOW_WEB_PREVIEW !== "true";
}

function serializeState(state: AppState, admin: Admin, sync: StateSync) {
  return {
    settings: state.settings,
    sync,
    branches: state.branches,
    admin,
    visibleShifts: visibleShiftsForAdmin(state, admin.id),
    myShifts: myAssignments(state, admin.id),
    stories: state.stories.filter((story) => story.status === "published").sort((left, right) => left.priority - right.priority),
    money: deriveMoneySummary(state, admin.id),
    scheduleBoard: buildScheduleBoard(state),
    assistant: buildAssistantSummary(state, admin)
  };
}

function buildAssistantSummary(state: AppState, admin: Admin) {
  const todayDate = operationalToday(state);
  const tomorrowDate = addDaysIso(todayDate, 1);
  const assignments = myAssignments(state, admin.id).filter(({ assignment }) => assignment.status !== "cancelled");
  const activeAssignments = assignments.filter(({ assignment }) => assignment.status !== "completed");
  const nextAssignment = activeAssignments.find(({ shift }) => shift.date >= todayDate) ?? activeAssignments[0];
  const tomorrowAssignment = activeAssignments.find(({ shift }) => shift.date === tomorrowDate);
  const urgentShift = visibleShiftsForAdmin(state, admin.id).find((shift) => shift.urgent && shift.status !== "filled");
  const money = deriveMoneySummary(state, admin.id);

  if (tomorrowAssignment) {
    const branch = findBranch(state, tomorrowAssignment.shift.branchId);
    return {
      todayDate,
      tomorrowDate,
      status: "tomorrow_shift",
      unreadCount: 1,
      nextShiftId: tomorrowAssignment.shift.id,
      nextAssignmentId: tomorrowAssignment.assignment.id,
      urgentShiftId: urgentShift?.id,
      headline: "Завтра у вас смена",
      body: `${tomorrowAssignment.shift.startTime}—${tomorrowAssignment.shift.endTime}, ${branch?.name ?? "филиал"}. Подтвердите выход заранее, чтобы координатор видел готовность.`,
      primaryView: "mine",
      primaryAction: "Открыть мои смены"
    };
  }

  if (!nextAssignment) {
    return {
      todayDate,
      tomorrowDate,
      status: "no_shifts",
      unreadCount: urgentShift ? 2 : 1,
      nextShiftId: undefined,
      nextAssignmentId: undefined,
      urgentShiftId: urgentShift?.id,
      headline: "Вы пока не записаны ни на одну смену",
      body: urgentShift
        ? "Есть срочная подходящая смена. Откройте поиск, чтобы забрать ее до закрытия."
        : "Откройте поиск и выберите удобный филиал. Бот напомнит о завтрашней смене после записи.",
      primaryView: "search",
      primaryAction: "Найти смену"
    };
  }

  const branch = findBranch(state, nextAssignment.shift.branchId);
  return {
    todayDate,
    tomorrowDate,
    status: "next_shift",
    unreadCount: nextAssignment.assignment.status === "assigned" ? 1 : 0,
    nextShiftId: nextAssignment.shift.id,
    nextAssignmentId: nextAssignment.assignment.id,
    urgentShiftId: urgentShift?.id,
    headline: nextAssignment.assignment.status === "assigned" ? "Смену нужно подтвердить" : "Следующая смена в графике",
    body: `${dateLabel(nextAssignment.shift.date)} ${nextAssignment.shift.startTime}—${nextAssignment.shift.endTime}, ${branch?.name ?? "филиал"}. Ожидаемый доход: ${formatRub(calculateShiftPay(nextAssignment.shift))}.`,
    primaryView: "mine",
    primaryAction: nextAssignment.assignment.status === "assigned" ? "Подтвердить" : "Открыть мои смены",
    moneyExpected: money.expected
  };
}

async function sendTelegramCommandReply(
  env: WorkerEnv,
  chatId: number,
  origin: string,
  state: AppState,
  admin: Admin | undefined,
  rawText: string
): Promise<void> {
  const command = rawText.split(/\s+/)[0].split("@")[0].toLowerCase();
  const webAppUrl = env.SANTAL_WEBAPP_URL || origin;
  if (command === "/help") {
    await sendTelegramMessage(
      env,
      chatId,
      "Я операционный ассистент «Санталь Смена».\n\nКоманды:\n/my — мои смены\n/today — что актуально сегодня\n/money — начисления\n/help — помощь",
      "Открыть приложение",
      webAppUrl
    );
    return;
  }

  if (!admin) {
    await sendTelegramMessage(
      env,
      chatId,
      "Вы еще не зарегистрированы в списке сотрудников.\n\nОткройте Mini App. Если доступ не появился, попросите координатора добавить ваш Telegram ID в лист «Администраторы».",
      "Открыть смены",
      webAppUrl
    );
    return;
  }

  if (command === "/start") {
    const assistant = buildAssistantSummary(state, admin);
    await sendTelegramMessage(env, chatId, "Санталь Смена на связи.\n\n" + assistant.headline + "\n" + assistant.body, assistant.primaryAction, webAppUrl);
    return;
  }

  if (command === "/my") {
    await sendTelegramMessage(env, chatId, buildMyShiftsMessage(state, admin), "Открыть мои смены", webAppUrl);
    return;
  }

  if (command === "/today") {
    const assistant = buildAssistantSummary(state, admin);
    await sendTelegramMessage(env, chatId, assistant.headline + "\n\n" + assistant.body, assistant.primaryAction, webAppUrl);
    return;
  }

  if (command === "/money") {
    const money = deriveMoneySummary(state, admin.id);
    await sendTelegramMessage(
      env,
      chatId,
      `Деньги\n\nОжидается: ${formatRub(money.expected)}\nВ работе: ${formatRub(money.pending)}\nНачислено: ${formatRub(money.earned)}\nОдобрено к выплате: ${formatRub(money.approved)}`,
      "Открыть выплаты",
      webAppUrl
    );
    return;
  }

  await sendTelegramMessage(env, chatId, "Команда не распознана. Напишите /help, чтобы увидеть список команд.", "Открыть приложение", webAppUrl);
}

function buildMyShiftsMessage(state: AppState, admin: Admin): string {
  const items = myAssignments(state, admin.id).filter(({ assignment }) => assignment.status !== "cancelled");
  if (!items.length) return "Вы пока не зарегистрированы ни на одну смену.\n\nОткройте поиск: там видны подходящие филиалы и свободные места.";
  return (
    "Мои смены\n\n" +
    items
      .slice(0, 5)
      .map(({ assignment, shift }) => {
        const branch = findBranch(state, shift.branchId);
        return `${dateLabel(shift.date)} ${shift.startTime}—${shift.endTime}, ${branch?.name ?? "филиал"}\n${shift.title}, ${statusText(assignment.status)}, ${formatRub(calculateShiftPay(shift))}`;
      })
      .join("\n\n")
  );
}

async function sendAssignmentMessage(
  env: WorkerEnv,
  telegramUserId: string | undefined,
  admin: Admin,
  shift: Shift,
  assignment: Assignment,
  title: string
): Promise<void> {
  const chatId = telegramChatId(telegramUserId);
  if (!chatId) return;
  const branchName = shiftBranchName(memoryState, shift);
  await sendTelegramMessage(
    env,
    chatId,
    `${title}\n\n${shift.title}\n${dateLabel(shift.date)} ${shift.startTime}—${shift.endTime}, ${branchName}\nСтатус: ${statusText(assignment.status)}\nОплата: ${formatRub(calculateShiftPay(shift))}\n\n${admin.fullName}, если планы изменятся, отмените смену заранее.`,
    "Открыть смену"
  );
}

async function sendTelegramMessage(
  env: WorkerEnv,
  chatId: number,
  text: string,
  buttonText = "Открыть смены",
  webAppUrl = env.SANTAL_WEBAPP_URL
): Promise<boolean> {
  try {
    await callTelegramApi(env.TELEGRAM_BOT_TOKEN, "sendMessage", {
      chat_id: chatId,
      text,
      reply_markup: {
        inline_keyboard: [[{ text: buttonText, web_app: { url: webAppUrl || "https://santal-shift-app.taigisch11.workers.dev/" } }]]
      }
    });
    return true;
  } catch (error) {
    console.error(error);
    return false;
  }
}

function telegramChatId(value?: string): number | undefined {
  if (!value || !/^\d+$/.test(value)) return undefined;
  return Number(value);
}

function assignmentActionTitle(action: string): string {
  return (
    {
      confirm: "Смена подтверждена",
      "check-in": "Отметка на месте принята",
      complete: "Смена завершена",
      cancel: "Смена отменена"
    }[action] || "Статус смены обновлен"
  );
}

function findBranch(state: AppState, branchId: string): Branch | undefined {
  return state.branches.find((branch) => branch.id === branchId);
}

function shiftBranchName(state: AppState, shift: Shift): string {
  return findBranch(state, shift.branchId)?.name ?? "филиал";
}

function statusText(status: string): string {
  return (
    {
      assigned: "назначена",
      confirmed: "подтверждена",
      checked_in: "на месте",
      completed: "завершена",
      cancelled: "отменена"
    }[status] || status
  );
}

function operationalToday(state: AppState): string {
  const realToday = zonedIsoDate(new Date(), state.settings.timezone);
  const dates = [...new Set(state.shifts.map((shift) => shift.date))].sort();
  return dates.some((date) => date >= realToday) ? realToday : dates[0] ?? realToday;
}

function zonedIsoDate(date: Date, timeZone: string): string {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(date);
  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;
  return `${year}-${month}-${day}`;
}

function addDaysIso(date: string, days: number): string {
  const next = new Date(`${date}T00:00:00.000Z`);
  next.setUTCDate(next.getUTCDate() + days);
  return next.toISOString().slice(0, 10);
}

function dateLabel(date: string): string {
  return new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "short" }).format(new Date(`${date}T00:00:00.000Z`));
}

function formatRub(value: number): string {
  return `${new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 0 }).format(value)} ₽`;
}

function takeShiftMessage(reason: string): string {
  return (
    {
      not_found: "Смена не найдена",
      inactive_admin: "Профиль не активен для записи на смены",
      not_allowed_branch: "Эта смена недоступна для ваших филиалов",
      duplicate: "Вы уже записаны на эту смену",
      filled: "Смену уже разобрали",
      overlap: "Смена пересекается с вашим графиком",
      closed: "Смена закрыта для записи"
    }[reason] || "Не удалось взять смену"
  );
}
