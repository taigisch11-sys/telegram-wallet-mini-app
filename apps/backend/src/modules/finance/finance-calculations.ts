import { IncomeStatus, PaymentStatus } from "@wallet/shared";

type MoneyItem = { amount: number; status: string };

export function calculateDashboardBalances(input: {
  startBalance: number;
  editedBalance: number | null;
  accountBalance: number;
  debtBalance: number;
  incomes: MoneyItem[];
  payments: MoneyItem[];
  requiredUpcomingPayments?: number;
}) {
  const receivedIncome = input.incomes
    .filter((item) => item.status === IncomeStatus.received_on_time || item.status === IncomeStatus.received_late)
    .reduce((sum, item) => sum + item.amount, 0);

  const paidPayments = input.payments
    .filter((item) => item.status === PaymentStatus.paid_on_time || item.status === PaymentStatus.paid_late)
    .reduce((sum, item) => sum + item.amount, 0);

  const calculatedBalance = input.startBalance + receivedIncome - paidPayments;
  const currentBalance = input.editedBalance ?? calculatedBalance;

  return {
    accountBalance: input.accountBalance,
    debtBalance: input.debtBalance,
    netBalance: input.accountBalance + input.debtBalance,
    calculatedBalance,
    currentBalance,
    additionalExpenses: input.editedBalance !== null ? input.editedBalance - calculatedBalance : 0,
    freeMoney: currentBalance - (input.requiredUpcomingPayments ?? 0)
  };
}

export function debtLoad(accountBalance: number, debtBalance: number) {
  return Math.abs(debtBalance) / Math.max(accountBalance, 1);
}
