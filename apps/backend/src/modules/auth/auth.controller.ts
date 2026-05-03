import { Router } from "express";
import { telegramAuthSchema } from "@wallet/shared";
import { authenticateTelegram } from "./auth.service";

export const authRouter = Router();

authRouter.post("/telegram", async (req, res, next) => {
  try {
    const input = telegramAuthSchema.parse(req.body);
    res.json(await authenticateTelegram(input.initData));
  } catch (error) {
    next(error);
  }
});
