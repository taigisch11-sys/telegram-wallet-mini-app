import TelegramBot from "node-telegram-bot-api";
import { env } from "../../env";
import { telegramUpdateStore, shouldProcessUpdate } from "./telegram.service";

export function createTelegramBot() {
  if (!env.TELEGRAM_BOT_TOKEN) return null;
  const bot = new TelegramBot(env.TELEGRAM_BOT_TOKEN, { polling: false });

  bot.onText(/\/start/, async (message) => {
    await bot.sendMessage(message.chat.id, "Откройте Кошелек, чтобы сверить баланс и план платежей.", {
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: "Открыть Кошелек",
              web_app: { url: env.TELEGRAM_WEBAPP_URL }
            }
          ]
        ]
      }
    });
  });

  return bot;
}

export async function startTelegramBot(bot: TelegramBot | null) {
  if (!bot) return;
  await bot.setChatMenuButton({
    menu_button: {
      type: "web_app",
      text: "Кошелек",
      web_app: { url: env.TELEGRAM_WEBAPP_URL }
    }
  });

  if (env.BOT_MODE === "polling") {
    await bot.startPolling();
  } else if (env.TELEGRAM_WEBHOOK_URL) {
    await bot.setWebHook(env.TELEGRAM_WEBHOOK_URL, env.TELEGRAM_WEBHOOK_SECRET ? { secret_token: env.TELEGRAM_WEBHOOK_SECRET } : undefined);
  }
}

export async function processTelegramUpdate(bot: TelegramBot, update: TelegramBot.Update) {
  if (!(await shouldProcessUpdate(BigInt(update.update_id), telegramUpdateStore))) return;
  bot.processUpdate(update);
}
