import { Router } from "express";
import { markDoneSchema, paymentInputSchema } from "./payments.schemas";
import { createPayment, deletePayment, listPayments, markPaymentPaid, updatePayment } from "./payments.service";

export const paymentsRouter = Router();

paymentsRouter.get("/", async (req, res, next) => {
  try {
    res.json(await listPayments(req.user!.id));
  } catch (error) {
    next(error);
  }
});

paymentsRouter.post("/", async (req, res, next) => {
  try {
    res.status(201).json(await createPayment(req.user!.id, paymentInputSchema.parse(req.body)));
  } catch (error) {
    next(error);
  }
});

paymentsRouter.patch("/:id", async (req, res, next) => {
  try {
    res.json(await updatePayment(req.user!.id, req.params.id, paymentInputSchema.partial().parse(req.body)));
  } catch (error) {
    next(error);
  }
});

paymentsRouter.patch("/:id/mark-paid", async (req, res, next) => {
  try {
    const input = markDoneSchema.parse(req.body);
    res.json(await markPaymentPaid(req.user!.id, req.params.id, input.actualDate));
  } catch (error) {
    next(error);
  }
});

paymentsRouter.delete("/:id", async (req, res, next) => {
  try {
    res.json(await deletePayment(req.user!.id, req.params.id));
  } catch (error) {
    next(error);
  }
});
