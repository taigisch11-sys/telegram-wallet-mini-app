import crypto from "node:crypto";
import { AppError } from "./errors";

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

  if (!hash || !botToken) {
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

  return params;
}

export function extractTelegramUser(params: URLSearchParams): TelegramInitUser {
  const rawUser = params.get("user");
  if (!rawUser) {
    throw new AppError(401, "telegram_auth_invalid", "Telegram user payload is missing");
  }

  return JSON.parse(rawUser) as TelegramInitUser;
}
