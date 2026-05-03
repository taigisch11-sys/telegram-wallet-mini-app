import { Router } from "express";
import { getTimeseries } from "./analytics.service";

export const analyticsRouter = Router();

analyticsRouter.get("/timeseries", async (req, res, next) => {
  try {
    const period = String(req.query.period ?? "month") as "week" | "month" | "quarter" | "year";
    res.json(await getTimeseries(req.user!.id, period));
  } catch (error) {
    next(error);
  }
});
