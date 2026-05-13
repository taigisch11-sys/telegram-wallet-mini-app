import { Router } from "express";
import { createCategory, deleteCategory, listCategories, updateCategory } from "./categories.service";

export const categoriesRouter = Router();

categoriesRouter.get("/", async (req, res, next) => {
  try {
    res.json(await listCategories(req.user!.id));
  } catch (error) {
    next(error);
  }
});

categoriesRouter.post("/", async (req, res, next) => {
  try {
    res.status(201).json(await createCategory(req.user!.id, req.body));
  } catch (error) {
    next(error);
  }
});

categoriesRouter.patch("/:id", async (req, res, next) => {
  try {
    res.json(await updateCategory(req.user!.id, req.params.id, req.body));
  } catch (error) {
    next(error);
  }
});

categoriesRouter.delete("/:id", async (req, res, next) => {
  try {
    res.json(await deleteCategory(req.user!.id, req.params.id));
  } catch (error) {
    next(error);
  }
});
