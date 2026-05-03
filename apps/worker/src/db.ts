import { neon } from "@neondatabase/serverless";
import type { WorkerEnv } from "./env";

export function sql(env: WorkerEnv) {
  return neon(env.DATABASE_URL);
}

export function id() {
  return crypto.randomUUID();
}
