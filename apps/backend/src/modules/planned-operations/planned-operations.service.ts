import { generateMonthlySchedule, plannedOperationInputSchema, plannedOperationSeriesInputSchema } from "@wallet/shared";
import { notFound } from "../../lib/errors";
import { prisma } from "../../lib/prisma";
import { mapPlannedOperation } from "../finance/finance-mappers";

export async function listPlannedOperations(userId: string) {
  return (await prisma.plannedOperation.findMany({ where: { userId }, orderBy: { plannedDate: "asc" } })).map(mapPlannedOperation);
}

export async function createPlannedOperation(userId: string, body: unknown) {
  const input = plannedOperationInputSchema.parse(body);
  const operation = await prisma.plannedOperation.create({
    data: {
      userId,
      kind: input.kind,
      name: input.name,
      amount: input.amount,
      plannedDate: new Date(input.plannedDate),
      expectedDate: input.expectedDate ? new Date(input.expectedDate) : null,
      actualDate: input.actualDate ? new Date(input.actualDate) : null,
      status: input.status,
      note: input.note ?? null,
      sourceAccountId: input.sourceAccountId ?? null,
      targetAccountId: input.targetAccountId ?? null,
      targetDebtId: input.targetDebtId ?? null,
      seriesId: input.seriesId ?? null
    }
  });
  await prisma.history.create({ data: { userId, type: "planned_operation_created", payload: { id: operation.id, kind: operation.kind, amount: String(operation.amount) } } });
  return mapPlannedOperation(operation);
}

export async function createPlannedOperationSeries(userId: string, body: unknown) {
  const input = plannedOperationSeriesInputSchema.parse(body);
  const schedule = generateMonthlySchedule({ startDate: input.startDate, count: input.count, amount: input.amount, finalAmount: input.finalAmount });

  const rows = await prisma.$transaction(async (tx) => {
    const series = await tx.operationSeries.create({
      data: {
        userId,
        name: input.name,
        kind: input.kind,
        defaultAmount: input.amount,
        finalAmount: input.finalAmount ?? null,
        startDate: new Date(input.startDate),
        count: input.count,
        sourceAccountId: input.sourceAccountId ?? null,
        targetAccountId: input.targetAccountId ?? null,
        targetDebtId: input.targetDebtId ?? null
      }
    });

    await tx.plannedOperation.createMany({
      data: schedule.map((item) => ({
        userId,
        kind: input.kind,
        name: input.name,
        amount: item.amount,
        plannedDate: new Date(item.plannedDate),
        status: "planned" as const,
        note: input.note ?? null,
        sourceAccountId: input.sourceAccountId ?? null,
        targetAccountId: input.targetAccountId ?? null,
        targetDebtId: input.targetDebtId ?? null,
        seriesId: series.id
      }))
    });

    return tx.plannedOperation.findMany({ where: { seriesId: series.id }, orderBy: { plannedDate: "asc" } });
  });

  return rows.map(mapPlannedOperation);
}

export async function markPlannedOperationDone(userId: string, id: string, actualDateInput?: string) {
  const actualDate = actualDateInput ? new Date(actualDateInput) : new Date();
  const result = await prisma.$transaction(async (tx) => {
    const planned = await tx.plannedOperation.findFirst({ where: { id, userId } });
    if (!planned) throw notFound("Planned operation not found");
    if (planned.status === "done") return planned;

    const amount = Number(planned.amount);
    const entries: { targetType: "account" | "debt"; targetId: string; amount: string }[] = [];
    if ((planned.kind === "expense" || planned.kind === "debt_repayment" || planned.kind === "transfer") && planned.sourceAccountId) {
      entries.push({ targetType: "account", targetId: planned.sourceAccountId, amount: (-amount).toFixed(2) });
    }
    if ((planned.kind === "income" || planned.kind === "transfer") && planned.targetAccountId) {
      entries.push({ targetType: "account", targetId: planned.targetAccountId, amount: amount.toFixed(2) });
    }
    if (planned.kind === "debt_repayment" && planned.targetDebtId) {
      entries.push({ targetType: "debt", targetId: planned.targetDebtId, amount: amount.toFixed(2) });
    }

    const operation = await tx.operation.create({
      data: {
        userId,
        kind: planned.kind,
        name: planned.name,
        amount: planned.amount,
        operationDate: actualDate,
        note: planned.note,
        plannedOperationId: planned.id,
        seriesId: planned.seriesId,
        entries: { create: entries }
      },
      include: { entries: true }
    });

    for (const entry of entries) {
      if (entry.targetType === "account") {
        const updatedAccounts = await tx.account.updateMany({ where: { id: entry.targetId, userId }, data: { balance: { increment: entry.amount } } });
        if (updatedAccounts.count !== 1) throw notFound("Account not found for planned operation");
      } else {
        const updatedDebts = await tx.debt.updateMany({ where: { id: entry.targetId, userId }, data: { amount: { increment: entry.amount } } });
        if (updatedDebts.count !== 1) throw notFound("Debt not found for planned operation");
      }
    }

    const updated = await tx.plannedOperation.update({ where: { id: planned.id }, data: { status: "done", actualDate } });
    await tx.history.create({ data: { userId, type: "planned_operation_done", payload: { id: planned.id, operationId: operation.id, kind: planned.kind, amount: String(planned.amount) } } });
    return updated;
  });

  return mapPlannedOperation(result);
}

export async function deletePlannedOperation(userId: string, id: string) {
  await prisma.plannedOperation.deleteMany({ where: { id, userId } });
  await prisma.history.create({ data: { userId, type: "planned_operation_deleted", payload: { id } } });
  return { ok: true };
}
