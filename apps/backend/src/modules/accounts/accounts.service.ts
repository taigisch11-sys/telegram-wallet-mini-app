import type { Prisma } from "@prisma/client";
import { distributeUnallocatedMovement } from "@wallet/shared";
import { badRequest, notFound } from "../../lib/errors";
import { prisma } from "../../lib/prisma";
import { ensureDefaultCategories } from "../categories/categories.service";
import { calculateDashboardBalances } from "../finance/finance-calculations";
import { mapAccount, mapSnapshot } from "../finance/finance-mappers";
import { toMoney, toNumber } from "../finance/finance-utils";

export async function listAccounts(userId: string) {
  return (await prisma.account.findMany({ where: { userId }, orderBy: { createdAt: "asc" } })).map(mapAccount);
}

export async function createAccount(userId: string, data: { name: string; balance: string }) {
  const account = await prisma.account.create({ data: { userId, name: data.name, balance: data.balance } });
  await prisma.history.create({ data: { userId, type: "account_created", payload: { name: data.name, balance: data.balance } } });
  return mapAccount(account);
}

export async function updateAccount(userId: string, id: string, data: Partial<{ name: string; balance: string }>) {
  await ensureAccount(userId, id);
  const account = await prisma.account.update({ where: { id }, data });
  await prisma.history.create({ data: { userId, type: "account_updated", payload: { id, ...data } } });
  return mapAccount(account);
}

export async function deleteAccount(userId: string, id: string) {
  await ensureAccount(userId, id);
  await prisma.account.delete({ where: { id } });
  await prisma.history.create({ data: { userId, type: "account_deleted", payload: { id } } });
  return { ok: true };
}

async function ensureAccount(userId: string, id: string) {
  const account = await prisma.account.findFirst({ where: { id, userId } });
  if (!account) throw notFound("Account not found");
  return account;
}

export async function reconcileBalances(
  userId: string,
  input: {
    accounts: { id: string; balance: string }[];
    debts: { id: string; amount: string }[];
    editedBalance?: string | null;
  }
) {
  await ensureDefaultCategories(userId);
  return prisma.$transaction(async (tx) => {
    for (const account of input.accounts) {
      const existing = await tx.account.findFirst({ where: { id: account.id, userId } });
      if (!existing) throw notFound("Account not found");
      await tx.account.update({ where: { id: account.id }, data: { balance: account.balance } });
    }

    for (const debt of input.debts) {
      if (Number(debt.amount) > 0) throw badRequest("Debt amount must be negative", "debt_amount_positive");
      const existing = await tx.debt.findFirst({ where: { id: debt.id, userId } });
      if (!existing) throw notFound("Debt not found");
      await tx.debt.update({ where: { id: debt.id }, data: { amount: debt.amount } });
    }

    if (input.editedBalance !== undefined) {
      await tx.settings.update({ where: { userId }, data: { editedBalance: input.editedBalance } });
    }

    const [accounts, debts, settings, incomes, payments, previousSnapshot] = await Promise.all([
      tx.account.findMany({ where: { userId } }),
      tx.debt.findMany({ where: { userId } }),
      tx.settings.findUniqueOrThrow({ where: { userId } }),
      tx.income.findMany({ where: { userId } }),
      tx.payment.findMany({ where: { userId } }),
      tx.balanceSnapshot.findFirst({ where: { userId }, orderBy: { createdAt: "desc" } })
    ]);

    const accountBalance = accounts.reduce((sum, account) => sum + toNumber(account.balance), 0);
    const debtBalance = debts.reduce((sum, debt) => sum + toNumber(debt.amount), 0);
    const snapshot = await tx.balanceSnapshot.create({
      data: {
        userId,
        accountBalance: toMoney(accountBalance),
        debtBalance: toMoney(debtBalance),
        netBalance: toMoney(accountBalance + debtBalance)
      }
    });

    const summary = calculateDashboardBalances({
      startBalance: toNumber(settings.startBalance),
      editedBalance: settings.editedBalance === null ? null : toNumber(settings.editedBalance),
      accountBalance,
      debtBalance,
      incomes: incomes.map((income) => ({ amount: toNumber(income.amount), status: income.status })),
      payments: payments.map((payment) => ({ amount: toNumber(payment.amount), status: payment.status }))
    });

    const snapshotDelta = previousSnapshot ? toNumber(snapshot.netBalance) - toNumber(previousSnapshot.netBalance) : 0;
    const executedOperations = previousSnapshot
      ? await tx.operation.findMany({
          where: {
            userId,
            operationDate: { gt: previousSnapshot.createdAt, lte: snapshot.createdAt },
            kind: { not: "unallocated" }
          }
        })
      : [];
    const fixedDelta = executedOperations.reduce((sum, operation) => sum + operationNetDelta(operation.kind, toNumber(operation.amount)), 0);
    const unallocatedDelta = snapshotDelta - fixedDelta;

    if (previousSnapshot && Math.abs(unallocatedDelta) > 0.009) {
      const category = await tx.category.findFirst({ where: { userId, name: "Нераспределено" }, select: { id: true } });
      await tx.operation.createMany({
        data: distributeUnallocatedMovement({
          amount: unallocatedDelta,
          from: previousSnapshot.createdAt.toISOString(),
          to: snapshot.createdAt.toISOString()
        }).map((item) => ({
          userId,
          kind: "unallocated" as const,
          name: unallocatedDelta < 0 ? "Нераспределённые расходы" : "Дополнительные доходы",
          amount: item.amount,
          operationDate: new Date(item.date),
          note: "Создано автоматически при сверке остатков",
          categoryId: category?.id ?? null
        }))
      });
    }

    const payload: Prisma.JsonObject = {
      previousSnapshot: previousSnapshot ? mapSnapshot(previousSnapshot) : null,
      nextSnapshot: mapSnapshot(snapshot),
      snapshotDelta: previousSnapshot ? toMoney(snapshotDelta) : toMoney(0),
      calculatedBalance: toMoney(summary.calculatedBalance),
      currentBalance: toMoney(summary.currentBalance),
      additionalExpenses: toMoney(summary.additionalExpenses),
      distributedMovement: previousSnapshot ? toMoney(unallocatedDelta) : toMoney(0)
    };

    const history = await tx.history.create({ data: { userId, type: "balance_reconciled", payload } });

    return {
      snapshot: mapSnapshot(snapshot),
      summary: {
        ...summary,
        accountBalance: toMoney(summary.accountBalance),
        debtBalance: toMoney(summary.debtBalance),
        netBalance: toMoney(summary.netBalance),
        calculatedBalance: toMoney(summary.calculatedBalance),
        currentBalance: toMoney(summary.currentBalance),
        additionalExpenses: toMoney(summary.additionalExpenses),
        freeMoney: toMoney(summary.freeMoney)
      },
      history
    };
  });
}

function operationNetDelta(kind: string, amount: number) {
  if (kind === "income") return amount;
  if (kind === "expense") return -amount;
  if (kind === "unallocated") return amount;
  return 0;
}
