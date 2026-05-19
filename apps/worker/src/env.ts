export type WorkerEnv = {
  DATABASE_URL: string;
  JWT_SECRET: string;
  TELEGRAM_BOT_TOKEN: string;
  TELEGRAM_WEBHOOK_SECRET?: string;
  TELEGRAM_WEBAPP_URL: string;
  TRAINING_TELEGRAM_BOT_TOKEN?: string;
  TRAINING_TELEGRAM_WEBHOOK_SECRET?: string;
  TRAINING_TELEGRAM_WEBAPP_URL?: string;
  TRAINING_JWT_SECRET?: string;
  FRONTEND_ORIGIN: string;
  DEV_AUTH_BYPASS?: string;
  NODE_ENV?: string;
};

export function isDevAuthEnabled(env: WorkerEnv) {
  return env.NODE_ENV === "development" && env.DEV_AUTH_BYPASS === "true";
}
