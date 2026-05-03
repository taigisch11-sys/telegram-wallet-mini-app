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

  const snapshots = await prisma.balanceSnapshot.findMany({
    where: { userId, createdAt: { gte: from } },
    orderBy: { createdAt: "asc" }
  });

  return snapshots.map((snapshot) => ({
    date: snapshot.createdAt.toISOString().slice(0, 10),
    netBalance: toNumber(snapshot.netBalance),
    accountBalance: toNumber(snapshot.accountBalance),
    debtBalance: toNumber(snapshot.debtBalance),
    additionalExpenses: 0
  }));
}
