import type { Account, BalanceSnapshot, Category, Debt, History, Income, Operation, OperationEntry, Payment, PlannedOperation, Settings, User } from "@prisma/client";
import type { Prisma } from "@prisma/client";
import { effectiveDate, iso, toMoney } from "./finance-utils";

export function mapUser(user: User) {
  return {
    id: user.id,
    telegramId: user.telegramId,
    username: user.username,
    firstName: user.firstName,
    createdAt: user.createdAt.toISOString()
  };
}

export function mapAccount(account: Account) {
  return {
    id: account.id,
    name: account.name,
    balance: toMoney(account.balance),
    createdAt: account.createdAt.toISOString()
  };
}

export function mapDebt(debt: Debt) {
  return {
    id: debt.id,
    name: debt.name,
    amount: toMoney(debt.amount),
    createdAt: debt.createdAt.toISOString()
  };
}

export function mapCategory(category: Category) {
  return {
    id: category.id,
    name: category.name,
    type: category.type,
    color: category.color,
    icon: category.icon,
    isDefault: category.isDefault,
    createdAt: category.createdAt.toISOString()
  };
}

export function mapIncome(income: Income) {
  const date = effectiveDate(income);
  return {
    id: income.id,
    name: income.name,
    amount: toMoney(income.amount),
    plannedDate: income.plannedDate.toISOString(),
    expectedDate: iso(income.expectedDate),
    actualDate: iso(income.actualDate),
    effectiveDate: date.toISOString(),
    status: income.status,
    note: income.note,
    categoryId: income.categoryId
  };
}

export function mapPayment(payment: Payment) {
  const date = effectiveDate(payment);
  return {
    id: payment.id,
    name: payment.name,
    amount: toMoney(payment.amount),
    plannedDate: payment.plannedDate.toISOString(),
    expectedDate: iso(payment.expectedDate),
    actualDate: iso(payment.actualDate),
    effectiveDate: date.toISOString(),
    status: payment.status,
    note: payment.note,
    categoryId: payment.categoryId
  };
}

export function mapOperation(operation: Operation & { entries: OperationEntry[] }) {
  return {
    id: operation.id,
    kind: operation.kind,
    name: operation.name,
    amount: toMoney(operation.amount),
    operationDate: operation.operationDate.toISOString(),
    note: operation.note,
    plannedOperationId: operation.plannedOperationId,
    seriesId: operation.seriesId,
    createdAt: operation.createdAt.toISOString(),
    categoryId: operation.categoryId,
    entries: operation.entries.map((entry) => ({
      id: entry.id,
      targetType: entry.targetType as "account" | "debt",
      targetId: entry.targetId,
      amount: toMoney(entry.amount)
    }))
  };
}

export function mapPlannedOperation(operation: PlannedOperation) {
  const date = operation.expectedDate ?? operation.plannedDate;
  return {
    id: operation.id,
    kind: operation.kind,
    name: operation.name,
    amount: toMoney(operation.amount),
    plannedDate: operation.plannedDate.toISOString(),
    expectedDate: iso(operation.expectedDate),
    actualDate: iso(operation.actualDate),
    effectiveDate: date.toISOString(),
    status: operation.status,
    note: operation.note,
    sourceAccountId: operation.sourceAccountId,
    targetAccountId: operation.targetAccountId,
    targetDebtId: operation.targetDebtId,
    seriesId: operation.seriesId,
    categoryId: operation.categoryId
  };
}

export function mapSettings(settings: Settings) {
  return {
    currentMonth: settings.currentMonth,
    startBalance: toMoney(settings.startBalance),
    editedBalance: settings.editedBalance === null ? null : toMoney(settings.editedBalance)
  };
}

export function mapSnapshot(snapshot: BalanceSnapshot | null) {
  if (!snapshot) return null;
  return {
    id: snapshot.id,
    accountBalance: toMoney(snapshot.accountBalance),
    debtBalance: toMoney(snapshot.debtBalance),
    netBalance: toMoney(snapshot.netBalance),
    createdAt: snapshot.createdAt.toISOString()
  };
}

export function mapHistory(history: History) {
  return {
    id: history.id,
    type: history.type,
    payload: history.payload as Prisma.JsonValue,
    createdAt: history.createdAt.toISOString()
  };
}
