import type { CategoryType, IncomeStatus, OperationKind, PaymentStatus, PlannedOperationStatus } from "./enums";

export type MoneyString = string;

export type UserDto = {
  id: string;
  telegramId: string;
  username: string | null;
  firstName: string | null;
  createdAt: string;
};

export type AccountDto = {
  id: string;
  name: string;
  balance: MoneyString;
  createdAt: string;
};

export type DebtDto = {
  id: string;
  name: string;
  amount: MoneyString;
  createdAt: string;
};

export type CategoryDto = {
  id: string;
  name: string;
  type: CategoryType;
  color: string;
  icon: string;
  isDefault: boolean;
  createdAt: string;
};

export type IncomeDto = {
  id: string;
  name: string;
  amount: MoneyString;
  plannedDate: string;
  expectedDate: string | null;
  actualDate: string | null;
  effectiveDate: string;
  status: IncomeStatus;
  note: string | null;
  categoryId?: string | null;
};

export type PaymentDto = {
  id: string;
  name: string;
  amount: MoneyString;
  plannedDate: string;
  expectedDate: string | null;
  actualDate: string | null;
  effectiveDate: string;
  status: PaymentStatus;
  note: string | null;
  categoryId?: string | null;
};

export type OperationEntryDto = {
  id: string;
  targetType: "account" | "debt";
  targetId: string;
  amount: MoneyString;
};

export type OperationDto = {
  id: string;
  kind: OperationKind;
  name: string;
  amount: MoneyString;
  operationDate: string;
  note: string | null;
  plannedOperationId: string | null;
  seriesId: string | null;
  createdAt: string;
  categoryId?: string | null;
  entries: OperationEntryDto[];
};

export type PlannedOperationDto = {
  id: string;
  kind: OperationKind;
  name: string;
  amount: MoneyString;
  plannedDate: string;
  expectedDate: string | null;
  actualDate: string | null;
  effectiveDate: string;
  status: PlannedOperationStatus;
  note: string | null;
  sourceAccountId: string | null;
  targetAccountId: string | null;
  targetDebtId: string | null;
  seriesId: string | null;
  categoryId?: string | null;
};

export type SettingsDto = {
  currentMonth: string;
  startBalance: MoneyString;
  editedBalance: MoneyString | null;
};

export type BalanceSummaryDto = {
  accountBalance: MoneyString;
  debtBalance: MoneyString;
  netBalance: MoneyString;
  calculatedBalance: MoneyString;
  currentBalance: MoneyString;
  additionalExpenses: MoneyString;
  freeMoney: MoneyString;
};

export type AlertDto = {
  id: string;
  level: "low" | "medium" | "high";
  title: string;
  description: string;
};

export type UpcomingEventDto = {
  id: string;
  kind: "income" | "payment" | OperationKind;
  title: string;
  amount: MoneyString;
  date: string;
  status: IncomeStatus | PaymentStatus | PlannedOperationStatus;
};

export type SnapshotDto = {
  id: string;
  accountBalance: MoneyString;
  debtBalance: MoneyString;
  netBalance: MoneyString;
  createdAt: string;
};

export type HistoryItemDto = {
  id: string;
  type: string;
  payload: unknown;
  createdAt: string;
};

export type TimeseriesPointDto = {
  date: string;
  netBalance: number;
  accountBalance: number;
  debtBalance: number;
  additionalExpenses: number;
};

export type DashboardStateDto = {
  user: UserDto;
  settings: SettingsDto;
  balances: BalanceSummaryDto;
  alerts: AlertDto[];
  upcoming: UpcomingEventDto[];
  accounts: AccountDto[];
  debts: DebtDto[];
  categories: CategoryDto[];
  income: IncomeDto[];
  payments: PaymentDto[];
  operations: OperationDto[];
  plannedOperations: PlannedOperationDto[];
  latestSnapshot: SnapshotDto | null;
  counts: Record<string, number>;
};
