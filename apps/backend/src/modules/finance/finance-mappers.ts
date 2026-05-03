import type { Account, BalanceSnapshot, Debt, History, Income, Payment, Settings, User } from "@prisma/client";
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
    note: income.note
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
    note: payment.note
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
