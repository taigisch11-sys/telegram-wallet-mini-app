import { applyOperationEntries, generateMonthlySchedule, type IncomeDto, type IncomeStatus, type PaymentDto, type PaymentStatus, type PlannedOperationDto } from "@wallet/shared";
import { Check, Plus, Trash2, WalletCards } from "lucide-react";
import { useState } from "react";
import { AmountInput } from "../components/common/amount-input";
import { Badge } from "../components/common/badge";
import { Card } from "../components/common/card";
import { useWalletState } from "../hooks/use-state";
import { api } from "../lib/api";
import { money } from "../lib/format";
import { recalculateLocalState } from "../lib/local-finance";

const today = () => new Date().toISOString().slice(0, 10);
const plannedIncomeStatus = "planned" satisfies IncomeStatus;
const plannedPaymentStatus = "planned" satisfies PaymentStatus;
const receivedIncomeStatus = "received_on_time" satisfies IncomeStatus;
const paidPaymentStatus = "paid_on_time" satisfies PaymentStatus;

type WalletState = Omit<ReturnType<typeof useWalletState>, "remoteAvailable"> & { remoteAvailable?: boolean };

export function PlanScreen({ wallet, demoMode = false }: { wallet: WalletState; demoMode?: boolean }) {
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
  const [repaymentSourceAccountId, setRepaymentSourceAccountId] = useState("");
  const [repaymentTargetDebtId, setRepaymentTargetDebtId] = useState("");
  const [repaymentRepeatEnabled, setRepaymentRepeatEnabled] = useState(false);
  const [repaymentRepeatCount, setRepaymentRepeatCount] = useState("10");
  const [repaymentFinalDiffers, setRepaymentFinalDiffers] = useState(false);
  const [repaymentFinalAmount, setRepaymentFinalAmount] = useState("0.00");

  const selectedRepaymentAccountId = repaymentSourceAccountId || wallet.data.accounts[0]?.id || "";
  const selectedRepaymentDebtId = repaymentTargetDebtId || wallet.data.debts[0]?.id || "";
  const selectedRepaymentAccount = wallet.data.accounts.find((account) => account.id === selectedRepaymentAccountId) ?? wallet.data.accounts[0];
  const selectedRepaymentDebt = wallet.data.debts.find((debt) => debt.id === selectedRepaymentDebtId) ?? wallet.data.debts[0];
  const paymentScheduleCount = Number(paymentRepeatCount);
  const paymentScheduleInvalid = paymentRepeatEnabled && (!Number.isFinite(paymentScheduleCount) || paymentScheduleCount < 1 || paymentScheduleCount > 120);
  const repaymentScheduleCount = Number(repaymentRepeatCount);
  const repaymentScheduleInvalid = repaymentRepeatEnabled && (!Number.isFinite(repaymentScheduleCount) || repaymentScheduleCount < 1 || repaymentScheduleCount > 120);
  const repaymentSchedulePreview = repaymentRepeatEnabled && !repaymentScheduleInvalid
    ? generateMonthlySchedule({
        startDate: repaymentDate,
        count: repaymentScheduleCount,
        amount: repaymentAmount,
        finalAmount: repaymentFinalDiffers ? repaymentFinalAmount : null
      })
    : [{ amount: normalizeMoney(repaymentAmount), plannedDate: repaymentDate }];
  const repaymentPreviewAmount = repaymentSchedulePreview.reduce((sum, item) => sum + Number(item.amount), 0);
  const repaymentDebtAfter = selectedRepaymentDebt ? Number(selectedRepaymentDebt.amount) + repaymentPreviewAmount : 0;
  const repaymentExceedsDebt = selectedRepaymentDebt ? repaymentPreviewAmount > Math.abs(Number(selectedRepaymentDebt.amount)) : false;
  const localOnly = demoMode || wallet.remoteAvailable !== true;

  async function addIncome() {
    const name = incomeName.trim();
    if (!name) return;
    const amount = normalizeMoney(incomeAmount);
    const plannedDate = new Date(incomeDate).toISOString();
    const income: IncomeDto = {
      id: createId(),
      name,
      amount,
      plannedDate,
      expectedDate: null,
      actualDate: null,
      effectiveDate: plannedDate,
      status: plannedIncomeStatus,
      note: null
    };

    if (localOnly) {
      applyLocalIncome(income);
    } else {
      try {
        await api.createIncome({ name, amount, plannedDate });
        await wallet.refresh();
      } catch {
        applyLocalIncome(income);
      }
    }

    setIncomeName("");
    setIncomeAmount("0.00");
    setIncomeDate(today());
  }

  async function addPayment() {
    const name = paymentName.trim();
    if (!name || paymentScheduleInvalid) return;
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

    if (localOnly) {
      applyLocalPayments(payments);
    } else {
      try {
        for (const payment of payments) {
          await api.createPayment({ name, amount: payment.amount, plannedDate: payment.plannedDate });
        }
        await wallet.refresh();
      } catch {
        applyLocalPayments(payments);
      }
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
    if (localOnly) {
      applyLocalMarkIncome(id);
      return;
    }

    try {
      await api.markIncome(id);
      await wallet.refresh();
    } catch {
      applyLocalMarkIncome(id);
    }
  }

  async function markPayment(id: string) {
    if (localOnly) {
      applyLocalMarkPayment(id);
      return;
    }

    try {
      await api.markPayment(id);
      await wallet.refresh();
    } catch {
      applyLocalMarkPayment(id);
    }
  }

  async function deleteIncome(id: string) {
    if (localOnly) {
      applyLocalDeleteIncome(id);
      return;
    }

    try {
      await api.deleteIncome(id);
      await wallet.refresh();
    } catch {
      applyLocalDeleteIncome(id);
    }
  }

  async function deletePayment(id: string) {
    if (localOnly) {
      applyLocalDeletePayment(id);
      return;
    }

    try {
      await api.deletePayment(id);
      await wallet.refresh();
    } catch {
      applyLocalDeletePayment(id);
    }
  }

  async function addDebtRepayment() {
    const name = repaymentName.trim();
    const sourceAccount = selectedRepaymentAccount;
    const targetDebt = selectedRepaymentDebt;
    if (!name || !sourceAccount || !targetDebt) return;
    if (repaymentExceedsDebt || repaymentPreviewAmount <= 0 || repaymentScheduleInvalid) return;

    const seriesId = repaymentRepeatEnabled ? createId() : null;
    const items: PlannedOperationDto[] = repaymentSchedulePreview.map((scheduleItem) => {
      const plannedDate = new Date(scheduleItem.plannedDate).toISOString();
      return {
        id: createId(),
        kind: "debt_repayment",
        name,
        amount: normalizeMoney(scheduleItem.amount),
        plannedDate,
        expectedDate: null,
        actualDate: null,
        effectiveDate: plannedDate,
        status: "planned",
        note: null,
        sourceAccountId: sourceAccount.id,
        targetAccountId: null,
        targetDebtId: targetDebt.id,
        seriesId
      };
    });

    if (localOnly) {
      applyLocalDebtRepayments(items);
    } else {
      try {
        if (repaymentRepeatEnabled) {
          await api.createPlannedOperationSeries({
            kind: "debt_repayment",
            name,
            amount: normalizeMoney(repaymentAmount),
            startDate: repaymentDate,
            count: Math.floor(repaymentScheduleCount),
            finalAmount: repaymentFinalDiffers ? normalizeMoney(repaymentFinalAmount) : undefined,
            sourceAccountId: sourceAccount.id,
            targetDebtId: targetDebt.id
          });
        } else {
          await api.createPlannedOperation(items[0]);
        }
        await wallet.refresh();
      } catch {
        applyLocalDebtRepayments(items);
      }
    }

    setRepaymentName("");
    setRepaymentAmount("0.00");
    setRepaymentDate(today());
    setRepaymentRepeatEnabled(false);
    setRepaymentRepeatCount("10");
    setRepaymentFinalDiffers(false);
    setRepaymentFinalAmount("0.00");
  }

  async function markDebtRepayment(item: PlannedOperationDto) {
    if (isDebtRepaymentOverLimit(item, wallet.data.debts)) return;

    if (localOnly) {
      applyLocalMarkDebtRepayment(item);
      return;
    }

    try {
      await api.markPlannedOperation(item.id);
      await wallet.refresh();
    } catch {
      applyLocalMarkDebtRepayment(item);
    }
  }

  async function deleteDebtRepayment(id: string) {
    if (localOnly) {
      applyLocalDeleteDebtRepayment(id);
      return;
    }

    try {
      await api.deletePlannedOperation(id);
      await wallet.refresh();
    } catch {
      applyLocalDeleteDebtRepayment(id);
    }
  }

  function applyLocalIncome(item: IncomeDto) {
    wallet.setData((current) => recalculateLocalState({ ...current, income: [...current.income, item] }));
  }

  function applyLocalPayments(items: PaymentDto[]) {
    wallet.setData((current) => recalculateLocalState({ ...current, payments: [...current.payments, ...items] }));
  }

  function applyLocalMarkIncome(id: string) {
    wallet.setData((current) =>
      recalculateLocalState({
        ...current,
        income: current.income.map((item) => (item.id === id ? { ...item, status: receivedIncomeStatus, actualDate: new Date().toISOString() } : item))
      })
    );
  }

  function applyLocalMarkPayment(id: string) {
    wallet.setData((current) =>
      recalculateLocalState({
        ...current,
        payments: current.payments.map((item) => (item.id === id ? { ...item, status: paidPaymentStatus, actualDate: new Date().toISOString() } : item))
      })
    );
  }

  function applyLocalDeleteIncome(id: string) {
    wallet.setData((current) => recalculateLocalState({ ...current, income: current.income.filter((item) => item.id !== id) }));
  }

  function applyLocalDeletePayment(id: string) {
    wallet.setData((current) => recalculateLocalState({ ...current, payments: current.payments.filter((item) => item.id !== id) }));
  }

  function applyLocalDebtRepayments(items: PlannedOperationDto[]) {
    wallet.setData((current) => recalculateLocalState({ ...current, plannedOperations: [...current.plannedOperations, ...items] }));
  }

  function applyLocalDeleteDebtRepayment(id: string) {
    wallet.setData((current) => recalculateLocalState({ ...current, plannedOperations: current.plannedOperations.filter((item) => item.id !== id) }));
  }

  function applyLocalMarkDebtRepayment(item: PlannedOperationDto) {
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

  return (
    <div className="space-y-3">
      <Card>
        <h2 className="mb-3 text-lg font-extrabold">Доходы</h2>
        <PlanForm
          name={incomeName}
          amount={incomeAmount}
          date={incomeDate}
          actionLabel="Добавить доход"
          nameLabel="Название дохода"
          amountLabel="Сумма дохода"
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
          nameLabel="Название платежа"
          amountLabel="Сумма платежа"
          onName={setPaymentName}
          onAmount={setPaymentAmount}
          onDate={setPaymentDate}
          onSubmit={() => void addPayment()}
          disabled={paymentScheduleInvalid}
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
        {paymentScheduleInvalid ? <p className="mt-2 rounded-2xl border border-amber/35 bg-amber/10 px-3 py-2 text-sm font-bold text-amber">Можно создать не больше 120 платежей за раз.</p> : null}
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
              <DebtBalance label={selectedRepaymentAccount.name} amount={selectedRepaymentAccount.balance} tone="account" />
              <DebtBalance label={selectedRepaymentDebt.name} amount={selectedRepaymentDebt.amount} tone="debt" />
            </div>
            <div className="mb-2 grid grid-cols-2 gap-2">
              <label className="block text-xs font-bold text-slate-400">
                Счёт списания
                <select
                  aria-label="Счёт списания"
                  className="mt-1 w-full rounded-md border border-line bg-ink px-3 py-2 text-sm text-white"
                  value={selectedRepaymentAccountId}
                  onChange={(event) => setRepaymentSourceAccountId(event.target.value)}
                >
                  {wallet.data.accounts.map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-xs font-bold text-slate-400">
                Долг для погашения
                <select
                  aria-label="Долг для погашения"
                  className="mt-1 w-full rounded-md border border-line bg-ink px-3 py-2 text-sm text-white"
                  value={selectedRepaymentDebtId}
                  onChange={(event) => setRepaymentTargetDebtId(event.target.value)}
                >
                  {wallet.data.debts.map((debt) => (
                    <option key={debt.id} value={debt.id}>
                      {debt.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_104px_42px]">
              <input aria-label="Название погашения" className="min-w-0 rounded-md border border-line bg-ink px-3 py-2" placeholder="Погашение кредитки" value={repaymentName} onChange={(event) => setRepaymentName(event.target.value)} />
              <AmountInput label="Сумма погашения" value={repaymentAmount} onChange={setRepaymentAmount} compact showLabel={false} />
              <button
                className="min-h-11 rounded-md bg-action text-white disabled:bg-white/10 disabled:text-slate-500"
                type="button"
                onClick={() => void addDebtRepayment()}
                aria-label="Добавить погашение долга"
                disabled={repaymentExceedsDebt || repaymentPreviewAmount <= 0 || repaymentScheduleInvalid}
              >
                <Plus className="mx-auto" size={18} />
              </button>
              <input className="rounded-md border border-line bg-ink px-3 py-2 text-sm sm:col-span-3" type="date" value={repaymentDate} onChange={(event) => setRepaymentDate(event.target.value)} aria-label="Дата погашения" />
            </div>
            <ScheduleBuilder
              enabled={repaymentRepeatEnabled}
              count={repaymentRepeatCount}
              finalDiffers={repaymentFinalDiffers}
              finalAmount={repaymentFinalAmount}
              onToggle={() => setRepaymentRepeatEnabled((value) => !value)}
              onCount={setRepaymentRepeatCount}
              onFinalDiffers={setRepaymentFinalDiffers}
              onFinalAmount={setRepaymentFinalAmount}
            />
            {repaymentScheduleInvalid ? <p className="mt-2 rounded-2xl border border-amber/35 bg-amber/10 px-3 py-2 text-sm font-bold text-amber">Можно создать не больше 120 платежей за раз.</p> : null}
            <div className={`mt-3 rounded-[22px] border p-3 text-sm font-semibold ${repaymentExceedsDebt ? "border-amber/35 bg-amber/10 text-amber" : "border-action/25 bg-action/10 text-slate-200"}`}>
              {repaymentExceedsDebt ? (
                <span>Сумма больше текущего долга. Уменьшите платёж или обновите остаток долга.</span>
              ) : (
                <span>
                  С {selectedRepaymentAccount.name} спишется {money(repaymentPreviewAmount.toFixed(2))}, долг станет {money(repaymentDebtAfter.toFixed(2))}.
                </span>
              )}
            </div>
          </>
        )}
        <div className="mt-3 space-y-3">
          {wallet.data.plannedOperations
            .filter((item) => item.kind === "debt_repayment")
            .map((item) => (
              <DebtRepaymentRow key={item.id} item={item} debts={wallet.data.debts} onDelete={() => void deleteDebtRepayment(item.id)} onDone={() => void markDebtRepayment(item)} />
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
  nameLabel,
  amountLabel,
  onName,
  onAmount,
  onDate,
  onSubmit,
  disabled = false
}: {
  name: string;
  amount: string;
  date: string;
  actionLabel: string;
  nameLabel: string;
  amountLabel: string;
  onName: (value: string) => void;
  onAmount: (value: string) => void;
  onDate: (value: string) => void;
  onSubmit: () => void;
  disabled?: boolean;
}) {
  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_110px_42px]">
      <label className="block text-xs font-bold text-slate-400">
        {nameLabel}
        <input className="mt-1 w-full min-w-0 rounded-md border border-line bg-ink px-3 py-2 text-white" placeholder="Название" value={name} onChange={(event) => onName(event.target.value)} />
      </label>
      <div>
        <p className="text-xs font-bold text-slate-400">{amountLabel}</p>
        <AmountInput label={amountLabel} value={amount} onChange={onAmount} compact showLabel={false} />
      </div>
      <button
        className="flex min-h-11 items-center justify-center gap-2 rounded-md bg-action px-4 py-3 font-extrabold text-white disabled:bg-white/10 disabled:text-slate-500 sm:mt-5 sm:w-11 sm:px-0"
        type="button"
        onClick={onSubmit}
        aria-label={actionLabel}
        disabled={disabled}
      >
        <Plus size={18} />
        <span className="sm:hidden">{actionLabel}</span>
      </button>
      <input className="rounded-md border border-line bg-ink px-3 py-2 text-sm sm:col-span-3" type="date" value={date} onChange={(event) => onDate(event.target.value)} aria-label={`${actionLabel}: дата`} />
      <div className="flex flex-wrap gap-2 sm:col-span-3">
        {quickDateOptions().map((item) => (
          <button key={item.label} className="rounded-full bg-action/15 px-3 py-1.5 text-xs font-extrabold text-action" type="button" onClick={() => onDate(item.value)}>
            {item.label}
          </button>
        ))}
      </div>
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
  const countValue = Number(count) || 1;
  const badge = enabled ? `${count || 1} ${paymentWord(countValue)}` : "выкл";
  return (
    <div className="mt-3 rounded-[22px] border border-white/10 bg-white/[0.03] p-3">
      <button type="button" className="flex w-full items-center justify-between text-left text-sm font-extrabold text-action" onClick={onToggle}>
        Размножить платежи
        <span className="rounded-full bg-action/15 px-2 py-1 text-xs text-action">{badge}</span>
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
            <div>
              <p className="text-xs font-bold text-slate-400">Последний платёж</p>
              <AmountInput label="Последний платёж" value={finalAmount} onChange={onFinalAmount} compact showLabel={false} />
            </div>
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
      <WalletCards className={tone === "income" ? "text-positive" : item.status === "overdue" ? "text-danger" : "text-amber"} size={20} />
      <div className="min-w-0 flex-1">
        <p className="truncate font-bold">{item.name}</p>
        <p className="text-xs text-slate-500">{planDate(item.effectiveDate)}</p>
      </div>
      <div className="text-right">
        <p className="font-bold">{money(item.amount)}</p>
        <Badge status={item.status} />
      </div>
      {canMarkDone ? (
        <button className="grid h-9 w-9 place-items-center rounded-md bg-positive text-[#07160f]" type="button" onClick={onDone} aria-label={tone === "income" ? "Получено" : "Оплачено"}>
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
      <p className={`mt-1 text-base font-extrabold ${tone === "debt" ? "text-danger" : "text-white"}`}>{money(amount)}</p>
    </div>
  );
}

function DebtRepaymentRow({ item, debts, onDelete, onDone }: { item: PlannedOperationDto; debts: { id: string; amount: string }[]; onDelete: () => void; onDone: () => void }) {
  const isDone = item.status === "done";
  const overLimit = isDebtRepaymentOverLimit(item, debts);
  return (
    <div className={`flex items-center gap-3 ${isDone ? "opacity-55" : ""}`}>
      <WalletCards className="text-action" size={20} />
      <div className="min-w-0 flex-1">
        <p className="truncate font-bold">{item.name}</p>
        <p className="text-xs text-slate-500">Погашение долга • {planDate(item.effectiveDate)}</p>
        {overLimit && !isDone ? <p className="mt-1 text-xs font-bold text-amber">Сумма погашения больше текущего долга</p> : null}
      </div>
      <div className="text-right">
        <p className="font-bold">{money(item.amount)}</p>
        <Badge status={item.status} />
      </div>
      {!isDone ? (
        <button className="grid h-9 w-9 place-items-center rounded-md bg-positive text-[#07160f] disabled:bg-white/10 disabled:text-slate-500" type="button" onClick={onDone} aria-label="Погашение выполнено" disabled={overLimit}>
          <Check size={17} />
        </button>
      ) : null}
      {!isDone ? (
        <button className="grid h-9 w-9 place-items-center rounded-md border border-danger/50 text-danger" type="button" onClick={onDelete} aria-label={`Удалить погашение долга ${item.name}`}>
          <Trash2 size={16} />
        </button>
      ) : null}
    </div>
  );
}

function isDebtRepaymentOverLimit(item: PlannedOperationDto, debts: { id: string; amount: string }[]) {
  const debt = debts.find((entry) => entry.id === item.targetDebtId);
  if (!debt) return true;

  const amount = Number(item.amount);
  const debtAmount = Math.abs(Number(debt.amount));
  if (!Number.isFinite(amount) || !Number.isFinite(debtAmount) || amount <= 0) return true;

  return amount > debtAmount + 0.009;
}

function paymentWord(count: number) {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 === 1 && mod100 !== 11) return "платёж";
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return "платежа";
  return "платежей";
}

function planDate(value: string) {
  return new Intl.DateTimeFormat("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(value));
}

function quickDateOptions() {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const salaryDay = new Date(now.getFullYear(), now.getMonth(), 25);
  if (salaryDay < now) salaryDay.setMonth(salaryDay.getMonth() + 1);

  return [
    { label: "Сегодня", value: toDateInput(now) },
    { label: "Завтра", value: toDateInput(tomorrow) },
    { label: "25 число", value: toDateInput(salaryDay) }
  ];
}

function toDateInput(value: Date) {
  return value.toISOString().slice(0, 10);
}

function normalizeMoney(value: string) {
  const parsed = Number(String(value).replace(",", "."));
  return Number.isFinite(parsed) ? Math.abs(parsed).toFixed(2) : "0.00";
}

function createId() {
  return globalThis.crypto?.randomUUID?.() ?? `local-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}
