import { Plus, RefreshCw, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { AmountInput } from "../components/common/amount-input";
import { Card } from "../components/common/card";
import { useWalletState } from "../hooks/use-state";
import { api } from "../lib/api";
import { money } from "../lib/format";
import { recalculateLocalState } from "../lib/local-finance";

type WalletState = Omit<ReturnType<typeof useWalletState>, "remoteAvailable"> & { remoteAvailable?: boolean };

export function AccountsScreen({ wallet, demoMode = false }: { wallet: WalletState; demoMode?: boolean }) {
  const [accounts, setAccounts] = useState(() => wallet.data.accounts.map((item) => ({ id: item.id, balance: item.balance })));
  const [debts, setDebts] = useState(() => wallet.data.debts.map((item) => ({ id: item.id, amount: item.amount })));
  const [editedBalance, setEditedBalance] = useState(wallet.data.settings.editedBalance ?? wallet.data.balances.currentBalance);
  const [newAccountName, setNewAccountName] = useState("");
  const [newAccountBalance, setNewAccountBalance] = useState("0.00");
  const [newDebtName, setNewDebtName] = useState("");
  const [newDebtAmount, setNewDebtAmount] = useState("0.00");
  const draftNetBalance = calculateDraftNetBalance(accounts, debts);
  const currentNetBalance = Number(wallet.data.balances.netBalance);
  const reconcileDifference = draftNetBalance - currentNetBalance;
  const localOnly = demoMode || wallet.remoteAvailable !== true;

  useEffect(() => {
    setAccounts(wallet.data.accounts.map((item) => ({ id: item.id, balance: item.balance })));
    setDebts(wallet.data.debts.map((item) => ({ id: item.id, amount: item.amount })));
    setEditedBalance(wallet.data.settings.editedBalance ?? wallet.data.balances.currentBalance);
  }, [wallet.data]);

  async function addAccount() {
    const name = newAccountName.trim();
    if (!name) return;

    const account = {
      id: createId(),
      name,
      balance: normalizeMoney(newAccountBalance),
      createdAt: new Date().toISOString()
    };

    if (localOnly) {
      applyLocalCreateAccount(account);
    } else {
      try {
        await api.createAccount({ name, balance: account.balance });
        await wallet.refresh();
      } catch {
        applyLocalCreateAccount(account);
      }
    }

    setNewAccountName("");
    setNewAccountBalance("0.00");
  }

  async function addDebt() {
    const name = newDebtName.trim();
    if (!name) return;

    const debt = {
      id: createId(),
      name,
      amount: normalizeDebt(newDebtAmount),
      createdAt: new Date().toISOString()
    };

    if (localOnly) {
      applyLocalCreateDebt(debt);
    } else {
      try {
        await api.createDebt({ name, amount: debt.amount });
        await wallet.refresh();
      } catch {
        applyLocalCreateDebt(debt);
      }
    }

    setNewDebtName("");
    setNewDebtAmount("0.00");
  }

  async function deleteAccount(id: string) {
    if (localOnly) {
      applyLocalDeleteAccount(id);
      return;
    }

    try {
      await api.deleteAccount(id);
      await wallet.refresh();
    } catch {
      applyLocalDeleteAccount(id);
    }
  }

  async function deleteDebt(id: string) {
    if (localOnly) {
      applyLocalDeleteDebt(id);
      return;
    }

    try {
      await api.deleteDebt(id);
      await wallet.refresh();
    } catch {
      applyLocalDeleteDebt(id);
    }
  }

  async function reconcile() {
    if (localOnly) {
      applyLocalReconcile();
      return;
    }

    try {
      await api.reconcile({ accounts, debts, editedBalance });
      await wallet.refresh();
    } catch {
      applyLocalReconcile();
    }
  }

  function applyLocalCreateAccount(account: { id: string; name: string; balance: string; createdAt: string }) {
    wallet.setData((current) => recalculateLocalState({ ...current, accounts: [...current.accounts, account] }));
  }

  function applyLocalCreateDebt(debt: { id: string; name: string; amount: string; createdAt: string }) {
    wallet.setData((current) => recalculateLocalState({ ...current, debts: [...current.debts, debt] }));
  }

  function applyLocalDeleteAccount(id: string) {
    wallet.setData((current) => recalculateLocalState({ ...current, accounts: current.accounts.filter((account) => account.id !== id) }));
  }

  function applyLocalDeleteDebt(id: string) {
    wallet.setData((current) => recalculateLocalState({ ...current, debts: current.debts.filter((debt) => debt.id !== id) }));
  }

  function applyLocalReconcile() {
    wallet.setData((current) => {
      const nextAccounts = current.accounts.map((account) => ({
        ...account,
        balance: normalizeMoney(accounts.find((item) => item.id === account.id)?.balance ?? account.balance)
      }));
      const nextDebts = current.debts.map((debt) => ({
        ...debt,
        amount: normalizeMoney(debts.find((item) => item.id === debt.id)?.amount ?? debt.amount)
      }));

      return recalculateLocalState({
        ...current,
        accounts: nextAccounts,
        debts: nextDebts,
        settings: { ...current.settings, editedBalance: normalizeMoney(editedBalance) }
      });
    });
  }

  return (
    <div className="space-y-3">
      <Card>
        <div className="mb-3 grid grid-cols-3 gap-2">
          <BalanceDeltaCard label="Сейчас" value={currentNetBalance} tone="neutral" />
          <BalanceDeltaCard label="Станет" value={draftNetBalance} tone="action" />
          <BalanceDeltaCard label="Разница" value={reconcileDifference} tone={reconcileDifference < 0 ? "danger" : reconcileDifference > 0 ? "positive" : "neutral"} />
        </div>
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-extrabold">Счета</h2>
            <p className="text-sm text-slate-400">Карты, вклады и наличные</p>
          </div>
          <span className="font-bold text-action">{money(wallet.data.balances.accountBalance)}</span>
        </div>

        <div className="mb-3 grid grid-cols-1 gap-2 sm:grid-cols-[1fr_124px]">
          <label className="block text-xs font-bold text-slate-400">
            Название счёта
            <input className="mt-1 w-full min-w-0 rounded-md border border-line bg-ink px-3 py-2 text-white" placeholder="Карта, вклад, наличные" value={newAccountName} onChange={(event) => setNewAccountName(event.target.value)} />
          </label>
          <AmountInput label="Остаток" value={newAccountBalance} onChange={setNewAccountBalance} helper="Нажмите, чтобы ввести сумму" compact />
          <button
            className="flex min-h-11 items-center justify-center gap-2 rounded-md bg-action px-4 py-3 font-extrabold text-white disabled:bg-white/10 disabled:text-slate-500 sm:col-span-2"
            type="button"
            onClick={() => void addAccount()}
            disabled={!newAccountName.trim()}
          >
            <Plus size={18} />
            Добавить счёт
          </button>
        </div>

        <div className="space-y-2">
          {wallet.data.accounts.length === 0 ? <p className="rounded-md border border-line p-3 text-sm text-slate-400">Счетов пока нет. Добавьте карту, вклад или наличные.</p> : null}
          {wallet.data.accounts.map((item) => (
            <div key={item.id} className="grid grid-cols-[1fr_38px] items-center gap-2 rounded-md border border-line p-3 sm:grid-cols-[1fr_132px_38px]">
              <span className="min-w-0 break-words font-bold leading-snug">{item.name}</span>
              <div className="col-span-2 sm:col-span-1">
                <AmountInput
                  label={`Остаток счёта ${item.name}`}
                  value={accounts.find((account) => account.id === item.id)?.balance ?? item.balance}
                  onChange={(value) => setAccounts((prev) => prev.map((account) => (account.id === item.id ? { ...account, balance: value } : account)))}
                  compact
                  showLabel={false}
                />
                <p className={`mt-1 text-right text-[11px] font-bold ${diffToneClass(valueDifference(accounts.find((account) => account.id === item.id)?.balance ?? item.balance, item.balance))}`}>
                  {diffLabel(valueDifference(accounts.find((account) => account.id === item.id)?.balance ?? item.balance, item.balance))}
                </p>
              </div>
              <button className="col-start-2 row-start-1 grid h-11 w-11 place-items-center justify-self-end rounded-md border border-danger/50 text-danger sm:col-auto sm:row-auto" type="button" onClick={() => void deleteAccount(item.id)} aria-label={`Удалить счёт ${item.name}`}>
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-extrabold">Долговые счета</h2>
            <p className="text-sm text-slate-400">Кредитки, кредиты, рассрочки и займы</p>
          </div>
          <span className="font-bold text-danger">{money(wallet.data.balances.debtBalance)}</span>
        </div>

        <div className="mb-3 rounded-2xl border border-danger/20 bg-danger/5 p-3 text-sm text-slate-300">
          Введите сумму как положительное число. Приложение само сохранит её как долг со знаком минус.
        </div>

        <div className="mb-3 grid grid-cols-1 gap-2 sm:grid-cols-[1fr_124px]">
          <label className="block text-xs font-bold text-slate-400">
            Название долгового счёта
            <input className="mt-1 w-full min-w-0 rounded-md border border-line bg-ink px-3 py-2 text-white" placeholder="Кредитка, кредит, рассрочка" value={newDebtName} onChange={(event) => setNewDebtName(event.target.value)} />
          </label>
          <AmountInput label="Сумма долга" value={newDebtAmount} onChange={setNewDebtAmount} helper="Введите без минуса" tone="danger" compact />
          <button
            className="flex min-h-11 items-center justify-center gap-2 rounded-md bg-action px-4 py-3 font-extrabold text-white disabled:bg-white/10 disabled:text-slate-500 sm:col-span-2"
            type="button"
            onClick={() => void addDebt()}
            disabled={!newDebtName.trim() || Number(newDebtAmount) <= 0}
          >
            <Plus size={18} />
            Добавить долговой счёт
          </button>
        </div>

        <div className="space-y-2">
          {wallet.data.debts.length === 0 ? <p className="rounded-md border border-line p-3 text-sm text-slate-400">Долговых счетов пока нет. Добавьте кредитку, кредит или рассрочку.</p> : null}
          {wallet.data.debts.map((item) => (
            <div key={item.id} className="grid grid-cols-[1fr_38px] items-center gap-2 rounded-md border border-line p-3 sm:grid-cols-[1fr_132px_38px]">
              <span className="min-w-0 break-words font-bold leading-snug">{item.name}</span>
              <div className="col-span-2 sm:col-span-1">
                <AmountInput
                  label={`Остаток долгового счёта ${item.name}`}
                  value={positiveMoney(debts.find((debt) => debt.id === item.id)?.amount ?? item.amount)}
                  onChange={(value) => setDebts((prev) => prev.map((debt) => (debt.id === item.id ? { ...debt, amount: normalizeDebt(value) } : debt)))}
                  tone="danger"
                  compact
                  showLabel={false}
                />
                <p className={`mt-1 text-right text-[11px] font-bold ${diffToneClass(valueDifference(debts.find((debt) => debt.id === item.id)?.amount ?? item.amount, item.amount))}`}>
                  {diffLabel(valueDifference(debts.find((debt) => debt.id === item.id)?.amount ?? item.amount, item.amount))}
                </p>
              </div>
              <button className="col-start-2 row-start-1 grid h-11 w-11 place-items-center justify-self-end rounded-md border border-danger/50 text-danger sm:col-auto sm:row-auto" type="button" onClick={() => void deleteDebt(item.id)} aria-label={`Удалить долговой счёт ${item.name}`}>
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <AmountInput label="Итог после корректировки" value={editedBalance} onChange={setEditedBalance} helper="Можно сверить общую чистую позицию" tone="warning" allowNegative />
        <button className="mt-3 flex w-full items-center justify-center gap-2 rounded-md bg-action px-4 py-3 font-extrabold text-white" type="button" onClick={() => void reconcile()}>
          <RefreshCw size={18} />
          Сохранить остатки
        </button>
      </Card>
    </div>
  );
}

function normalizeMoney(value: string) {
  const parsed = Number(String(value).replace(",", "."));
  return Number.isFinite(parsed) ? parsed.toFixed(2) : "0.00";
}

function normalizeDebt(value: string) {
  const money = normalizeMoney(value);
  const amount = Math.abs(Number(money));
  return amount === 0 ? "0.00" : `-${amount.toFixed(2)}`;
}

function positiveMoney(value: string) {
  const parsed = Math.abs(Number(value));
  return Number.isFinite(parsed) ? parsed.toFixed(2) : "0.00";
}

function createId() {
  return globalThis.crypto?.randomUUID?.() ?? `local-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function calculateDraftNetBalance(accounts: { balance: string }[], debts: { amount: string }[]) {
  const accountBalance = accounts.reduce((sum, account) => sum + Number(account.balance || 0), 0);
  const debtBalance = debts.reduce((sum, debt) => sum + Number(debt.amount || 0), 0);
  return accountBalance + debtBalance;
}

function BalanceDeltaCard({ label, value, tone }: { label: string; value: number; tone: "action" | "positive" | "danger" | "neutral" }) {
  return (
    <div className="rounded-[18px] bg-[#202024] p-3">
      <p className="text-[11px] font-bold text-slate-500">{label}</p>
      <p className={`mt-1 text-sm font-extrabold ${tone === "action" ? "text-action" : tone === "positive" ? "text-positive" : tone === "danger" ? "text-danger" : "text-white"}`}>{money(value.toFixed(2))}</p>
    </div>
  );
}

function valueDifference(next: string, current: string) {
  return Number(next || 0) - Number(current || 0);
}

function diffLabel(value: number) {
  if (Math.abs(value) < 0.009) return "без изменений";
  return `${value > 0 ? "+" : ""}${money(value.toFixed(2))}`;
}

function diffToneClass(value: number) {
  if (value > 0.009) return "text-positive";
  if (value < -0.009) return "text-danger";
  return "text-slate-500";
}
