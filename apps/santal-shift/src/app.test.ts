import { afterEach, describe, expect, it, vi } from "vitest";
import { createApp, resetMemoryStateForTest } from "./app";
import type { WorkerEnv } from "./env";

const env: WorkerEnv = {
  APP_ENV: "test",
  GOOGLE_SHEET_ID: "sheet_test",
  SANTAL_WEBAPP_URL: "https://example.com/",
  TELEGRAM_BOT_TOKEN: "test:token",
  TELEGRAM_WEBHOOK_SECRET: "test-secret",
  ADMIN_SETUP_TOKEN: "setup-secret",
  ALLOW_WEB_PREVIEW: "true"
};

afterEach(() => {
  resetMemoryStateForTest();
  vi.unstubAllGlobals();
});

describe("Santal Shift worker API", () => {
  it("returns health status", async () => {
    const app = createApp();
    const response = await app.request("/health", {}, env);

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({ ok: true, app: "santal-shift" });
  });

  it("returns bootstrap state with branches, shifts and money", async () => {
    const app = createApp();
    const response = await app.request("/api/bootstrap", {}, env);
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.state.branches.length).toBeGreaterThan(0);
    expect(payload.state.visibleShifts.length).toBeGreaterThan(0);
    expect(payload.state.money.expected).toBeGreaterThan(0);
  });

  it("takes a shift through API and rejects a repeated request", async () => {
    const app = createApp();
    const body = JSON.stringify({ shiftId: "shift_20260520_csm2_admin_morning" });
    const headers = { "Content-Type": "application/json", "X-Demo-Admin-Id": "admin_nikita" };

    const first = await app.request("/api/shifts/take", { method: "POST", headers, body }, env);
    const second = await app.request("/api/shifts/take", { method: "POST", headers, body }, env);

    expect(first.status).toBe(200);
    await expect(first.json()).resolves.toMatchObject({ ok: true });
    expect(second.status).toBe(409);
    await expect(second.json()).resolves.toMatchObject({ ok: false, reason: "duplicate" });
  });

  it("rejects production bootstrap without Telegram initData", async () => {
    const app = createApp();
    const response = await app.request(
      "/api/bootstrap",
      {},
      {
        ...env,
        APP_ENV: "production",
        ALLOW_WEB_PREVIEW: "false"
      }
    );

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toMatchObject({
      ok: false,
      message: "Откройте приложение из Telegram"
    });
  });

  it("returns unauthorized for Telegram initData with a bad signature", async () => {
    const app = createApp();
    const initData = new URLSearchParams({
      user: JSON.stringify({ id: 42, first_name: "Test" }),
      auth_date: String(Math.floor(Date.now() / 1000)),
      hash: "bad_signature"
    }).toString();
    const response = await app.request(
      "/api/bootstrap",
      { headers: { "X-Telegram-Init-Data": initData } },
      {
        ...env,
        APP_ENV: "production",
        ALLOW_WEB_PREVIEW: "false"
      }
    );

    expect(response.status).toBe(401);
  });

  it("opens production bootstrap in temporary memory mode when Google Sheets storage is not configured", async () => {
    const app = createApp();
    const initData = await signedTelegramInitData({ id: 42, first_name: "Анна" }, env.TELEGRAM_BOT_TOKEN);
    const response = await app.request(
      "/api/bootstrap",
      { headers: { "X-Telegram-Init-Data": initData } },
      {
        ...env,
        APP_ENV: "production",
        ALLOW_WEB_PREVIEW: "false",
        GOOGLE_SERVICE_ACCOUNT_EMAIL: "",
        GOOGLE_PRIVATE_KEY: ""
      }
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.state.sync).toMatchObject({
      connected: false,
      mode: "memory"
    });
    expect(payload.state.visibleShifts.length).toBeGreaterThan(0);
  });

  it("reports release readiness without leaking secret values", async () => {
    const app = createApp();
    const response = await app.request(
      "/api/release/readiness",
      {},
      {
        ...env,
        APP_ENV: "production",
        ALLOW_WEB_PREVIEW: "false",
        GOOGLE_SERVICE_ACCOUNT_EMAIL: "",
        GOOGLE_PRIVATE_KEY: ""
      }
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.ready).toBe(false);
    expect(payload.marketReadinessPercent).toBeLessThan(100);
    expect(payload.criticalBlockers.map((blocker: { id: string }) => blocker.id)).toEqual([
      "telegramTokenRotation",
      "googleServiceAccountEmail",
      "googlePrivateKey"
    ]);
    expect(payload.nextActions.length).toBeGreaterThan(0);
    expect(payload.checks.googleServiceAccountEmail.ok).toBe(false);
    expect(payload.checks.googlePrivateKey.ok).toBe(false);
    expect(JSON.stringify(payload)).not.toContain("test-secret");
  });

  it("reports full market readiness when all production gates are configured", async () => {
    const app = createApp();
    const response = await app.request(
      "/api/release/readiness",
      {},
      {
        ...env,
        APP_ENV: "production",
        ALLOW_WEB_PREVIEW: "false",
        GOOGLE_SERVICE_ACCOUNT_EMAIL: "santal-service@example.iam.gserviceaccount.com",
        GOOGLE_PRIVATE_KEY: "-----BEGIN PRIVATE KEY-----\ntest\n-----END PRIVATE KEY-----",
        TELEGRAM_TOKEN_ROTATED_AT: "2026-06-06T00:00:00.000Z"
      }
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.ready).toBe(true);
    expect(payload.marketReadinessPercent).toBe(100);
    expect(payload.criticalBlockers).toEqual([]);
    expect(payload.nextActions).toEqual([]);
  });

  it("answers Telegram bot commands and ignores duplicate update ids", async () => {
    const fetchMock = vi.fn(async () => Response.json({ ok: true }));
    vi.stubGlobal("fetch", fetchMock);
    const app = createApp();
    const update = {
      update_id: 9001,
      message: { chat: { id: 7001 }, text: "/start" }
    };

    const first = await app.request(
      "/api/telegram/webhook",
      { method: "POST", headers: { "Content-Type": "application/json", "X-Telegram-Bot-Api-Secret-Token": "test-secret" }, body: JSON.stringify(update) },
      env
    );
    const second = await app.request(
      "/api/telegram/webhook",
      { method: "POST", headers: { "Content-Type": "application/json", "X-Telegram-Bot-Api-Secret-Token": "test-secret" }, body: JSON.stringify(update) },
      env
    );

    expect(first.status).toBe(200);
    expect(second.status).toBe(200);
    await expect(second.json()).resolves.toMatchObject({ duplicate: true });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const body = JSON.parse(String(fetchMock.mock.calls[0][1]?.body));
    expect(body.chat_id).toBe(7001);
    expect(body.text).toContain("не зарегистрированы");
    expect(body.reply_markup.inline_keyboard[0][0].web_app.url).toBe(env.SANTAL_WEBAPP_URL);
  });

  it("allows production shift mutations in temporary memory mode when Google Sheets storage is not configured", async () => {
    const fetchMock = vi.fn(async () => Response.json({ ok: true }));
    vi.stubGlobal("fetch", fetchMock);
    const app = createApp();
    const initData = await signedTelegramInitData({ id: 42, first_name: "Анна" }, env.TELEGRAM_BOT_TOKEN);

    const response = await app.request(
      "/api/shifts/take",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shiftId: "shift_20260522_csm10_admin_full", initData })
      },
      {
        ...env,
        APP_ENV: "production",
        ALLOW_WEB_PREVIEW: "false",
        GOOGLE_SERVICE_ACCOUNT_EMAIL: "",
        GOOGLE_PRIVATE_KEY: ""
      }
    );

    expect(response.status).toBe(200);
    const payload = await response.json();
    expect(payload.ok).toBe(true);
    expect(payload.state.sync).toMatchObject({
      connected: false,
      mode: "memory"
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("fails closed when the production Telegram webhook secret is missing", async () => {
    const app = createApp();
    const response = await app.request(
      "/api/telegram/webhook",
      { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ update_id: 1 }) },
      {
        ...env,
        APP_ENV: "production",
        ALLOW_WEB_PREVIEW: "false",
        TELEGRAM_WEBHOOK_SECRET: ""
      }
    );

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toMatchObject({
      ok: false,
      message: "Telegram webhook secret не настроен"
    });
  });

  it("rejects Telegram webhook calls with a wrong secret", async () => {
    const app = createApp();
    const response = await app.request(
      "/api/telegram/webhook",
      { method: "POST", headers: { "Content-Type": "application/json", "X-Telegram-Bot-Api-Secret-Token": "wrong" }, body: JSON.stringify({ update_id: 1 }) },
      {
        ...env,
        APP_ENV: "production",
        ALLOW_WEB_PREVIEW: "false"
      }
    );

    expect(response.status).toBe(403);
  });

  it("moves an assignment through confirm, check-in and complete actions", async () => {
    const app = createApp();
    const headers = { "Content-Type": "application/json", "X-Demo-Admin-Id": "admin_nikita" };
    const take = await app.request(
      "/api/shifts/take",
      {
        method: "POST",
        headers,
        body: JSON.stringify({ shiftId: "shift_20260521_csm9_assistant_evening" })
      },
      env
    );
    const takePayload = await take.json();
    const assignmentId = takePayload.assignment.id;

    expect(take.status).toBe(200);

    for (const [action, expectedStatus] of [
      ["confirm", "confirmed"],
      ["check-in", "checked_in"],
      ["complete", "completed"]
    ]) {
      const response = await app.request(
        `/api/assignments/${assignmentId}/${action}`,
        { method: "POST", headers, body: JSON.stringify({}) },
        env
      );
      const payload = await response.json();
      const item = payload.state.myShifts.find((entry: { assignment: { id: string } }) => entry.assignment.id === assignmentId);

      expect(response.status).toBe(200);
      expect(item.assignment.status).toBe(expectedStatus);
    }
  });

  it("sends a Telegram confirmation after taking a shift from Mini App in preview mode", async () => {
    const fetchMock = vi.fn(async () => Response.json({ ok: true }));
    vi.stubGlobal("fetch", fetchMock);
    const app = createApp();
    const initData = await signedTelegramInitData({ id: 42, first_name: "Анна" }, env.TELEGRAM_BOT_TOKEN);

    const response = await app.request(
      "/api/shifts/take",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shiftId: "shift_20260522_csm10_admin_full", initData })
      },
      {
        ...env,
        APP_ENV: "test",
        ALLOW_WEB_PREVIEW: "true",
        GOOGLE_SERVICE_ACCOUNT_EMAIL: "",
        GOOGLE_PRIVATE_KEY: ""
      }
    );

    expect(response.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const body = JSON.parse(String(fetchMock.mock.calls[0][1]?.body));
    expect(body.chat_id).toBe(42);
    expect(body.text).toContain("Смена добавлена");
    expect(body.text).toContain("Оплата");
  });
});

async function signedTelegramInitData(user: Record<string, unknown>, botToken: string): Promise<string> {
  const params = new URLSearchParams({
    auth_date: String(Math.floor(Date.now() / 1000)),
    user: JSON.stringify(user)
  });
  const dataCheckString = [...params.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `${key}=${value}`)
    .join("\n");
  const secretKey = await hmacSha256(new TextEncoder().encode("WebAppData"), new TextEncoder().encode(botToken));
  const hash = toHex(await hmacSha256(secretKey, new TextEncoder().encode(dataCheckString)));
  params.set("hash", hash);
  return params.toString();
}

async function hmacSha256(key: Uint8Array, data: Uint8Array): Promise<Uint8Array> {
  const cryptoKey = await crypto.subtle.importKey("raw", key, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return new Uint8Array(await crypto.subtle.sign("HMAC", cryptoKey, data));
}

function toHex(bytes: Uint8Array): string {
  return [...bytes].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}
