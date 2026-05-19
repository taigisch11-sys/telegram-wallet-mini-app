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
    const body = JSON.stringify({ shiftId: "shift_20260520_central_morning" });
    const headers = { "Content-Type": "application/json", "X-Demo-Admin-Id": "admin_nikita" };

    const first = await app.request("/api/shifts/take", { method: "POST", headers, body }, env);
    const second = await app.request("/api/shifts/take", { method: "POST", headers, body }, env);

    expect(first.status).toBe(200);
    await expect(first.json()).resolves.toMatchObject({ ok: true });
    expect(second.status).toBe(409);
    await expect(second.json()).resolves.toMatchObject({ ok: false, reason: "duplicate" });
  });
});
