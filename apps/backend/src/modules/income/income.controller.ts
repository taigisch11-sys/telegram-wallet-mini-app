import { Router } from "express";
import { incomeInputSchema, markDoneSchema } from "./income.schemas";
import { createIncome, deleteIncome, listIncome, markIncomeReceived, updateIncome } from "./income.service";

export const incomeRouter = Router();

incomeRouter.get("/", async (req, res, next) => {
  try {
    res.json(await listIncome(req.user!.id));
  } catch (error) {
    next(error);
  }
});

incomeRouter.post("/", async (req, res, next) => {
  try {
    res.status(201).json(await createIncome(req.user!.id, incomeInputSchema.parse(req.body)));
  } catch (error) {
    next(error);
  }
});

incomeRouter.patch("/:id", async (req, res, next) => {
  try {
    res.json(await updateIncome(req.user!.id, req.params.id, incomeInputSchema.partial().parse(req.body)));
  } catch (error) {
    next(error);
  }
});

incomeRouter.patch("/:id/mark-received", async (req, res, next) => {
  try {
    const input = markDoneSchema.parse(req.body);
    res.json(await markIncomeReceived(req.user!.id, req.params.id, input.actualDate));
  } catch (error) {
    next(error);
  }
});

incomeRouter.delete("/:id", async (req, res, next) => {
  try {
    res.json(await deleteIncome(req.user!.id, req.params.id));
  } catch (error) {
    next(error);
  }
});
