import { Router } from "express";
import { getTimeseries } from "./analytics.service";

export const analyticsRouter = Router();

analyticsRouter.get("/timeseries", async (req, res, next) => {
  try {
    const rawPeriod = String(req.query.period ?? "month");
    const period = ["week", "month", "quarter", "year"].includes(rawPeriod) ? (rawPeriod as "week" | "month" | "quarter" | "year") : "month";
    res.json(await getTimeseries(req.user!.id, period));
  } catch (error) {
    next(error);
  }
});
