import type { DashboardStateDto } from "@wallet/shared";

const now = new Date();

export const emptyState: DashboardStateDto = {
  user: {
    id: "local",
    telegramId: "local",
    username: null,
    firstName: null,
    createdAt: now.toISOString()
  },
  settings: {
    currentMonth: now.toISOString().slice(0, 7),
    startBalance: "0.00",
    editedBalance: null
  },
  balances: {
    accountBalance: "0.00",
    debtBalance: "0.00",
    netBalance: "0.00",
    calculatedBalance: "0.00",
    currentBalance: "0.00",
    additionalExpenses: "0.00",
    freeMoney: "0.00"
  },
  alerts: [],
  upcoming: [],
  accounts: [],
  debts: [],
  income: [],
  payments: [],
  latestSnapshot: null,
  counts: {}
};

export const mockState = emptyState;
