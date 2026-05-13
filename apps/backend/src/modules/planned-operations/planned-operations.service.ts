import { generateMonthlySchedule, plannedOperationInputSchema, plannedOperationSeriesInputSchema } from "@wallet/shared";
import { badRequest, notFound } from "../../lib/errors";
import { prisma } from "../../lib/prisma";
import { ensureCategoryBelongsToUser } from "../categories/categories.service";
import { mapPlannedOperation } from "../finance/finance-mappers";

export async function listPlannedOperations(userId: string) {
  return (await prisma.plannedOperation.findMany({ where: { userId }, orderBy: { plannedDate: "asc" } })).map(mapPlannedOperation);
}

export async function createPlannedOperation(userId: string, body: unknown) {
  const input = plannedOperationInputSchema.parse(body);
  await ensureCategoryBelongsToUser(userId, input.categoryId);
  await validateDebtRepaymentPlan(userId, input);
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
      seriesId: input.seriesId ?? null,
      categoryId: input.categoryId ?? null
    }
  });
  await prisma.history.create({ data: { userId, type: "planned_operation_created", payload: { id: operation.id, kind: operation.kind, amount: String(operation.amount) } } });
  return mapPlannedOperation(operation);
}

export async function createPlannedOperationSeries(userId: string, body: unknown) {
  const input = plannedOperationSeriesInputSchema.parse(body);
  await ensureCategoryBelongsToUser(userId, input.categoryId);
  const schedule = generateMonthlySchedule({ startDate: input.startDate, count: input.count, amount: input.amount, finalAmount: input.finalAmount });
  const totalAmount = schedule.reduce((sum, item) => sum + Number(item.amount), 0).toFixed(2);
  await validateDebtRepaymentPlan(userId, input, totalAmount);

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
        targetDebtId: input.targetDebtId ?? null,
        categoryId: input.categoryId ?? null
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
        seriesId: series.id,
        categoryId: input.categoryId ?? null
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
    if (planned.kind === "debt_repayment") {
      assertDebtRepaymentTargets(planned.sourceAccountId, planned.targetDebtId);
      const [sourceAccount, targetDebt] = await Promise.all([
        tx.account.findFirst({ where: { id: planned.sourceAccountId ?? "", userId }, select: { id: true } }),
        tx.debt.findFirst({ where: { id: planned.targetDebtId ?? "", userId }, select: { amount: true } })
      ]);
      if (!sourceAccount) throw notFound("Account not found for planned operation");
      if (!targetDebt) throw notFound("Debt not found for planned operation");
      assertDebtRepaymentDoesNotOverpay(String(planned.amount), String(targetDebt.amount));
    }

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
        categoryId: planned.categoryId,
        entries: { create: entries }
      },
      include: { entries: true }
    });

    for (const entry of entries) {
      if (entry.targetType === "account") {
        const updatedAccounts = await tx.account.updateMany({ where: { id: entry.targetId, userId }, data: { balance: { increment: entry.amount } } });
        if (updatedAccounts.count !== 1) throw notFound("Account not found for planned operation");
      } else {
        const entryAmount = Number(entry.amount);
        const updatedDebts = await tx.debt.updateMany({
          where: { id: entry.targetId, userId, amount: { lte: (-entryAmount).toFixed(2) } },
          data: { amount: { increment: entry.amount } }
        });
        if (updatedDebts.count !== 1) throw badRequest("Сумма погашения больше текущего долга", "debt_repayment_exceeds_debt");
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

export function assertDebtRepaymentDoesNotOverpay(amountInput: string | number, debtAmountInput: string | number) {
  const amount = Number(amountInput);
  const debtAmount = Math.abs(Number(debtAmountInput));
  if (!Number.isFinite(amount) || amount <= 0) throw badRequest("Сумма погашения должна быть больше нуля", "invalid_debt_repayment_amount");
  if (!Number.isFinite(debtAmount)) throw badRequest("Некорректный остаток долга", "invalid_debt_amount");
  if (amount > debtAmount + 0.009) throw badRequest("Сумма погашения больше текущего долга", "debt_repayment_exceeds_debt");
}

function assertDebtRepaymentTargets(sourceAccountId: string | null | undefined, targetDebtId: string | null | undefined) {
  if (!sourceAccountId || !targetDebtId) throw badRequest("Для погашения долга нужны счёт списания и долговой счёт", "invalid_debt_repayment_targets");
}

async function validateDebtRepaymentPlan(
  userId: string,
  input: { kind: string; amount: string; sourceAccountId?: string | null; targetDebtId?: string | null },
  totalAmount = input.amount
) {
  if (input.kind !== "debt_repayment") return;
  assertDebtRepaymentTargets(input.sourceAccountId, input.targetDebtId);

  const [sourceAccount, targetDebt] = await Promise.all([
    prisma.account.findFirst({ where: { id: input.sourceAccountId ?? "", userId }, select: { id: true } }),
    prisma.debt.findFirst({ where: { id: input.targetDebtId ?? "", userId }, select: { amount: true } })
  ]);
  if (!sourceAccount) throw notFound("Account not found for planned operation");
  if (!targetDebt) throw notFound("Debt not found for planned operation");

  assertDebtRepaymentDoesNotOverpay(totalAmount, String(targetDebt.amount));
}
