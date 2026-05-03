import { IncomeStatus, OperationKind, PaymentStatus, PlannedOperationStatus, generateMonthlySchedule, type DashboardStateDto, type HistoryItemDto, type TimeseriesPointDto } from "@wallet/shared";
import { accountInputSchema, debtInputSchema, incomeInputSchema, paymentInputSchema, plannedOperationInputSchema, plannedOperationSeriesInputSchema, reconcileSchema } from "@wallet/shared";
import { id, sql } from "./db";
import type { WorkerEnv } from "./env";
import { currentMonth, effectiveDate, normalizeDebtAmount, toMoney, toNumber } from "./money";

type UserRow = {
  id: string;
  telegramId: string;
  username: string | null;
  firstName: string | null;
  createdAt: string | Date;
};

type AccountRow = { id: string; name: string; balance: string; createdAt: string | Date };
type DebtRow = { id: string; name: string; amount: string; createdAt: string | Date };
type SettingsRow = { currentMonth: string; startBalance: string; editedBalance: string | null };
type SnapshotRow = { id: string; accountBalance: string; debtBalance: string; netBalance: string; createdAt: string | Date };
type OperationRow = {
  id: string;
  kind: string;
  name: string;
  amount: string;
  operationDate: string | Date;
  note: string | null;
  plannedOperationId: string | null;
  seriesId: string | null;
  createdAt: string | Date;
};
type OperationEntryRow = { id: string; operationId: string; targetType: string; targetId: string; amount: string };
type PlannedOperationRow = {
  id: string;
  kind: string;
  name: string;
  amount: string;
  plannedDate: string | Date;
  expectedDate: string | Date | null;
  actualDate: string | Date | null;
  status: string;
  note: string | null;
  sourceAccountId: string | null;
  targetAccountId: string | null;
  targetDebtId: string | null;
  seriesId: string | null;
};
type PlanRow = {
  id: string;
  name: string;
  amount: string;
  plannedDate: string | Date;
  expectedDate: string | Date | null;
  actualDate: string | Date | null;
  status: string;
  note: string | null;
};

function iso(value: string | Date | null | undefined) {
  if (!value) return null;
  return new Date(value).toISOString();
}

function mapUser(user: UserRow) {
  return {
    id: user.id,
    telegramId: user.telegramId,
    username: user.username,
    firstName: user.firstName,
    createdAt: iso(user.createdAt)!
  };
}

function mapAccount(row: AccountRow) {
  return { id: row.id, name: row.name, balance: toMoney(row.balance), createdAt: iso(row.createdAt)! };
}

function mapDebt(row: DebtRow) {
  return { id: row.id, name: row.name, amount: toMoney(row.amount), createdAt: iso(row.createdAt)! };
}

export function mapIncome(row: PlanRow) {
  return {
    id: row.id,
    name: row.name,
    amount: toMoney(row.amount),
    plannedDate: iso(row.plannedDate)!,
    expectedDate: iso(row.expectedDate),
    actualDate: iso(row.actualDate),
    effectiveDate: effectiveDate(row).toISOString(),
    status: row.status as IncomeStatus,
    note: row.note
  };
}

export function mapPayment(row: PlanRow) {
  return {
    id: row.id,
    name: row.name,
    amount: toMoney(row.amount),
    plannedDate: iso(row.plannedDate)!,
    expectedDate: iso(row.expectedDate),
    actualDate: iso(row.actualDate),
    effectiveDate: effectiveDate(row).toISOString(),
    status: row.status as PaymentStatus,
    note: row.note
  };
}

function mapSnapshot(row: SnapshotRow | undefined) {
  if (!row) return null;
  return {
    id: row.id,
    accountBalance: toMoney(row.accountBalance),
    debtBalance: toMoney(row.debtBalance),
    netBalance: toMoney(row.netBalance),
    createdAt: iso(row.createdAt)!
  };
}

function mapOperation(row: OperationRow, entries: OperationEntryRow[]) {
  return {
    id: row.id,
    kind: row.kind as OperationKind,
    name: row.name,
    amount: toMoney(row.amount),
    operationDate: iso(row.operationDate)!,
    note: row.note,
    plannedOperationId: row.plannedOperationId,
    seriesId: row.seriesId,
    createdAt: iso(row.createdAt)!,
    entries: entries
      .filter((entry) => entry.operationId === row.id)
      .map((entry) => ({
        id: entry.id,
        targetType: entry.targetType as "account" | "debt",
        targetId: entry.targetId,
        amount: toMoney(entry.amount)
      }))
  };
}

function mapPlannedOperation(row: PlannedOperationRow) {
  return {
    id: row.id,
    kind: row.kind as OperationKind,
    name: row.name,
    amount: toMoney(row.amount),
    plannedDate: iso(row.plannedDate)!,
    expectedDate: iso(row.expectedDate),
    actualDate: iso(row.actualDate),
    effectiveDate: effectiveDate(row).toISOString(),
    status: row.status as PlannedOperationStatus,
    note: row.note,
    sourceAccountId: row.sourceAccountId,
    targetAccountId: row.targetAccountId,
    targetDebtId: row.targetDebtId,
    seriesId: row.seriesId
  };
}

function calculateBalances(input: {
  settings: SettingsRow;
  accounts: AccountRow[];
  debts: DebtRow[];
  income: PlanRow[];
  payments: PlanRow[];
  plannedOperations: PlannedOperationRow[];
}) {
  const accountBalance = input.accounts.reduce((sum, item) => sum + toNumber(item.balance), 0);
  const debtBalance = input.debts.reduce((sum, item) => sum + toNumber(item.amount), 0);
  const receivedIncome = input.income
    .filter((item) => item.status === IncomeStatus.received_on_time || item.status === IncomeStatus.received_late)
    .reduce((sum, item) => sum + toNumber(item.amount), 0);
  const paidPayments = input.payments
    .filter((item) => item.status === PaymentStatus.paid_on_time || item.status === PaymentStatus.paid_late)
    .reduce((sum, item) => sum + toNumber(item.amount), 0);
  const requiredUpcomingPayments = input.payments
    .filter((item) => item.status === PaymentStatus.planned || item.status === PaymentStatus.overdue)
    .reduce((sum, item) => sum + toNumber(item.amount), 0);
  const requiredUpcomingOperations = input.plannedOperations
    .filter((item) => (item.status === PlannedOperationStatus.planned || item.status === PlannedOperationStatus.overdue) && (item.kind === OperationKind.expense || item.kind === OperationKind.debt_repayment))
    .reduce((sum, item) => sum + toNumber(item.amount), 0);
  const calculatedBalance = toNumber(input.settings.startBalance) + receivedIncome - paidPayments;
  const currentBalance = input.settings.editedBalance === null ? calculatedBalance : toNumber(input.settings.editedBalance);

  return {
    accountBalance,
    debtBalance,
    netBalance: accountBalance + debtBalance,
    calculatedBalance,
    currentBalance,
    additionalExpenses: input.settings.editedBalance === null ? 0 : currentBalance - calculatedBalance,
    freeMoney: currentBalance - requiredUpcomingPayments - requiredUpcomingOperations
  };
}

export async function dashboardState(env: WorkerEnv, userId: string): Promise<DashboardStateDto> {
  const db = sql(env);
  const [users, accounts, debts, income, payments, operations, operationEntries, plannedOperations, settingsRows, snapshots] = await Promise.all([
    db`SELECT id, "telegramId", username, "firstName", "createdAt" FROM "User" WHERE id = ${userId} LIMIT 1`,
    db`SELECT id, name, balance, "createdAt" FROM "Account" WHERE "userId" = ${userId} ORDER BY "createdAt" ASC`,
    db`SELECT id, name, amount, "createdAt" FROM "Debt" WHERE "userId" = ${userId} ORDER BY "createdAt" ASC`,
    db`SELECT id, name, amount, "plannedDate", "expectedDate", "actualDate", status, note FROM "Income" WHERE "userId" = ${userId} ORDER BY "plannedDate" ASC`,
    db`SELECT id, name, amount, "plannedDate", "expectedDate", "actualDate", status, note FROM "Payment" WHERE "userId" = ${userId} ORDER BY "plannedDate" ASC`,
    db`SELECT id, kind, name, amount, "operationDate", note, "plannedOperationId", "seriesId", "createdAt" FROM "Operation" WHERE "userId" = ${userId} ORDER BY "operationDate" DESC LIMIT 100`,
    db`SELECT id, "operationId", "targetType", "targetId", amount FROM "OperationEntry" WHERE "operationId" IN (SELECT id FROM "Operation" WHERE "userId" = ${userId} ORDER BY "operationDate" DESC LIMIT 100)`,
    db`SELECT id, kind, name, amount, "plannedDate", "expectedDate", "actualDate", status, note, "sourceAccountId", "targetAccountId", "targetDebtId", "seriesId" FROM "PlannedOperation" WHERE "userId" = ${userId} ORDER BY "plannedDate" ASC`,
    db`SELECT "currentMonth", "startBalance", "editedBalance" FROM "Settings" WHERE "userId" = ${userId} LIMIT 1`,
    db`SELECT id, "accountBalance", "debtBalance", "netBalance", "createdAt" FROM "BalanceSnapshot" WHERE "userId" = ${userId} ORDER BY "createdAt" DESC LIMIT 1`
  ]);

  const user = users[0] as UserRow;
  const settings = (settingsRows[0] ?? { currentMonth: currentMonth(), startBalance: "0", editedBalance: null }) as SettingsRow;
  const rawBalances = calculateBalances({
    settings,
    accounts: accounts as AccountRow[],
    debts: debts as DebtRow[],
    income: income as PlanRow[],
    payments: payments as PlanRow[],
    plannedOperations: plannedOperations as PlannedOperationRow[]
  });

  const alerts = [];
  if (rawBalances.freeMoney < 0) {
    alerts.push({
      id: "cash-gap",
      level: "high" as const,
      title: "Не хватит денег",
      description: "Ближайшие обязательные платежи больше свободного остатка."
    });
  }

  const now = new Date();
  const upcoming = [
    ...(income as PlanRow[])
      .filter((item) => item.status === IncomeStatus.planned || item.status === IncomeStatus.delayed)
      .map((item) => ({ id: item.id, kind: "income" as const, title: item.name, amount: toMoney(item.amount), date: effectiveDate(item).toISOString(), status: item.status as IncomeStatus })),
    ...(payments as PlanRow[])
      .filter((item) => item.status === PaymentStatus.planned || item.status === PaymentStatus.overdue)
      .map((item) => ({ id: item.id, kind: "payment" as const, title: item.name, amount: toMoney(item.amount), date: effectiveDate(item).toISOString(), status: item.status as PaymentStatus })),
    ...(plannedOperations as PlannedOperationRow[])
      .filter((item) => item.status === PlannedOperationStatus.planned || item.status === PlannedOperationStatus.overdue)
      .map((item) => ({ id: item.id, kind: item.kind as OperationKind, title: item.name, amount: toMoney(item.amount), date: effectiveDate(item).toISOString(), status: item.status as PlannedOperationStatus }))
  ]
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 8);

  if ((income as PlanRow[]).some((item) => effectiveDate(item) < now && ![IncomeStatus.received_on_time, IncomeStatus.received_late, IncomeStatus.cancelled].includes(item.status as any))) {
    alerts.push({ id: "income-delay", level: "medium" as const, title: "Задержка дохода", description: "Есть доходы, которые уже должны были поступить." });
  }
  if ((payments as PlanRow[]).some((item) => effectiveDate(item) < now && ![PaymentStatus.paid_on_time, PaymentStatus.paid_late, PaymentStatus.skipped, PaymentStatus.cancelled].includes(item.status as any))) {
    alerts.push({ id: "payment-overdue", level: "high" as const, title: "Просрочка платежа", description: "Есть обязательные платежи с прошедшей датой." });
  }

  const counts: Record<string, number> = {};
  for (const item of [...(income as PlanRow[]), ...(payments as PlanRow[]), ...(plannedOperations as PlannedOperationRow[])]) {
    counts[item.status] = (counts[item.status] ?? 0) + 1;
  }

  return {
    user: mapUser(user),
    settings: {
      currentMonth: settings.currentMonth,
      startBalance: toMoney(settings.startBalance),
      editedBalance: settings.editedBalance === null ? null : toMoney(settings.editedBalance)
    },
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
    accounts: (accounts as AccountRow[]).map(mapAccount),
    debts: (debts as DebtRow[]).map(mapDebt),
    income: (income as PlanRow[]).map(mapIncome),
    payments: (payments as PlanRow[]).map(mapPayment),
    operations: (operations as OperationRow[]).map((row) => mapOperation(row, operationEntries as OperationEntryRow[])),
    plannedOperations: (plannedOperations as PlannedOperationRow[]).map(mapPlannedOperation),
    latestSnapshot: mapSnapshot(snapshots[0] as SnapshotRow | undefined),
    counts
  };
}

export async function createAccount(env: WorkerEnv, userId: string, body: unknown) {
  const input = accountInputSchema.parse(body);
  const rows = await sql(env)`
    INSERT INTO "Account" (id, "userId", name, balance, "createdAt")
    VALUES (${id()}, ${userId}, ${input.name}, ${input.balance}, NOW())
    RETURNING id, name, balance, "createdAt"
  `;
  return mapAccount(rows[0] as AccountRow);
}

export async function deleteAccount(env: WorkerEnv, userId: string, accountId: string) {
  await sql(env)`DELETE FROM "Account" WHERE id = ${accountId} AND "userId" = ${userId}`;
  return { ok: true };
}

export async function createDebt(env: WorkerEnv, userId: string, body: unknown) {
  const input = debtInputSchema.parse(body);
  const rows = await sql(env)`
    INSERT INTO "Debt" (id, "userId", name, amount, "createdAt")
    VALUES (${id()}, ${userId}, ${input.name}, ${String(normalizeDebtAmount(input.amount))}, NOW())
    RETURNING id, name, amount, "createdAt"
  `;
  return mapDebt(rows[0] as DebtRow);
}

export async function deleteDebt(env: WorkerEnv, userId: string, debtId: string) {
  await sql(env)`DELETE FROM "Debt" WHERE id = ${debtId} AND "userId" = ${userId}`;
  return { ok: true };
}

export async function reconcile(env: WorkerEnv, userId: string, body: unknown) {
  const input = reconcileSchema.parse(body);
  const db = sql(env);
  for (const account of input.accounts) {
    await db`UPDATE "Account" SET balance = ${account.balance} WHERE id = ${account.id} AND "userId" = ${userId}`;
  }
  for (const debt of input.debts) {
    await db`UPDATE "Debt" SET amount = ${String(normalizeDebtAmount(debt.amount))} WHERE id = ${debt.id} AND "userId" = ${userId}`;
  }
  if (input.editedBalance !== undefined) {
    await db`UPDATE "Settings" SET "editedBalance" = ${input.editedBalance ?? null} WHERE "userId" = ${userId}`;
  }
  const state = await dashboardState(env, userId);
  await db`
    INSERT INTO "BalanceSnapshot" (id, "userId", "accountBalance", "debtBalance", "netBalance", "createdAt")
    VALUES (${id()}, ${userId}, ${state.balances.accountBalance}, ${state.balances.debtBalance}, ${state.balances.netBalance}, NOW())
  `;
  await db`
    INSERT INTO "History" (id, "userId", type, payload, "createdAt")
    VALUES (${id()}, ${userId}, 'balance_reconciled', ${JSON.stringify({ balances: state.balances })}, NOW())
  `;
  return dashboardState(env, userId);
}

export async function history(env: WorkerEnv, userId: string): Promise<HistoryItemDto[]> {
  const rows = await sql(env)`SELECT id, type, payload, "createdAt" FROM "History" WHERE "userId" = ${userId} ORDER BY "createdAt" DESC LIMIT 100`;
  return rows.map((row: any) => ({ id: row.id, type: row.type, payload: row.payload, createdAt: iso(row.createdAt)! }));
}

export async function timeseries(env: WorkerEnv, userId: string): Promise<TimeseriesPointDto[]> {
  const rows = await sql(env)`
    SELECT "createdAt", "accountBalance", "debtBalance", "netBalance"
    FROM "BalanceSnapshot"
    WHERE "userId" = ${userId}
    ORDER BY "createdAt" ASC
    LIMIT 365
  `;
  return rows.map((row: any) => ({
    date: iso(row.createdAt)!,
    accountBalance: toNumber(row.accountBalance),
    debtBalance: toNumber(row.debtBalance),
    netBalance: toNumber(row.netBalance),
    additionalExpenses: 0
  }));
}

export async function createPlannedOperation(env: WorkerEnv, userId: string, body: unknown) {
  const input = plannedOperationInputSchema.parse(body);
  const rows = await sql(env)`
    INSERT INTO "PlannedOperation" (id, "userId", kind, name, amount, "plannedDate", "expectedDate", "actualDate", status, note, "sourceAccountId", "targetAccountId", "targetDebtId", "seriesId", "createdAt")
    VALUES (${id()}, ${userId}, ${input.kind}::"OperationKind", ${input.name}, ${input.amount}, ${new Date(input.plannedDate).toISOString()}, ${dateOrNull(input.expectedDate ?? null)}, ${dateOrNull(input.actualDate ?? null)}, ${input.status}::"PlannedOperationStatus", ${input.note ?? null}, ${input.sourceAccountId ?? null}, ${input.targetAccountId ?? null}, ${input.targetDebtId ?? null}, ${input.seriesId ?? null}, NOW())
    RETURNING id, kind, name, amount, "plannedDate", "expectedDate", "actualDate", status, note, "sourceAccountId", "targetAccountId", "targetDebtId", "seriesId"
  `;
  return mapPlannedOperation(rows[0] as PlannedOperationRow);
}

export async function createPlannedOperationSeries(env: WorkerEnv, userId: string, body: unknown) {
  const input = plannedOperationSeriesInputSchema.parse(body);
  const seriesId = id();
  const db = sql(env);
  await db`
    INSERT INTO "OperationSeries" (id, "userId", name, kind, "defaultAmount", "finalAmount", "startDate", count, "sourceAccountId", "targetAccountId", "targetDebtId", "createdAt")
    VALUES (${seriesId}, ${userId}, ${input.name}, ${input.kind}::"OperationKind", ${input.amount}, ${input.finalAmount ?? null}, ${new Date(input.startDate).toISOString()}, ${input.count}, ${input.sourceAccountId ?? null}, ${input.targetAccountId ?? null}, ${input.targetDebtId ?? null}, NOW())
  `;

  for (const item of generateMonthlySchedule({ startDate: input.startDate, count: input.count, amount: input.amount, finalAmount: input.finalAmount })) {
    await db`
      INSERT INTO "PlannedOperation" (id, "userId", kind, name, amount, "plannedDate", status, note, "sourceAccountId", "targetAccountId", "targetDebtId", "seriesId", "createdAt")
      VALUES (${id()}, ${userId}, ${input.kind}::"OperationKind", ${input.name}, ${item.amount}, ${new Date(item.plannedDate).toISOString()}, 'planned'::"PlannedOperationStatus", ${input.note ?? null}, ${input.sourceAccountId ?? null}, ${input.targetAccountId ?? null}, ${input.targetDebtId ?? null}, ${seriesId}, NOW())
    `;
  }

  const rows = await db`SELECT id, kind, name, amount, "plannedDate", "expectedDate", "actualDate", status, note, "sourceAccountId", "targetAccountId", "targetDebtId", "seriesId" FROM "PlannedOperation" WHERE "seriesId" = ${seriesId} ORDER BY "plannedDate" ASC`;
  return rows.map((row: any) => mapPlannedOperation(row as PlannedOperationRow));
}

export async function markPlannedOperationDone(env: WorkerEnv, userId: string, operationId: string, actualDateInput?: string) {
  const db = sql(env);
  const rows = await db`SELECT id, kind, name, amount, "plannedDate", "expectedDate", "actualDate", status, note, "sourceAccountId", "targetAccountId", "targetDebtId", "seriesId" FROM "PlannedOperation" WHERE id = ${operationId} AND "userId" = ${userId} LIMIT 1`;
  const planned = rows[0] as PlannedOperationRow | undefined;
  if (!planned) throw new Error("Planned operation not found");

  const actualDate = actualDateInput ? new Date(actualDateInput).toISOString() : new Date().toISOString();
  const createdOperationId = id();
  const amount = toNumber(planned.amount);
  await db`
    INSERT INTO "Operation" (id, "userId", kind, name, amount, "operationDate", note, "plannedOperationId", "seriesId", "createdAt")
    VALUES (${createdOperationId}, ${userId}, ${planned.kind}::"OperationKind", ${planned.name}, ${planned.amount}, ${actualDate}, ${planned.note}, ${planned.id}, ${planned.seriesId}, NOW())
  `;

  const entries: { targetType: "account" | "debt"; targetId: string; amount: string }[] = [];
  if ((planned.kind === OperationKind.expense || planned.kind === OperationKind.debt_repayment || planned.kind === OperationKind.transfer) && planned.sourceAccountId) {
    entries.push({ targetType: "account", targetId: planned.sourceAccountId, amount: (-amount).toFixed(2) });
  }
  if ((planned.kind === OperationKind.income || planned.kind === OperationKind.transfer) && planned.targetAccountId) {
    entries.push({ targetType: "account", targetId: planned.targetAccountId, amount: amount.toFixed(2) });
  }
  if (planned.kind === OperationKind.debt_repayment && planned.targetDebtId) {
    entries.push({ targetType: "debt", targetId: planned.targetDebtId, amount: amount.toFixed(2) });
  }

  for (const entry of entries) {
    await db`INSERT INTO "OperationEntry" (id, "operationId", "targetType", "targetId", amount, "createdAt") VALUES (${id()}, ${createdOperationId}, ${entry.targetType}, ${entry.targetId}, ${entry.amount}, NOW())`;
    if (entry.targetType === "account") {
      await db`UPDATE "Account" SET balance = balance + ${entry.amount} WHERE id = ${entry.targetId} AND "userId" = ${userId}`;
    } else {
      await db`UPDATE "Debt" SET amount = amount + ${entry.amount} WHERE id = ${entry.targetId} AND "userId" = ${userId}`;
    }
  }

  const updatedRows = await db`
    UPDATE "PlannedOperation"
    SET status = 'done'::"PlannedOperationStatus", "actualDate" = ${actualDate}
    WHERE id = ${planned.id} AND "userId" = ${userId}
    RETURNING id, kind, name, amount, "plannedDate", "expectedDate", "actualDate", status, note, "sourceAccountId", "targetAccountId", "targetDebtId", "seriesId"
  `;
  return mapPlannedOperation(updatedRows[0] as PlannedOperationRow);
}

export async function deletePlannedOperation(env: WorkerEnv, userId: string, plannedOperationId: string) {
  await sql(env)`DELETE FROM "PlannedOperation" WHERE id = ${plannedOperationId} AND "userId" = ${userId}`;
  return { ok: true };
}

function dateOrNull(value: string | null | undefined) {
  return value ? new Date(value).toISOString() : null;
}

export async function createIncome(env: WorkerEnv, userId: string, body: unknown) {
  const input = incomeInputSchema.parse(body);
  const rows = await sql(env)`
    INSERT INTO "Income" (id, "userId", name, amount, "plannedDate", "expectedDate", "actualDate", status, note, "createdAt")
    VALUES (${id()}, ${userId}, ${input.name}, ${input.amount}, ${new Date(input.plannedDate).toISOString()}, ${dateOrNull(input.expectedDate ?? null)}, ${dateOrNull(input.actualDate ?? null)}, ${input.status}::"IncomeStatus", ${input.note ?? null}, NOW())
    RETURNING id, name, amount, "plannedDate", "expectedDate", "actualDate", status, note
  `;
  return mapIncome(rows[0] as PlanRow);
}

export async function updateIncome(env: WorkerEnv, userId: string, incomeId: string, body: unknown) {
  const input = incomeInputSchema.partial().parse(body);
  const rows = await sql(env)`
    UPDATE "Income"
    SET name = COALESCE(${input.name ?? null}, name),
        amount = COALESCE(${input.amount ?? null}, amount),
        "plannedDate" = COALESCE(${input.plannedDate ? new Date(input.plannedDate).toISOString() : null}, "plannedDate"),
        "expectedDate" = COALESCE(${input.expectedDate ? new Date(input.expectedDate).toISOString() : null}, "expectedDate"),
        "actualDate" = COALESCE(${input.actualDate ? new Date(input.actualDate).toISOString() : null}, "actualDate"),
        status = COALESCE(${input.status ?? null}::"IncomeStatus", status),
        note = COALESCE(${input.note ?? null}, note)
    WHERE id = ${incomeId} AND "userId" = ${userId}
    RETURNING id, name, amount, "plannedDate", "expectedDate", "actualDate", status, note
  `;
  return rows[0] ? mapIncome(rows[0] as PlanRow) : null;
}

export async function deleteIncome(env: WorkerEnv, userId: string, incomeId: string) {
  await sql(env)`DELETE FROM "Income" WHERE id = ${incomeId} AND "userId" = ${userId}`;
  return { ok: true };
}

export async function createPayment(env: WorkerEnv, userId: string, body: unknown) {
  const input = paymentInputSchema.parse(body);
  const rows = await sql(env)`
    INSERT INTO "Payment" (id, "userId", name, amount, "plannedDate", "expectedDate", "actualDate", status, note, "createdAt")
    VALUES (${id()}, ${userId}, ${input.name}, ${input.amount}, ${new Date(input.plannedDate).toISOString()}, ${dateOrNull(input.expectedDate ?? null)}, ${dateOrNull(input.actualDate ?? null)}, ${input.status}::"PaymentStatus", ${input.note ?? null}, NOW())
    RETURNING id, name, amount, "plannedDate", "expectedDate", "actualDate", status, note
  `;
  return mapPayment(rows[0] as PlanRow);
}

export async function updatePayment(env: WorkerEnv, userId: string, paymentId: string, body: unknown) {
  const input = paymentInputSchema.partial().parse(body);
  const rows = await sql(env)`
    UPDATE "Payment"
    SET name = COALESCE(${input.name ?? null}, name),
        amount = COALESCE(${input.amount ?? null}, amount),
        "plannedDate" = COALESCE(${input.plannedDate ? new Date(input.plannedDate).toISOString() : null}, "plannedDate"),
        "expectedDate" = COALESCE(${input.expectedDate ? new Date(input.expectedDate).toISOString() : null}, "expectedDate"),
        "actualDate" = COALESCE(${input.actualDate ? new Date(input.actualDate).toISOString() : null}, "actualDate"),
        status = COALESCE(${input.status ?? null}::"PaymentStatus", status),
        note = COALESCE(${input.note ?? null}, note)
    WHERE id = ${paymentId} AND "userId" = ${userId}
    RETURNING id, name, amount, "plannedDate", "expectedDate", "actualDate", status, note
  `;
  return rows[0] ? mapPayment(rows[0] as PlanRow) : null;
}

export async function deletePayment(env: WorkerEnv, userId: string, paymentId: string) {
  await sql(env)`DELETE FROM "Payment" WHERE id = ${paymentId} AND "userId" = ${userId}`;
  return { ok: true };
}
