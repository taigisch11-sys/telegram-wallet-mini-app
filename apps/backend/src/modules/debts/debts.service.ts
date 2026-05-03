import { notFound } from "../../lib/errors";
import { prisma } from "../../lib/prisma";
import { mapDebt } from "../finance/finance-mappers";

export async function listDebts(userId: string) {
  return (await prisma.debt.findMany({ where: { userId }, orderBy: { createdAt: "asc" } })).map(mapDebt);
}

export async function createDebt(userId: string, data: { name: string; amount: string }) {
  const amount = normalizeDebtInputAmount(data.amount);
  const debt = await prisma.debt.create({ data: { userId, name: data.name, amount } });
  await prisma.history.create({ data: { userId, type: "debt_created", payload: { name: data.name, amount } } });
  return mapDebt(debt);
}

export async function updateDebt(userId: string, id: string, data: Partial<{ name: string; amount: string }>) {
  await ensureDebt(userId, id);
  const normalized = data.amount === undefined ? data : { ...data, amount: normalizeDebtInputAmount(data.amount) };
  const debt = await prisma.debt.update({ where: { id }, data: normalized });
  await prisma.history.create({ data: { userId, type: "debt_updated", payload: { id, ...normalized } } });
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

export function normalizeDebtInputAmount(value: string | number) {
  const parsed = Number(String(value).replace(",", "."));
  if (!Number.isFinite(parsed)) return "0.00";
  const amount = Math.abs(parsed);
  return amount === 0 ? "0.00" : `-${amount.toFixed(2)}`;
}
