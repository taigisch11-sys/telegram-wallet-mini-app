import type TelegramBot from "node-telegram-bot-api";
import { Router } from "express";
import { env } from "../../env";
import { AppError } from "../../lib/errors";
import { processTelegramUpdate } from "./telegram-bot";

export function createTelegramWebhookRouter(bot: TelegramBot | null) {
  const router = Router();

  router.post("/webhook", async (req, res, next) => {
    try {
      if (!bot) throw new AppError(503, "telegram_disabled", "Telegram bot is not configured");
      if (env.TELEGRAM_WEBHOOK_SECRET && req.header("x-telegram-bot-api-secret-token") !== env.TELEGRAM_WEBHOOK_SECRET) {
        throw new AppError(401, "telegram_webhook_invalid", "Invalid Telegram webhook secret");
      }
      await processTelegramUpdate(bot, req.body);
      res.json({ ok: true });
    } catch (error) {
      next(error);
    }
  });

  return router;
}
