import type { IncomeDto, IncomeStatus, PaymentDto, PaymentStatus } from "@wallet/shared";
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
    const amount = normalizeMoney(paymentAmount);
    const plannedDate = new Date(paymentDate).toISOString();

    try {
      await api.createPayment({ name, amount, plannedDate });
      await wallet.refresh();
    } catch {
      wallet.setData((current) => recalculateLocalState({
        ...current,
        payments: [
          ...current.payments,
          {
            id: createId(),
            name,
            amount,
            plannedDate,
            expectedDate: null,
            actualDate: null,
            effectiveDate: plannedDate,
            status: plannedPaymentStatus,
            note: null
          }
        ]
      }));
    }

    setPaymentName("");
    setPaymentAmount("0.00");
    setPaymentDate(today());
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
        {wallet.data.payments.length === 0 ? <p className="mt-3 rounded-md border border-line p-3 text-sm text-slate-400">Обязательных платежей пока нет.</p> : null}
        <div className="mt-3 space-y-3">
          {wallet.data.payments.map((item) => (
            <PlanRow key={item.id} item={item} tone="payment" onDone={() => void markPayment(item.id)} onDelete={() => void deletePayment(item.id)} />
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

function PlanRow({ item, tone, onDone, onDelete }: { item: IncomeDto | PaymentDto; tone: "income" | "payment"; onDone: () => void; onDelete: () => void }) {
  const isDone = item.status.includes("received") || item.status.includes("paid");
  const canMarkDone = !isDone && !["cancelled", "skipped"].includes(item.status);

  return (
    <div className={`flex items-center gap-3 ${isDone ? "opacity-55" : ""}`}>
      <WalletCards className={tone === "income" ? "text-mint" : item.status === "overdue" ? "text-danger" : "text-amber"} size={20} />
      <div className="min-w-0 flex-1">
        <p className="truncate font-bold">{item.name}</p>
        <p className="text-xs text-slate-500">{shortDate(item.effectiveDate)}</p>
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

function normalizeMoney(value: string) {
  const parsed = Number(String(value).replace(",", "."));
  return Number.isFinite(parsed) ? Math.abs(parsed).toFixed(2) : "0.00";
}

function createId() {
  return globalThis.crypto?.randomUUID?.() ?? `local-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}
