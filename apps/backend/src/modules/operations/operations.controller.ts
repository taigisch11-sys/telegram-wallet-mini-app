import { Router } from "express";
import { createOperation, listOperations } from "./operations.service";

export const operationsRouter = Router();

operationsRouter.get("/", async (req, res, next) => {
  try {
    res.json(await listOperations(req.user!.id));
  } catch (error) {
    next(error);
  }
});

operationsRouter.post("/", async (req, res, next) => {
  try {
    res.status(201).json(await createOperation(req.user!.id, req.body));
  } catch (error) {
    next(error);
  }
});
