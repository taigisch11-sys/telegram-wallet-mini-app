import { operationInputSchema } from "@wallet/shared";
import type { Prisma } from "@prisma/client";
import { badRequest } from "../../lib/errors";
import { prisma } from "../../lib/prisma";
import { ensureCategoryBelongsToUser } from "../categories/categories.service";
import { mapOperation } from "../finance/finance-mappers";

export async function listOperations(userId: string) {
  return (
    await prisma.operation.findMany({
      where: { userId },
      include: { entries: true },
      orderBy: { operationDate: "desc" },
      take: 100
    })
  ).map(mapOperation);
}

export async function createOperation(userId: string, body: unknown) {
  const input = operationInputSchema.parse(body);
  await ensureCategoryBelongsToUser(userId, input.categoryId);
  const operation = await prisma.$transaction(async (tx) => {
    await validateOperationEntries(tx, userId, input.entries);
    const created = await tx.operation.create({
      data: {
        userId,
        kind: input.kind,
        name: input.name,
        amount: input.amount,
        operationDate: new Date(input.operationDate),
        note: input.note ?? null,
        plannedOperationId: input.plannedOperationId ?? null,
        seriesId: input.seriesId ?? null,
        categoryId: input.categoryId ?? null,
        entries: {
          create: input.entries.map((entry) => ({
            targetType: entry.targetType,
            targetId: entry.targetId,
            amount: entry.amount
          }))
        }
      },
      include: { entries: true }
    });

    for (const entry of input.entries) {
      if (entry.targetType === "account") {
        const updated = await tx.account.updateMany({
          where: { id: entry.targetId, userId },
          data: { balance: { increment: entry.amount } }
        });
        if (updated.count !== 1) throw badRequest("Счёт операции не найден", "operation_account_not_found");
      } else {
        const updated = await tx.debt.updateMany({
          where: { id: entry.targetId, userId },
          data: { amount: { increment: entry.amount } }
        });
        if (updated.count !== 1) throw badRequest("Долговой счёт операции не найден", "operation_debt_not_found");
      }
    }

    await tx.history.create({ data: { userId, type: "operation_created", payload: { id: created.id, kind: created.kind, amount: String(created.amount) } } });
    return created;
  });

  return mapOperation(operation);
}

async function validateOperationEntries(
  tx: PrismaTransaction,
  userId: string,
  entries: { targetType: "account" | "debt"; targetId: string }[]
) {
  for (const entry of entries) {
    if (entry.targetType === "account") {
      const account = await tx.account.findFirst({ where: { id: entry.targetId, userId }, select: { id: true } });
      if (!account) throw badRequest("Счёт операции не найден", "operation_account_not_found");
      continue;
    }
    const debt = await tx.debt.findFirst({ where: { id: entry.targetId, userId }, select: { id: true } });
    if (!debt) throw badRequest("Долговой счёт операции не найден", "operation_debt_not_found");
  }
}

type PrismaTransaction = Prisma.TransactionClient;
