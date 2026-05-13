import crypto from "node:crypto";
import { AppError } from "./errors";

const telegramAuthMaxAgeSeconds = 24 * 60 * 60;

export type TelegramInitUser = {
  id: number;
  username?: string;
  first_name?: string;
};

export function parseTelegramInitData(initData: string) {
  return new URLSearchParams(initData);
}

export function validateTelegramInitData(initData: string, botToken: string) {
  const params = parseTelegramInitData(initData);
  const hash = params.get("hash");

  if (!hash || !/^[a-f0-9]{64}$/i.test(hash) || !botToken) {
    throw new AppError(401, "telegram_auth_invalid", "Invalid Telegram auth data");
  }

  params.delete("hash");
  const dataCheckString = [...params.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join("\n");

  const secretKey = crypto.createHmac("sha256", "WebAppData").update(botToken).digest();
  const calculatedHash = crypto.createHmac("sha256", secretKey).update(dataCheckString).digest("hex");

  if (!crypto.timingSafeEqual(Buffer.from(calculatedHash, "hex"), Buffer.from(hash, "hex"))) {
    throw new AppError(401, "telegram_auth_invalid", "Invalid Telegram auth data");
  }

  assertFreshAuthDate(params.get("auth_date"));

  return params;
}

function assertFreshAuthDate(value: string | null) {
  const authDate = Number(value);
  const now = Math.floor(Date.now() / 1000);
  if (!Number.isFinite(authDate)) {
    throw new AppError(401, "telegram_auth_expired", "Telegram auth data is expired");
  }
  if (now - authDate > telegramAuthMaxAgeSeconds || authDate - now > 60) {
    throw new AppError(401, "telegram_auth_expired", "Telegram auth data is expired");
  }
}

export function extractTelegramUser(params: URLSearchParams): TelegramInitUser {
  const rawUser = params.get("user");
  if (!rawUser) {
    throw new AppError(401, "telegram_auth_invalid", "Telegram user payload is missing");
  }

  return JSON.parse(rawUser) as TelegramInitUser;
}
