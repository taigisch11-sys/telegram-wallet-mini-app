import { env } from "./env";
import { createApp } from "./app";
import { createTelegramBot, startTelegramBot } from "./modules/telegram/telegram-bot";

const bot = createTelegramBot();
const app = createApp(bot);

app.listen(env.PORT, async () => {
  console.log(`Backend listening on http://localhost:${env.PORT}`);
  await startTelegramBot(bot);
});
