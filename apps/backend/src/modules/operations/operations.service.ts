import { operationInputSchema } from "@wallet/shared";
import { prisma } from "../../lib/prisma";
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
  const operation = await prisma.$transaction(async (tx) => {
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
        await tx.account.updateMany({
          where: { id: entry.targetId, userId },
          data: { balance: { increment: entry.amount } }
        });
      } else {
        await tx.debt.updateMany({
          where: { id: entry.targetId, userId },
          data: { amount: { increment: entry.amount } }
        });
      }
    }

    await tx.history.create({ data: { userId, type: "operation_created", payload: { id: created.id, kind: created.kind, amount: String(created.amount) } } });
    return created;
  });

  return mapOperation(operation);
}
