import { Router } from "express";
import { accountInputSchema, reconcileSchema } from "./accounts.schemas";
import { createAccount, deleteAccount, listAccounts, reconcileBalances, updateAccount } from "./accounts.service";

export const accountsRouter = Router();

accountsRouter.get("/", async (req, res, next) => {
  try {
    res.json(await listAccounts(req.user!.id));
  } catch (error) {
    next(error);
  }
});

accountsRouter.post("/", async (req, res, next) => {
  try {
    res.status(201).json(await createAccount(req.user!.id, accountInputSchema.parse(req.body)));
  } catch (error) {
    next(error);
  }
});

accountsRouter.patch("/:id", async (req, res, next) => {
  try {
    res.json(await updateAccount(req.user!.id, req.params.id, accountInputSchema.partial().parse(req.body)));
  } catch (error) {
    next(error);
  }
});

accountsRouter.delete("/:id", async (req, res, next) => {
  try {
    res.json(await deleteAccount(req.user!.id, req.params.id));
  } catch (error) {
    next(error);
  }
});

accountsRouter.post("/reconcile", async (req, res, next) => {
  try {
    res.json(await reconcileBalances(req.user!.id, reconcileSchema.parse(req.body)));
  } catch (error) {
    next(error);
  }
});
