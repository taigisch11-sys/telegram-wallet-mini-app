import { Router } from "express";
import { markDoneSchema } from "@wallet/shared";
import { createPlannedOperation, createPlannedOperationSeries, deletePlannedOperation, listPlannedOperations, markPlannedOperationDone } from "./planned-operations.service";

export const plannedOperationsRouter = Router();

plannedOperationsRouter.get("/", async (req, res, next) => {
  try {
    res.json(await listPlannedOperations(req.user!.id));
  } catch (error) {
    next(error);
  }
});

plannedOperationsRouter.post("/", async (req, res, next) => {
  try {
    res.status(201).json(await createPlannedOperation(req.user!.id, req.body));
  } catch (error) {
    next(error);
  }
});

plannedOperationsRouter.post("/series", async (req, res, next) => {
  try {
    res.status(201).json(await createPlannedOperationSeries(req.user!.id, req.body));
  } catch (error) {
    next(error);
  }
});

plannedOperationsRouter.patch("/:id/mark-done", async (req, res, next) => {
  try {
    const input = markDoneSchema.parse(req.body ?? {});
    res.json(await markPlannedOperationDone(req.user!.id, req.params.id, input.actualDate));
  } catch (error) {
    next(error);
  }
});

plannedOperationsRouter.delete("/:id", async (req, res, next) => {
  try {
    res.json(await deletePlannedOperation(req.user!.id, req.params.id));
  } catch (error) {
    next(error);
  }
});
