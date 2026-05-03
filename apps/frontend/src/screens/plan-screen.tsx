import { applyOperationEntries, generateMonthlySchedule, type IncomeDto, type IncomeStatus, type PaymentDto, type PaymentStatus, type PlannedOperationDto } from "@wallet/shared";
import { Check, Plus, Trash2, WalletCards } from "lucide-react";
import { useState } from "react";
import { Badge } from "../components/common/badge";
import { Card } from "../components/common/card";
import { useWalletState } from "../hooks/use-state";
import { api } from "../lib/api";
import { money, shortDate } from "../lib/format";
import { recalculateLocalState } from "../lib/local-finance";

const today = () => new Date().toISOString().slice(0, 10);
const plannedIncomeStatus = "planned" satisfies IncomeStatus;
const plannedPaymentStatus = "planned" satisfies PaymentStatus;
const receivedIncomeStatus = "received_on_time" satisfies IncomeStatus;
const paidPaymentStatus = "paid_on_time" satisfies PaymentStatus;

export function PlanScreen({ wallet }: { wallet: ReturnType<typeof useWalletState> }) {
  const [incomeName, setIncomeName] = useState("");
  const [incomeAmount, setIncomeAmount] = useState("0.00");
  const [incomeDate, setIncomeDate] = useState(today);
  const [paymentName, setPaymentName] = useState("");
  const [paymentAmount, setPaymentAmount] = useState("0.00");
  const [paymentDate, setPaymentDate] = useState(today);
  const [paymentRepeatEnabled, setPaymentRepeatEnabled] = useState(false);
  const [paymentRepeatCount, setPaymentRepeatCount] = useState("10");
  const [paymentFinalDiffers, setPaymentFinalDiffers] = useState(false);
  const [paymentFinalAmount, setPaymentFinalAmount] = useState("0.00");
  const [repaymentName, setRepaymentName] = useState("");
  const [repaymentAmount, setRepaymentAmount] = useState("0.00");
  const [repaymentDate, setRepaymentDate] = useState(today);

  async function addIncome() {
    const name = incomeName.trim();
    if (!name) return;
    const amount = normalizeMoney(incomeAmount);
    const plannedDate = new Date(incomeDate).toISOString();

    try {
      await api.createIncome({ name, amount, plannedDate });
      await wallet.refresh();
    } catch {
      wallet.setData((current) => recalculateLocalState({
        ...current,
        income: [
          ...current.income,
          {
            id: createId(),
            name,
            amount,
            plannedDate,
            expectedDate: null,
            actualDate: null,
            effectiveDate: plannedDate,
            status: plannedIncomeStatus,
            note: null
          }
        ]
      }));
    }

    setIncomeName("");
    setIncomeAmount("0.00");
    setIncomeDate(today());
  }

  async function addPayment() {
    const name = paymentName.trim();
    if (!name) return;
    const schedule = paymentRepeatEnabled
      ? generateMonthlySchedule({
          startDate: paymentDate,
          count: Number(paymentRepeatCount),
          amount: paymentAmount,
          finalAmount: paymentFinalDiffers ? paymentFinalAmount : null
        })
      : [{ amount: normalizeMoney(paymentAmount), plannedDate: paymentDate }];
    const payments: PaymentDto[] = schedule.map((item) => ({
      id: createId(),
      name,
      amount: normalizeMoney(item.amount),
      plannedDate: new Date(item.plannedDate).toISOString(),
      expectedDate: null,
      actualDate: null,
      effectiveDate: new Date(item.plannedDate).toISOString(),
      status: plannedPaymentStatus,
      note: null
    }));

    try {
      for (const payment of payments) {
        await api.createPayment({ name, amount: payment.amount, plannedDate: payment.plannedDate });
      }
      await wallet.refresh();
    } catch {
      wallet.setData((current) => recalculateLocalState({
        ...current,
        payments: [...current.payments, ...payments]
      }));
    }

    setPaymentName("");
    setPaymentAmount("0.00");
    setPaymentDate(today());
    setPaymentRepeatEnabled(false);
    setPaymentRepeatCount("10");
    setPaymentFinalDiffers(false);
    setPaymentFinalAmount("0.00");
  }

  async function markIncome(id: string) {
    try {
      await api.markIncome(id);
      await wallet.refresh();
    } catch {
      wallet.setData((current) => recalculateLocalState({
        ...current,
        income: current.income.map((item) => (item.id === id ? { ...item, status: receivedIncomeStatus, actualDate: new Date().toISOString() } : item))
      }));
    }
  }

  async function markPayment(id: string) {
    try {
      await api.markPayment(id);
      await wallet.refresh();
    } catch {
      wallet.setData((current) => recalculateLocalState({
        ...current,
        payments: current.payments.map((item) => (item.id === id ? { ...item, status: paidPaymentStatus, actualDate: new Date().toISOString() } : item))
      }));
    }
  }

  async function deleteIncome(id: string) {
    try {
      await api.deleteIncome(id);
      await wallet.refresh();
    } catch {
      wallet.setData((current) => recalculateLocalState({ ...current, income: current.income.filter((item) => item.id !== id) }));
    }
  }

  async function deletePayment(id: string) {
    try {
      await api.deletePayment(id);
      await wallet.refresh();
    } catch {
      wallet.setData((current) => recalculateLocalState({ ...current, payments: current.payments.filter((item) => item.id !== id) }));
    }
  }

  async function addDebtRepayment() {
    const name = repaymentName.trim();
    const sourceAccount = wallet.data.accounts[0];
    const targetDebt = wallet.data.debts[0];
    if (!name || !sourceAccount || !targetDebt) return;

    const plannedDate = new Date(repaymentDate).toISOString();
    const item: PlannedOperationDto = {
      id: createId(),
      kind: "debt_repayment",
      name,
      amount: normalizeMoney(repaymentAmount),
      plannedDate,
      expectedDate: null,
      actualDate: null,
      effectiveDate: plannedDate,
      status: "planned",
      note: null,
      sourceAccountId: sourceAccount.id,
      targetAccountId: null,
      targetDebtId: targetDebt.id,
      seriesId: null
    };

    try {
      await api.createPlannedOperation(item);
      await wallet.refresh();
    } catch {
      wallet.setData((current) => recalculateLocalState({ ...current, plannedOperations: [...current.plannedOperations, item] }));
    }

    setRepaymentName("");
    setRepaymentAmount("0.00");
    setRepaymentDate(today());
  }

  async function markDebtRepayment(item: PlannedOperationDto) {
    try {
      await api.markPlannedOperation(item.id);
      await wallet.refresh();
    } catch {
      wallet.setData((current) => {
        const amount = Number(item.amount);
        const result = applyOperationEntries(
          {
            accounts: current.accounts.map((account) => ({ id: account.id, balance: Number(account.balance) })),
            debts: current.debts.map((debt) => ({ id: debt.id, amount: Number(debt.amount) }))
          },
          [
            { targetType: "account", targetId: item.sourceAccountId ?? "", amount: -amount },
            { targetType: "debt", targetId: item.targetDebtId ?? "", amount }
          ]
        );

        return recalculateLocalState({
          ...current,
          accounts: current.accounts.map((account) => ({
            ...account,
            balance: (result.accounts.find((entry) => entry.id === account.id)?.balance ?? Number(account.balance)).toFixed(2)
          })),
          debts: current.debts.map((debt) => ({
            ...debt,
            amount: (result.debts.find((entry) => entry.id === debt.id)?.amount ?? Number(debt.amount)).toFixed(2)
          })),
          plannedOperations: current.plannedOperations.map((operation) => (operation.id === item.id ? { ...operation, status: "done", actualDate: new Date().toISOString() } : operation)),
          operations: [
            ...current.operations,
            {
              id: createId(),
              kind: "debt_repayment",
              name: item.name,
              amount: item.amount,
              operationDate: new Date().toISOString(),
              note: "Погашение долга",
              plannedOperationId: item.id,
              seriesId: item.seriesId,
              createdAt: new Date().toISOString(),
              entries: [
                { id: createId(), targetType: "account", targetId: item.sourceAccountId ?? "", amount: (-amount).toFixed(2) },
                { id: createId(), targetType: "debt", targetId: item.targetDebtId ?? "", amount: amount.toFixed(2) }
              ]
            }
          ]
        });
      });
    }
  }

  return (
    <div className="space-y-3">
      <Card>
        <h2 className="mb-3 text-lg font-extrabold">Доходы</h2>
        <PlanForm
          name={incomeName}
          amount={incomeAmount}
          date={incomeDate}
          actionLabel="Добавить доход"
          onName={setIncomeName}
          onAmount={setIncomeAmount}
          onDate={setIncomeDate}
          onSubmit={() => void addIncome()}
        />
        {wallet.data.income.length === 0 ? <p className="mt-3 rounded-md border border-line p-3 text-sm text-slate-400">Запланированных доходов пока нет.</p> : null}
        <div className="mt-3 space-y-3">
          {wallet.data.income.map((item) => (
            <PlanRow key={item.id} item={item} tone="income" onDone={() => void markIncome(item.id)} onDelete={() => void deleteIncome(item.id)} />
          ))}
        </div>
      </Card>

      <Card>
        <h2 className="mb-3 text-lg font-extrabold">Платежи</h2>
        <PlanForm
          name={paymentName}
          amount={paymentAmount}
          date={paymentDate}
          actionLabel="Добавить платёж"
          onName={setPaymentName}
          onAmount={setPaymentAmount}
          onDate={setPaymentDate}
          onSubmit={() => void addPayment()}
        />
        <ScheduleBuilder
          enabled={paymentRepeatEnabled}
          count={paymentRepeatCount}
          finalDiffers={paymentFinalDiffers}
          finalAmount={paymentFinalAmount}
          onToggle={() => setPaymentRepeatEnabled((value) => !value)}
          onCount={setPaymentRepeatCount}
          onFinalDiffers={setPaymentFinalDiffers}
          onFinalAmount={setPaymentFinalAmount}
        />
        {wallet.data.payments.length === 0 ? <p className="mt-3 rounded-md border border-line p-3 text-sm text-slate-400">Обязательных платежей пока нет.</p> : null}
        <div className="mt-3 space-y-3">
          {wallet.data.payments.map((item) => (
            <PlanRow key={item.id} item={item} tone="payment" onDone={() => void markPayment(item.id)} onDelete={() => void deletePayment(item.id)} />
          ))}
        </div>
      </Card>

      <Card>
        <h2 className="mb-3 text-lg font-extrabold">Погашение долгов</h2>
        {wallet.data.accounts.length === 0 || wallet.data.debts.length === 0 ? (
          <p className="rounded-md border border-line p-3 text-sm text-slate-400">Добавьте хотя бы один счёт и один долговой счёт, чтобы планировать погашение.</p>
        ) : (
          <>
            <div className="mb-3 grid grid-cols-2 gap-2">
              <DebtBalance label={wallet.data.accounts[0].name} amount={wallet.data.accounts[0].balance} tone="account" />
              <DebtBalance label={wallet.data.debts[0].name} amount={wallet.data.debts[0].amount} tone="debt" />
            </div>
            <div className="grid grid-cols-[1fr_104px_42px] gap-2">
              <input aria-label="Название погашения" className="min-w-0 rounded-md border border-line bg-ink px-3 py-2" placeholder="Погашение кредитки" value={repaymentName} onChange={(event) => setRepaymentName(event.target.value)} />
              <input aria-label="Сумма погашения" className="min-w-0 rounded-md border border-line bg-ink px-3 py-2 text-right" inputMode="decimal" value={repaymentAmount} onChange={(event) => setRepaymentAmount(event.target.value)} />
              <button className="grid place-items-center rounded-md bg-mint text-ink" type="button" onClick={() => void addDebtRepayment()} aria-label="Добавить погашение долга">
                <Plus size={18} />
              </button>
              <input className="col-span-3 rounded-md border border-line bg-ink px-3 py-2 text-sm" type="date" value={repaymentDate} onChange={(event) => setRepaymentDate(event.target.value)} aria-label="Дата погашения" />
            </div>
          </>
        )}
        <div className="mt-3 space-y-3">
          {wallet.data.plannedOperations
            .filter((item) => item.kind === "debt_repayment")
            .map((item) => (
              <DebtRepaymentRow key={item.id} item={item} onDone={() => void markDebtRepayment(item)} />
            ))}
        </div>
      </Card>
    </div>
  );
}

function PlanForm({
  name,
  amount,
  date,
  actionLabel,
  onName,
  onAmount,
  onDate,
  onSubmit
}: {
  name: string;
  amount: string;
  date: string;
  actionLabel: string;
  onName: (value: string) => void;
  onAmount: (value: string) => void;
  onDate: (value: string) => void;
  onSubmit: () => void;
}) {
  return (
    <div className="grid grid-cols-[1fr_94px_42px] gap-2">
      <input className="min-w-0 rounded-md border border-line bg-ink px-3 py-2" placeholder="Название" value={name} onChange={(event) => onName(event.target.value)} />
      <input className="min-w-0 rounded-md border border-line bg-ink px-3 py-2 text-right" inputMode="decimal" value={amount} onChange={(event) => onAmount(event.target.value)} />
      <button className="grid place-items-center rounded-md bg-mint text-ink" type="button" onClick={onSubmit} aria-label={actionLabel}>
        <Plus size={18} />
      </button>
      <input className="col-span-3 rounded-md border border-line bg-ink px-3 py-2 text-sm" type="date" value={date} onChange={(event) => onDate(event.target.value)} aria-label={`${actionLabel}: дата`} />
    </div>
  );
}

function ScheduleBuilder({
  enabled,
  count,
  finalDiffers,
  finalAmount,
  onToggle,
  onCount,
  onFinalDiffers,
  onFinalAmount
}: {
  enabled: boolean;
  count: string;
  finalDiffers: boolean;
  finalAmount: string;
  onToggle: () => void;
  onCount: (value: string) => void;
  onFinalDiffers: (value: boolean) => void;
  onFinalAmount: (value: string) => void;
}) {
  return (
    <div className="mt-3 rounded-[22px] border border-white/10 bg-white/[0.03] p-3">
      <button type="button" className="flex w-full items-center justify-between text-left text-sm font-extrabold text-[#55a7ff]" onClick={onToggle}>
        Создать график
        <span className="rounded-full bg-[#2f8cff]/15 px-2 py-1 text-xs text-[#8bd3ff]">{enabled ? "включён" : "ежемесячно"}</span>
      </button>
      {enabled ? (
        <div className="mt-3 space-y-3">
          <label className="block text-xs font-bold text-slate-400">
            Количество платежей
            <input
              aria-label="Количество платежей"
              className="mt-1 w-full rounded-md border border-line bg-ink px-3 py-2 text-right text-sm text-white"
              inputMode="numeric"
              value={count}
              onChange={(event) => onCount(event.target.value)}
            />
          </label>
          <label className="flex items-center gap-2 rounded-2xl bg-black/15 p-3 text-sm font-bold text-white">
            <input aria-label="Последний платёж отличается" type="checkbox" checked={finalDiffers} onChange={(event) => onFinalDiffers(event.target.checked)} />
            Последний платёж отличается
          </label>
          {finalDiffers ? (
            <label className="block text-xs font-bold text-slate-400">
              Последний платёж
              <input
                aria-label="Последний платёж"
                className="mt-1 w-full rounded-md border border-line bg-ink px-3 py-2 text-right text-sm text-white"
                inputMode="decimal"
                value={finalAmount}
                onChange={(event) => onFinalAmount(event.target.value)}
              />
            </label>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function PlanRow({ item, tone, onDone, onDelete }: { item: IncomeDto | PaymentDto; tone: "income" | "payment"; onDone: () => void; onDelete: () => void }) {
  const isDone = item.status.includes("received") || item.status.includes("paid");
  const canMarkDone = !isDone && !["cancelled", "skipped"].includes(item.status);

  return (
    <div className={`flex items-center gap-3 ${isDone ? "opacity-55" : ""}`}>
      <WalletCards className={tone === "income" ? "text-mint" : item.status === "overdue" ? "text-danger" : "text-amber"} size={20} />
      <div className="min-w-0 flex-1">
        <p className="truncate font-bold">{item.name}</p>
        <p className="text-xs text-slate-500">{planDate(item.effectiveDate)}</p>
      </div>
      <div className="text-right">
        <p className="font-bold">{money(item.amount)}</p>
        <Badge status={item.status} />
      </div>
      {canMarkDone ? (
        <button className="grid h-9 w-9 place-items-center rounded-md bg-mint text-ink" type="button" onClick={onDone} aria-label={tone === "income" ? "Получено" : "Оплачено"}>
          <Check size={17} />
        </button>
      ) : null}
      <button className="grid h-9 w-9 place-items-center rounded-md border border-danger/50 text-danger" type="button" onClick={onDelete} aria-label={tone === "income" ? "Удалить доход" : "Удалить платёж"}>
        <Trash2 size={16} />
      </button>
    </div>
  );
}

function DebtBalance({ label, amount, tone }: { label: string; amount: string; tone: "account" | "debt" }) {
  return (
    <div className="rounded-[18px] bg-[#202024] p-3">
      <p className="truncate text-xs font-bold text-slate-400">{label}</p>
      <p className={`mt-1 text-base font-extrabold ${tone === "debt" ? "text-[#ff6b73]" : "text-white"}`}>{money(amount)}</p>
    </div>
  );
}

function DebtRepaymentRow({ item, onDone }: { item: PlannedOperationDto; onDone: () => void }) {
  const isDone = item.status === "done";
  return (
    <div className={`flex items-center gap-3 ${isDone ? "opacity-55" : ""}`}>
      <WalletCards className="text-[#55a7ff]" size={20} />
      <div className="min-w-0 flex-1">
        <p className="truncate font-bold">{item.name}</p>
        <p className="text-xs text-slate-500">Погашение долга • {planDate(item.effectiveDate)}</p>
      </div>
      <div className="text-right">
        <p className="font-bold">{money(item.amount)}</p>
        <Badge status={item.status} />
      </div>
      {!isDone ? (
        <button className="grid h-9 w-9 place-items-center rounded-md bg-mint text-ink" type="button" onClick={onDone} aria-label="Погашение выполнено">
          <Check size={17} />
        </button>
      ) : null}
    </div>
  );
}

function planDate(value: string) {
  return new Intl.DateTimeFormat("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(value));
}

function normalizeMoney(value: string) {
  const parsed = Number(String(value).replace(",", "."));
  return Number.isFinite(parsed) ? Math.abs(parsed).toFixed(2) : "0.00";
}

function createId() {
  return globalThis.crypto?.randomUUID?.() ?? `local-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}
