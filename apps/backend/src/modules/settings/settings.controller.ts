import { Router } from "express";
import { settingsEditedBalanceSchema, settingsStartBalanceSchema } from "@wallet/shared";
import { updateEditedBalance, updateStartBalance } from "./settings.service";

export const settingsRouter = Router();

settingsRouter.patch("/start-balance", async (req, res, next) => {
  try {
    res.json(await updateStartBalance(req.user!.id, settingsStartBalanceSchema.parse(req.body)));
  } catch (error) {
    next(error);
  }
});

settingsRouter.patch("/edited-balance", async (req, res, next) => {
  try {
    res.json(await updateEditedBalance(req.user!.id, settingsEditedBalanceSchema.parse(req.body)));
  } catch (error) {
    next(error);
  }
});
