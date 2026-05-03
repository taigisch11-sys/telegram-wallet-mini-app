export type LedgerTargetType = "account" | "debt";

export type LedgerBalanceInput = {
  accounts: { id: string; balance: number }[];
  debts: { id: string; amount: number }[];
};

export type LedgerEntryInput = {
  targetType: LedgerTargetType;
  targetId: string;
  amount: number;
};

export type MonthlyScheduleInput = {
  startDate: string;
  count: number;
  amount: string | number;
  finalAmount?: string | number | null;
};

export type MonthlyScheduleItem = {
  index: number;
  plannedDate: string;
  amount: string;
};

export function applyOperationEntries(input: LedgerBalanceInput, entries: LedgerEntryInput[]) {
  const accounts = input.accounts.map((account) => ({ ...account }));
  const debts = input.debts.map((debt) => ({ ...debt }));
  const beforeNet = netBalance(accounts, debts);

  for (const entry of entries) {
    if (entry.targetType === "account") {
      const account = accounts.find((item) => item.id === entry.targetId);
      if (account) account.balance = roundMoney(account.balance + entry.amount);
      continue;
    }

    const debt = debts.find((item) => item.id === entry.targetId);
    if (debt) debt.amount = roundMoney(debt.amount + entry.amount);
  }

  const afterNet = netBalance(accounts, debts);

  return {
    accounts,
    debts,
    netDelta: roundMoney(afterNet - beforeNet)
  };
}

export function generateMonthlySchedule(input: MonthlyScheduleInput): MonthlyScheduleItem[] {
  const count = Math.max(1, Math.floor(Number(input.count) || 1));
  const baseAmount = normalizeMoney(input.amount);
  const finalAmount = input.finalAmount === undefined || input.finalAmount === null || input.finalAmount === "" ? baseAmount : normalizeMoney(input.finalAmount);

  return Array.from({ length: count }, (_, index) => ({
    index: index + 1,
    plannedDate: addMonthsPreservingDay(input.startDate, index),
    amount: index === count - 1 ? finalAmount : baseAmount
  }));
}

export function normalizeMoney(value: string | number) {
  const parsed = Number(String(value).replace(",", "."));
  return Number.isFinite(parsed) ? Math.abs(parsed).toFixed(2) : "0.00";
}

function netBalance(accounts: { balance: number }[], debts: { amount: number }[]) {
  return roundMoney(accounts.reduce((sum, account) => sum + account.balance, 0) + debts.reduce((sum, debt) => sum + debt.amount, 0));
}

function roundMoney(value: number) {
  return Math.round(value * 100) / 100;
}

function addMonthsPreservingDay(startDate: string, monthOffset: number) {
  const [year, month, day] = startDate.slice(0, 10).split("-").map(Number);
  const targetMonthStart = new Date(Date.UTC(year, month - 1 + monthOffset, 1));
  const targetYear = targetMonthStart.getUTCFullYear();
  const targetMonth = targetMonthStart.getUTCMonth();
  const lastDay = new Date(Date.UTC(targetYear, targetMonth + 1, 0)).getUTCDate();
  const targetDay = Math.min(day, lastDay);
  return `${targetYear}-${String(targetMonth + 1).padStart(2, "0")}-${String(targetDay).padStart(2, "0")}`;
}
