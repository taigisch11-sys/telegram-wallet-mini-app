export type WorkerEnv = {
  DATABASE_URL: string;
  JWT_SECRET: string;
  TELEGRAM_BOT_TOKEN: string;
  TELEGRAM_WEBHOOK_SECRET?: string;
  TELEGRAM_WEBAPP_URL: string;
  FRONTEND_ORIGIN: string;
  DEV_AUTH_BYPASS?: string;
};

export function isDevAuthEnabled(env: WorkerEnv) {
  return env.DEV_AUTH_BYPASS === "true";
}
