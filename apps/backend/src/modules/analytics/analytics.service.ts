import type { TimeseriesPointDto } from "@wallet/shared";
import { prisma } from "../../lib/prisma";
import { toNumber } from "../finance/finance-utils";

const periodDays = {
  week: 7,
  month: 31,
  quarter: 92,
  year: 366
};

export async function getTimeseries(userId: string, period: keyof typeof periodDays = "month"): Promise<TimeseriesPointDto[]> {
  const from = new Date();
  from.setDate(from.getDate() - periodDays[period]);

  const [snapshots, previousSnapshot, unallocated] = await Promise.all([
    prisma.balanceSnapshot.findMany({
      where: { userId, createdAt: { gte: from } },
      orderBy: { createdAt: "asc" }
    }),
    prisma.balanceSnapshot.findFirst({
      where: { userId, createdAt: { lt: from } },
      orderBy: { createdAt: "desc" }
    }),
    prisma.operation.findMany({
      where: { userId, kind: "unallocated", operationDate: { gte: from } },
      select: { operationDate: true, amount: true }
    })
  ]);
  const unallocatedByDate = unallocated.reduce<Record<string, number>>((acc, item) => {
    const date = item.operationDate.toISOString().slice(0, 10);
    acc[date] = (acc[date] ?? 0) + toNumber(item.amount);
    return acc;
  }, {});

  const snapshotsByDate = snapshots.reduce<Record<string, (typeof snapshots)[number]>>((acc, snapshot) => {
    acc[snapshot.createdAt.toISOString().slice(0, 10)] = snapshot;
    return acc;
  }, {});
  const dates = [...new Set([...Object.keys(snapshotsByDate), ...Object.keys(unallocatedByDate)])].sort();
  let lastBalances = previousSnapshot
    ? {
        netBalance: toNumber(previousSnapshot.netBalance),
        accountBalance: toNumber(previousSnapshot.accountBalance),
        debtBalance: toNumber(previousSnapshot.debtBalance)
      }
    : { netBalance: 0, accountBalance: 0, debtBalance: 0 };

  return dates.map((date) => {
    const snapshot = snapshotsByDate[date];
    if (snapshot) {
      lastBalances = {
        netBalance: toNumber(snapshot.netBalance),
        accountBalance: toNumber(snapshot.accountBalance),
        debtBalance: toNumber(snapshot.debtBalance)
      };
    }

    return {
      date,
      ...lastBalances,
      additionalExpenses: unallocatedByDate[date] ?? 0
    };
  });
}
