import { jwtVerify, SignJWT } from "jose";
import type { Context, MiddlewareHandler } from "hono";
import type { WorkerEnv } from "./env";
import { isDevAuthEnabled } from "./env";
import { currentMonth } from "./money";
import { id, sql } from "./db";

export type AuthUser = {
  id: string;
  telegramId: string;
  username: string | null;
  firstName: string | null;
  createdAt: string;
};

const TEST_TELEGRAM_ID = "100000001";

function secret(env: WorkerEnv) {
  return new TextEncoder().encode(env.JWT_SECRET);
}

export async function signToken(env: WorkerEnv, userId: string) {
  return new SignJWT({ sub: userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(secret(env));
}

export async function verifyToken(env: WorkerEnv, token: string) {
  const result = await jwtVerify(token, secret(env));
  return result.payload.sub;
}

export async function findOrCreateUser(
  env: WorkerEnv,
  input: { telegramId: string; username?: string | null; firstName?: string | null }
) {
  const db = sql(env);
  const existing = await db`
    SELECT id, "telegramId", username, "firstName", "createdAt"
    FROM "User"
    WHERE "telegramId" = ${input.telegramId}
    LIMIT 1
  `;

  let user = existing[0] as AuthUser | undefined;
  if (!user) {
    const userId = id();
    const inserted = await db`
      INSERT INTO "User" (id, "telegramId", username, "firstName", "createdAt")
      VALUES (${userId}, ${input.telegramId}, ${input.username ?? null}, ${input.firstName ?? null}, NOW())
      RETURNING id, "telegramId", username, "firstName", "createdAt"
    `;
    user = inserted[0] as AuthUser;
  }

  await db`
    INSERT INTO "Settings" ("userId", "currentMonth", "startBalance", "editedBalance")
    VALUES (${user.id}, ${currentMonth()}, 0, NULL)
    ON CONFLICT ("userId") DO NOTHING
  `;

  return user;
}

export async function authUser(c: Context<any>) {
  const user = c.get("user") as AuthUser | undefined;
  if (!user) throw new Error("Unauthorized");
  return user;
}

export const requireAuth: MiddlewareHandler<any> = async (c, next) => {
  const header = c.req.header("Authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice("Bearer ".length) : "";
  if (!token) return c.json({ error: { message: "Необходима авторизация" } }, 401);

  let userId: string | undefined;
  if (token === "test-token" && isDevAuthEnabled(c.env)) {
    const user = await findOrCreateUser(c.env, {
      telegramId: TEST_TELEGRAM_ID,
      username: "demo_wallet",
      firstName: "Demo"
    });
    c.set("user", user);
    await next();
    return;
  }

  try {
    userId = await verifyToken(c.env, token);
  } catch {
    return c.json({ error: { message: "Недействительный токен" } }, 401);
  }

  if (!userId) return c.json({ error: { message: "Недействительный токен" } }, 401);
  const rows = await sql(c.env)`
    SELECT id, "telegramId", username, "firstName", "createdAt"
    FROM "User"
    WHERE id = ${userId}
    LIMIT 1
  `;
  if (!rows[0]) return c.json({ error: { message: "Пользователь не найден" } }, 401);
  c.set("user", rows[0]);
  await next();
};
