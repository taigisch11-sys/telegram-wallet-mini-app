import { Router } from "express";
import { debtInputSchema } from "./debts.schemas";
import { createDebt, deleteDebt, listDebts, updateDebt } from "./debts.service";

export const debtsRouter = Router();

debtsRouter.get("/", async (req, res, next) => {
  try {
    res.json(await listDebts(req.user!.id));
  } catch (error) {
    next(error);
  }
});

debtsRouter.post("/", async (req, res, next) => {
  try {
    res.status(201).json(await createDebt(req.user!.id, debtInputSchema.parse(req.body)));
  } catch (error) {
    next(error);
  }
});

debtsRouter.patch("/:id", async (req, res, next) => {
  try {
    res.json(await updateDebt(req.user!.id, req.params.id, debtInputSchema.partial().parse(req.body)));
  } catch (error) {
    next(error);
  }
});

debtsRouter.delete("/:id", async (req, res, next) => {
  try {
    res.json(await deleteDebt(req.user!.id, req.params.id));
  } catch (error) {
    next(error);
  }
});
