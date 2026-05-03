import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { AppError } from "../lib/errors";

export function errorHandler(error: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (error instanceof AppError) {
    return res.status(error.statusCode).json({ error: { code: error.code, message: error.message } });
  }

  if (error instanceof ZodError) {
    return res.status(400).json({
      error: {
        code: "validation_error",
        message: error.issues.map((issue) => issue.message).join(", ")
      }
    });
  }

  console.error(error);
  return res.status(500).json({ error: { code: "internal_error", message: "Internal server error" } });
}
