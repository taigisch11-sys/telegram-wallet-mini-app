import { Router } from "express";
import { getDashboardState } from "./state.service";

export const stateRouter = Router();

stateRouter.get("/", async (req, res, next) => {
  try {
    res.json(await getDashboardState(req.user!.id));
  } catch (error) {
    next(error);
  }
});
