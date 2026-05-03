import { IncomeStatus, OperationKind, PaymentStatus, PlannedOperationStatus } from "@wallet/shared";
import { prisma } from "../../lib/prisma";
import { calculateDashboardBalances, debtLoad } from "../finance/finance-calculations";
import { mapAccount, mapDebt, mapIncome, mapOperation, mapPayment, mapPlannedOperation, mapSettings, mapSnapshot, mapUser } from "../finance/finance-mappers";
import { effectiveDate, toMoney, toNumber } from "../finance/finance-utils";

export async function getDashboardState(userId: string) {
  const [user, accounts, debts, income, payments, operations, plannedOperations, settings, latestSnapshot] = await Promise.all([
    prisma.user.findUniqueOrThrow({ where: { id: userId } }),
    prisma.account.findMany({ where: { userId }, orderBy: { createdAt: "asc" } }),
    prisma.debt.findMany({ where: { userId }, orderBy: { createdAt: "asc" } }),
    prisma.income.findMany({ where: { userId }, orderBy: { plannedDate: "asc" } }),
    prisma.payment.findMany({ where: { userId }, orderBy: { plannedDate: "asc" } }),
    prisma.operation.findMany({ where: { userId }, include: { entries: true }, orderBy: { operationDate: "desc" }, take: 100 }),
    prisma.plannedOperation.findMany({ where: { userId }, orderBy: { plannedDate: "asc" } }),
    prisma.settings.findUniqueOrThrow({ where: { userId } }),
    prisma.balanceSnapshot.findFirst({ where: { userId }, orderBy: { createdAt: "desc" } })
  ]);

  const accountBalance = accounts.reduce((sum, item) => sum + toNumber(item.balance), 0);
  const debtBalance = debts.reduce((sum, item) => sum + toNumber(item.amount), 0);
  const requiredUpcomingPayments = payments
    .filter((payment) => payment.status === PaymentStatus.planned || payment.status === PaymentStatus.overdue)
    .reduce((sum, payment) => sum + toNumber(payment.amount), 0);
  const requiredUpcomingOperations = plannedOperations
    .filter(
      (operation) =>
        (operation.status === PlannedOperationStatus.planned || operation.status === PlannedOperationStatus.overdue) &&
        (operation.kind === OperationKind.expense || operation.kind === OperationKind.debt_repayment)
    )
    .reduce((sum, operation) => sum + toNumber(operation.amount), 0);

  const rawBalances = calculateDashboardBalances({
    startBalance: toNumber(settings.startBalance),
    editedBalance: settings.editedBalance === null ? null : toNumber(settings.editedBalance),
    accountBalance,
    debtBalance,
    incomes: income.map((item) => ({ amount: toNumber(item.amount), status: item.status })),
    payments: payments.map((item) => ({ amount: toNumber(item.amount), status: item.status })),
    requiredUpcomingPayments: requiredUpcomingPayments + requiredUpcomingOperations
  });

  const now = new Date();
  const alerts = [];
  const load = debtLoad(accountBalance, debtBalance);
  if (rawBalances.freeMoney < 0) {
    alerts.push({ id: "cash-gap", level: "high", title: "Не хватит денег", description: "Ближайшие обязательные платежи больше свободного остатка." });
  }
  if (load >= 0.7) {
    alerts.push({ id: "debt-load", level: "high", title: "Высокая долговая нагрузка", description: "Долги занимают значительную часть доступных денег." });
  } else if (load >= 0.3) {
    alerts.push({ id: "debt-load", level: "medium", title: "Долги под контролем", description: "Нагрузка заметная, но пока без критического риска." });
  }
  const closedIncomeStatuses: string[] = [IncomeStatus.received_on_time, IncomeStatus.received_late, IncomeStatus.cancelled];
  const closedPaymentStatuses: string[] = [PaymentStatus.paid_on_time, PaymentStatus.paid_late, PaymentStatus.skipped, PaymentStatus.cancelled];

  if (income.some((item) => effectiveDate(item) < now && !closedIncomeStatuses.includes(item.status))) {
    alerts.push({ id: "income-delay", level: "medium", title: "Задержка дохода", description: "Есть доходы, которые уже должны были поступить." });
  }
  if (payments.some((item) => effectiveDate(item) < now && !closedPaymentStatuses.includes(item.status))) {
    alerts.push({ id: "payment-overdue", level: "high", title: "Просрочка платежа", description: "Есть обязательные платежи с прошедшей датой." });
  }

  const upcoming = [
    ...income
      .filter((item) => item.status === IncomeStatus.planned || item.status === IncomeStatus.delayed)
      .map((item) => ({ id: item.id, kind: "income" as const, title: item.name, amount: toMoney(item.amount), date: effectiveDate(item).toISOString(), status: item.status })),
    ...payments
      .filter((item) => item.status === PaymentStatus.planned || item.status === PaymentStatus.overdue)
      .map((item) => ({ id: item.id, kind: "payment" as const, title: item.name, amount: toMoney(item.amount), date: effectiveDate(item).toISOString(), status: item.status })),
    ...plannedOperations
      .filter((item) => item.status === PlannedOperationStatus.planned || item.status === PlannedOperationStatus.overdue)
      .map((item) => ({ id: item.id, kind: item.kind, title: item.name, amount: toMoney(item.amount), date: (item.expectedDate ?? item.plannedDate).toISOString(), status: item.status }))
  ]
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 8);

  const counts: Record<string, number> = {};
  for (const item of [...income, ...payments, ...plannedOperations]) {
    counts[item.status] = (counts[item.status] ?? 0) + 1;
  }

  return {
    user: mapUser(user),
    settings: mapSettings(settings),
    balances: {
      accountBalance: toMoney(rawBalances.accountBalance),
      debtBalance: toMoney(rawBalances.debtBalance),
      netBalance: toMoney(rawBalances.netBalance),
      calculatedBalance: toMoney(rawBalances.calculatedBalance),
      currentBalance: toMoney(rawBalances.currentBalance),
      additionalExpenses: toMoney(rawBalances.additionalExpenses),
      freeMoney: toMoney(rawBalances.freeMoney)
    },
    alerts,
    upcoming,
    accounts: accounts.map(mapAccount),
    debts: debts.map(mapDebt),
    income: income.map(mapIncome),
    payments: payments.map(mapPayment),
    operations: operations.map(mapOperation),
    plannedOperations: plannedOperations.map(mapPlannedOperation),
    latestSnapshot: mapSnapshot(latestSnapshot),
    counts
  };
}
