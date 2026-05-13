import type { NextFunction, Request, Response } from "express";
import { env } from "../env";
import { AppError } from "../lib/errors";
import { prisma } from "../lib/prisma";
import { verifyJwt } from "../lib/jwt";

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        telegramId: string;
      };
    }
  }
}

export async function requireAuth(req: Request, _res: Response, next: NextFunction) {
  try {
    const header = req.header("authorization");
    const token = header?.startsWith("Bearer ") ? header.slice(7) : null;

    if (isDevAuthBypassAllowed(env) && token === "test-token") {
      const user = await prisma.user.upsert({
        where: { telegramId: "100000001" },
        update: {},
        create: { telegramId: "100000001", username: "demo_wallet", firstName: "Demo" }
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
      req.user = { id: user.id, telegramId: user.telegramId };
      return next();
    }

    if (!token) {
      throw new AppError(401, "unauthorized", "Authorization token is missing");
    }

    const payload = await verifyJwt(token);
    req.user = { id: payload.userId, telegramId: payload.telegramId };
    return next();
  } catch (error) {
    return next(error instanceof AppError ? error : new AppError(401, "unauthorized", "Invalid token"));
  }
}

export function isDevAuthBypassAllowed(input: { NODE_ENV: string; DEV_AUTH_BYPASS: string }) {
  return input.NODE_ENV !== "production" && input.DEV_AUTH_BYPASS === "true";
}
