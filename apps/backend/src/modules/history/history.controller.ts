import { Router } from "express";
import { listHistory } from "./history.service";

export const historyRouter = Router();

historyRouter.get("/", async (req, res, next) => {
  try {
    res.json(await listHistory(req.user!.id));
  } catch (error) {
    next(error);
  }
});
