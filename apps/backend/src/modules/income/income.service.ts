import { IncomeStatus } from "@wallet/shared";
import { notFound } from "../../lib/errors";
import { prisma } from "../../lib/prisma";
import { mapIncome } from "../finance/finance-mappers";

export function resolveIncomeReceivedStatus(effectiveDate: string | Date, actualDate: string | Date) {
  return new Date(actualDate) <= new Date(effectiveDate) ? IncomeStatus.received_on_time : IncomeStatus.received_late;
}

export async function listIncome(userId: string) {
  return (await prisma.income.findMany({ where: { userId }, orderBy: { plannedDate: "asc" } })).map(mapIncome);
}

export async function createIncome(userId: string, data: any) {
  const income = await prisma.income.create({
    data: {
      userId,
      name: data.name,
      amount: data.amount,
      plannedDate: new Date(data.plannedDate),
      expectedDate: data.expectedDate ? new Date(data.expectedDate) : null,
      actualDate: data.actualDate ? new Date(data.actualDate) : null,
      status: data.status,
      note: data.note ?? null
    }
  });
  await prisma.history.create({ data: { userId, type: "income_created", payload: { name: data.name, amount: data.amount } } });
  return mapIncome(income);
}

export async function updateIncome(userId: string, id: string, data: any) {
  await ensureIncome(userId, id);
  const income = await prisma.income.update({
    where: { id },
    data: {
      ...data,
      plannedDate: data.plannedDate ? new Date(data.plannedDate) : undefined,
      expectedDate: data.expectedDate === undefined ? undefined : data.expectedDate ? new Date(data.expectedDate) : null,
      actualDate: data.actualDate === undefined ? undefined : data.actualDate ? new Date(data.actualDate) : null
    }
  });
  await prisma.history.create({ data: { userId, type: "income_updated", payload: { id, ...data } } });
  return mapIncome(income);
}

export async function markIncomeReceived(userId: string, id: string, actualDateInput?: string) {
  const existing = await ensureIncome(userId, id);
  const actualDate = actualDateInput ? new Date(actualDateInput) : new Date();
  const effective = existing.expectedDate ?? existing.plannedDate;
  const status = resolveIncomeReceivedStatus(effective, actualDate);
  const income = await prisma.income.update({ where: { id }, data: { actualDate, status } });
  await prisma.history.create({ data: { userId, type: "income_received", payload: { id, name: income.name, amount: String(income.amount), status } } });
  return mapIncome(income);
}

export async function deleteIncome(userId: string, id: string) {
  await ensureIncome(userId, id);
  await prisma.income.delete({ where: { id } });
  await prisma.history.create({ data: { userId, type: "income_deleted", payload: { id } } });
  return { ok: true };
}

async function ensureIncome(userId: string, id: string) {
  const income = await prisma.income.findFirst({ where: { id, userId } });
  if (!income) throw notFound("Income not found");
  return income;
}
