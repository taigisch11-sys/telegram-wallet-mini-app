import { badRequest, notFound } from "../../lib/errors";
import { prisma } from "../../lib/prisma";
import { mapDebt } from "../finance/finance-mappers";

export async function listDebts(userId: string) {
  return (await prisma.debt.findMany({ where: { userId }, orderBy: { createdAt: "asc" } })).map(mapDebt);
}

export async function createDebt(userId: string, data: { name: string; amount: string }) {
  if (Number(data.amount) > 0) throw badRequest("Debt amount must be negative", "debt_amount_positive");
  const debt = await prisma.debt.create({ data: { userId, name: data.name, amount: data.amount } });
  await prisma.history.create({ data: { userId, type: "debt_created", payload: { name: data.name, amount: data.amount } } });
  return mapDebt(debt);
}

export async function updateDebt(userId: string, id: string, data: Partial<{ name: string; amount: string }>) {
  if (data.amount !== undefined && Number(data.amount) > 0) throw badRequest("Debt amount must be negative", "debt_amount_positive");
  await ensureDebt(userId, id);
  const debt = await prisma.debt.update({ where: { id }, data });
  await prisma.history.create({ data: { userId, type: "debt_updated", payload: { id, ...data } } });
  return mapDebt(debt);
}

export async function deleteDebt(userId: string, id: string) {
  await ensureDebt(userId, id);
  await prisma.debt.delete({ where: { id } });
  await prisma.history.create({ data: { userId, type: "debt_deleted", payload: { id } } });
  return { ok: true };
}

async function ensureDebt(userId: string, id: string) {
  const debt = await prisma.debt.findFirst({ where: { id, userId } });
  if (!debt) throw notFound("Debt not found");
  return debt;
}
