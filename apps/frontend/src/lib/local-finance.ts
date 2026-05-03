import type { DashboardStateDto, IncomeStatus, OperationKind, PaymentStatus, PlannedOperationStatus } from "@wallet/shared";

const incomeStatus = {
  planned: "planned",
  delayed: "delayed",
  received_on_time: "received_on_time",
  received_late: "received_late",
  cancelled: "cancelled"
} as const satisfies Record<IncomeStatus, IncomeStatus>;

const paymentStatus = {
  planned: "planned",
  overdue: "overdue",
  paid_on_time: "paid_on_time",
  paid_late: "paid_late",
  skipped: "skipped",
  cancelled: "cancelled"
} as const satisfies Record<PaymentStatus, PaymentStatus>;

const plannedOperationStatus = {
  planned: "planned",
  overdue: "overdue",
  done: "done",
  skipped: "skipped",
  cancelled: "cancelled"
} as const satisfies Record<PlannedOperationStatus, PlannedOperationStatus>;

const operationKind = {
  income: "income",
  expense: "expense",
  transfer: "transfer",
  debt_repayment: "debt_repayment",
  adjustment: "adjustment",
  unallocated: "unallocated"
} as const satisfies Record<OperationKind, OperationKind>;

export function recalculateLocalState(state: DashboardStateDto): DashboardStateDto {
  const accountBalance = state.accounts.reduce((sum, account) => sum + Number(account.balance), 0);
  const debtBalance = state.debts.reduce((sum, debt) => sum + Number(debt.amount), 0);
  const receivedIncome = state.income
    .filter((item) => item.status === incomeStatus.received_on_time || item.status === incomeStatus.received_late)
    .reduce((sum, item) => sum + Number(item.amount), 0);
  const paidPayments = state.payments
    .filter((item) => item.status === paymentStatus.paid_on_time || item.status === paymentStatus.paid_late)
    .reduce((sum, item) => sum + Number(item.amount), 0);
  const requiredUpcomingPayments = state.payments
    .filter((item) => item.status === paymentStatus.planned || item.status === paymentStatus.overdue)
    .reduce((sum, item) => sum + Number(item.amount), 0);
  const requiredUpcomingOperations = state.plannedOperations
    .filter((item) => (item.status === plannedOperationStatus.planned || item.status === plannedOperationStatus.overdue) && (item.kind === operationKind.expense || item.kind === operationKind.debt_repayment))
    .reduce((sum, item) => sum + Number(item.amount), 0);
  const startBalance = Number(state.settings.startBalance);
  const calculatedBalance = startBalance + receivedIncome - paidPayments;
  const editedBalance = state.settings.editedBalance === null ? null : Number(state.settings.editedBalance);
  const currentBalance = editedBalance ?? calculatedBalance;
  const alerts = buildAlerts(state, currentBalance - requiredUpcomingPayments - requiredUpcomingOperations, accountBalance, debtBalance);

  return {
    ...state,
    balances: {
      accountBalance: accountBalance.toFixed(2),
      debtBalance: debtBalance.toFixed(2),
      netBalance: (accountBalance + debtBalance).toFixed(2),
      calculatedBalance: calculatedBalance.toFixed(2),
      currentBalance: currentBalance.toFixed(2),
      additionalExpenses: (editedBalance === null ? 0 : editedBalance - calculatedBalance).toFixed(2),
      freeMoney: (currentBalance - requiredUpcomingPayments - requiredUpcomingOperations).toFixed(2)
    },
    alerts,
    upcoming: [
      ...state.income
        .filter((item) => item.status === incomeStatus.planned || item.status === incomeStatus.delayed)
        .map((item) => ({ id: item.id, kind: "income" as const, title: item.name, amount: item.amount, date: item.effectiveDate, status: item.status })),
      ...state.payments
        .filter((item) => item.status === paymentStatus.planned || item.status === paymentStatus.overdue)
        .map((item) => ({ id: item.id, kind: "payment" as const, title: item.name, amount: item.amount, date: item.effectiveDate, status: item.status })),
      ...state.plannedOperations
        .filter((item) => item.status === plannedOperationStatus.planned || item.status === plannedOperationStatus.overdue)
        .map((item) => ({ id: item.id, kind: item.kind, title: item.name, amount: item.amount, date: item.effectiveDate, status: item.status }))
    ]
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(0, 8),
    counts: [...state.income, ...state.payments, ...state.plannedOperations].reduce<Record<string, number>>((acc, item) => {
      acc[item.status] = (acc[item.status] ?? 0) + 1;
      return acc;
    }, {})
  };
}

function buildAlerts(state: DashboardStateDto, freeMoney: number, accountBalance: number, debtBalance: number) {
  const alerts: DashboardStateDto["alerts"] = [];
  const now = new Date();
  const debtLoad = Math.abs(debtBalance) / Math.max(accountBalance, 1);

  if (freeMoney < 0) {
    alerts.push({ id: "cash-gap", level: "high", title: "Не хватит денег", description: "Ближайшие обязательные платежи больше свободного остатка." });
  }
  if (debtLoad >= 0.7) {
    alerts.push({ id: "debt-load", level: "high", title: "Высокая долговая нагрузка", description: "Долги занимают значительную часть доступных денег." });
  } else if (debtLoad >= 0.3) {
    alerts.push({ id: "debt-load", level: "medium", title: "Долги под контролем", description: "Нагрузка заметная, но пока без критического риска." });
  }
  const closedIncomeStatuses: IncomeStatus[] = [incomeStatus.received_on_time, incomeStatus.received_late, incomeStatus.cancelled];
  const closedPaymentStatuses: PaymentStatus[] = [paymentStatus.paid_on_time, paymentStatus.paid_late, paymentStatus.skipped, paymentStatus.cancelled];

  if (state.income.some((item) => new Date(item.effectiveDate) < now && !closedIncomeStatuses.includes(item.status))) {
    alerts.push({ id: "income-delay", level: "medium", title: "Задержка дохода", description: "Есть доходы, которые уже должны были поступить." });
  }
  if (state.payments.some((item) => new Date(item.effectiveDate) < now && !closedPaymentStatuses.includes(item.status))) {
    alerts.push({ id: "payment-overdue", level: "high", title: "Просрочка платежа", description: "Есть обязательные платежи с прошедшей датой." });
  }

  return alerts;
}
