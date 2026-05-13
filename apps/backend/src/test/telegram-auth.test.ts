import crypto from "node:crypto";
import { describe, expect, it } from "vitest";
import { isDevAuthBypassAllowed } from "../middleware/auth";
import { validateTelegramInitData } from "../lib/telegram";

const botToken = "123456:test-token";

describe("Telegram auth security", () => {
  it("rejects Telegram initData older than 24 hours", () => {
    const initData = signedInitData({
      auth_date: Math.floor(Date.now() / 1000) - 25 * 60 * 60,
      query_id: "test-query",
      user: JSON.stringify({ id: 1001, first_name: "Test" })
    });

    expect(() => validateTelegramInitData(initData, botToken)).toThrow("Telegram auth data is expired");
  });

  it("does not allow the dev test token in production", () => {
    expect(isDevAuthBypassAllowed({ NODE_ENV: "production", DEV_AUTH_BYPASS: "true" })).toBe(false);
    expect(isDevAuthBypassAllowed({ NODE_ENV: "development", DEV_AUTH_BYPASS: "true" })).toBe(true);
  });
});

function signedInitData(input: Record<string, string | number>) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(input)) params.set(key, String(value));

  const dataCheckString = [...params.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join("\n");
  const secretKey = crypto.createHmac("sha256", "WebAppData").update(botToken).digest();
  const hash = crypto.createHmac("sha256", secretKey).update(dataCheckString).digest("hex");
  params.set("hash", hash);
  return params.toString();
}
