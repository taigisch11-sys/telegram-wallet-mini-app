import { DEFAULT_CATEGORIES, categoryInputSchema } from "@wallet/shared";
import { notFound } from "../../lib/errors";
import { prisma } from "../../lib/prisma";
import { mapCategory } from "../finance/finance-mappers";

export async function ensureDefaultCategories(userId: string) {
  await prisma.$transaction(
    DEFAULT_CATEGORIES.map((category) =>
      prisma.category.upsert({
        where: { userId_name_type: { userId, name: category.name, type: category.type } },
        update: {},
        create: { userId, ...category }
      })
    )
  );
}

export async function listCategories(userId: string) {
  await ensureDefaultCategories(userId);
  return (await prisma.category.findMany({ where: { userId }, orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }] })).map(mapCategory);
}

export async function createCategory(userId: string, body: unknown) {
  const input = categoryInputSchema.parse(body);
  const category = await prisma.category.create({ data: { userId, ...input } });
  await prisma.history.create({ data: { userId, type: "category_created", payload: { id: category.id, name: category.name, type: category.type } } });
  return mapCategory(category);
}

export async function updateCategory(userId: string, id: string, body: unknown) {
  const input = categoryInputSchema.partial().parse(body);
  await ensureCategoryBelongsToUser(userId, id);
  const category = await prisma.category.update({ where: { id }, data: input });
  await prisma.history.create({ data: { userId, type: "category_updated", payload: { id, ...input } } });
  return mapCategory(category);
}

export async function deleteCategory(userId: string, id: string) {
  await ensureCategoryBelongsToUser(userId, id);
  await prisma.category.delete({ where: { id } });
  await prisma.history.create({ data: { userId, type: "category_deleted", payload: { id } } });
  return { ok: true };
}

export async function ensureCategoryBelongsToUser(userId: string, categoryId?: string | null) {
  if (!categoryId) return null;
  const category = await prisma.category.findFirst({ where: { id: categoryId, userId } });
  if (!category) throw notFound("Category not found");
  return category;
}

export async function getDefaultCategoryId(userId: string, name: string) {
  await ensureDefaultCategories(userId);
  const category = await prisma.category.findFirst({ where: { userId, name }, select: { id: true } });
  return category?.id ?? null;
}
