import path from "node:path";
import dotenv from "dotenv";
import { z } from "zod";

dotenv.config({ path: path.resolve(process.cwd(), "../../.env"), override: false });
dotenv.config({ override: false });

const envSchema = z.object({
  NODE_ENV: z.string().default("development"),
  BOT_MODE: z.enum(["polling", "webhook"]).default("polling"),
  DATABASE_URL: z.string().default("postgresql://postgres:postgres@localhost:5432/telegram_wallet"),
  JWT_SECRET: z.string().min(16).default("local-development-secret-change-me-please"),
  PORT: z.coerce.number().default(4000),
  TELEGRAM_BOT_TOKEN: z.string().default(""),
  TELEGRAM_WEBAPP_URL: z.string().default("http://localhost:5173"),
  TELEGRAM_WEBHOOK_URL: z.string().optional(),
  TELEGRAM_WEBHOOK_SECRET: z.string().optional(),
  FRONTEND_ORIGIN: z.string().default("http://localhost:5173"),
  DEV_AUTH_BYPASS: z.enum(["true", "false"]).default("true")
});

export const env = envSchema.parse(process.env);
