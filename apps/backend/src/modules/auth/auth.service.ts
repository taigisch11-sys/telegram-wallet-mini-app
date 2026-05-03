import { env } from "../../env";
import { signJwt } from "../../lib/jwt";
import { prisma } from "../../lib/prisma";
import { extractTelegramUser, validateTelegramInitData } from "../../lib/telegram";
import { mapUser } from "../finance/finance-mappers";

export async function authenticateTelegram(initData: string) {
  const params = validateTelegramInitData(initData, env.TELEGRAM_BOT_TOKEN);
  const telegramUser = extractTelegramUser(params);

  const user = await prisma.user.upsert({
    where: { telegramId: String(telegramUser.id) },
    update: {
      username: telegramUser.username ?? null,
      firstName: telegramUser.first_name ?? null
    },
    create: {
      telegramId: String(telegramUser.id),
      username: telegramUser.username ?? null,
      firstName: telegramUser.first_name ?? null,
      settings: {
        create: {
          currentMonth: new Date().toISOString().slice(0, 7),
          startBalance: "0.00"
        }
      }
    }
  });

  await prisma.settings.upsert({
    where: { userId: user.id },
    update: {},
    create: {
      userId: user.id,
      currentMonth: new Date().toISOString().slice(0, 7),
      startBalance: "0.00"
    }
  });

  const token = await signJwt({ userId: user.id, telegramId: user.telegramId });
  return { token, user: mapUser(user) };
}
