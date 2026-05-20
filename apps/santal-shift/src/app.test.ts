import { describe, expect, it } from "vitest";
import { createApp } from "./app";
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

  it("opens a Telegram demo session while Google Sheets credentials are missing", async () => {
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
    expect(payload.state.sync.connected).toBe(false);
    expect(payload.state.admin.status).toBe("active");
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
    expect(payload.checks.googleServiceAccountEmail.ok).toBe(false);
    expect(payload.checks.googlePrivateKey.ok).toBe(false);
    expect(JSON.stringify(payload)).not.toContain("test-secret");
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
