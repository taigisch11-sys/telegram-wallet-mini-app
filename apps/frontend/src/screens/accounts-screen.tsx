import { Plus, RefreshCw, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Card } from "../components/common/card";
import { useWalletState } from "../hooks/use-state";
import { api } from "../lib/api";
import { money } from "../lib/format";

export function AccountsScreen({ wallet }: { wallet: ReturnType<typeof useWalletState> }) {
  const [accounts, setAccounts] = useState(() => wallet.data.accounts.map((item) => ({ id: item.id, balance: item.balance })));
  const [debts, setDebts] = useState(() => wallet.data.debts.map((item) => ({ id: item.id, amount: item.amount })));
  const [editedBalance, setEditedBalance] = useState(wallet.data.settings.editedBalance ?? wallet.data.balances.currentBalance);
  const [newAccountName, setNewAccountName] = useState("");
  const [newAccountBalance, setNewAccountBalance] = useState("0.00");
  const [newDebtName, setNewDebtName] = useState("");
  const [newDebtAmount, setNewDebtAmount] = useState("-0.00");

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

    try {
      await api.createAccount({ name, balance: account.balance });
      await wallet.refresh();
    } catch {
      wallet.setData((current) => recalculate({ ...current, accounts: [...current.accounts, account] }));
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

    try {
      await api.createDebt({ name, amount: debt.amount });
      await wallet.refresh();
    } catch {
      wallet.setData((current) => recalculate({ ...current, debts: [...current.debts, debt] }));
    }

    setNewDebtName("");
    setNewDebtAmount("-0.00");
  }

  async function deleteAccount(id: string) {
    try {
      await api.deleteAccount(id);
      await wallet.refresh();
    } catch {
      wallet.setData((current) => recalculate({ ...current, accounts: current.accounts.filter((account) => account.id !== id) }));
    }
  }

  async function deleteDebt(id: string) {
    try {
      await api.deleteDebt(id);
      await wallet.refresh();
    } catch {
      wallet.setData((current) => recalculate({ ...current, debts: current.debts.filter((debt) => debt.id !== id) }));
    }
  }

  async function reconcile() {
    try {
      await api.reconcile({ accounts, debts, editedBalance });
      await wallet.refresh();
    } catch {
      wallet.setData((current) => {
        const nextAccounts = current.accounts.map((account) => ({
          ...account,
          balance: normalizeMoney(accounts.find((item) => item.id === account.id)?.balance ?? account.balance)
        }));
        const nextDebts = current.debts.map((debt) => ({
          ...debt,
          amount: normalizeMoney(debts.find((item) => item.id === debt.id)?.amount ?? debt.amount)
        }));

        return recalculate({
          ...current,
          accounts: nextAccounts,
          debts: nextDebts,
          settings: { ...current.settings, editedBalance: normalizeMoney(editedBalance) }
        });
      });
    }
  }

  return (
    <div className="space-y-3">
      <Card>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-extrabold">Счета</h2>
          <span className="font-bold text-mint">{money(wallet.data.balances.accountBalance)}</span>
        </div>

        <div className="mb-3 grid grid-cols-[1fr_104px_42px] gap-2">
          <input
            className="min-w-0 rounded-md border border-line bg-ink px-3 py-2"
            placeholder="Название"
            value={newAccountName}
            onChange={(event) => setNewAccountName(event.target.value)}
          />
          <input
            className="min-w-0 rounded-md border border-line bg-ink px-3 py-2 text-right"
            inputMode="decimal"
            value={newAccountBalance}
            onChange={(event) => setNewAccountBalance(event.target.value)}
          />
          <button className="grid place-items-center rounded-md bg-mint text-ink" onClick={() => void addAccount()} aria-label="Добавить счет">
            <Plus size={18} />
          </button>
        </div>

        <div className="space-y-2">
          {wallet.data.accounts.length === 0 ? <p className="rounded-md border border-line p-3 text-sm text-slate-400">Счетов пока нет. Добавьте карту, вклад или наличные.</p> : null}
          {wallet.data.accounts.map((item) => (
            <div key={item.id} className="grid grid-cols-[1fr_120px_38px] items-center gap-2 rounded-md border border-line p-3">
              <span className="min-w-0 truncate font-bold">{item.name}</span>
              <input
                className="w-full rounded-md border border-line bg-ink px-3 py-2 text-right"
                inputMode="decimal"
                value={accounts.find((account) => account.id === item.id)?.balance ?? item.balance}
                onChange={(event) => setAccounts((prev) => prev.map((account) => (account.id === item.id ? { ...account, balance: event.target.value } : account)))}
              />
              <button className="grid h-9 w-9 place-items-center rounded-md border border-danger/50 text-danger" onClick={() => void deleteAccount(item.id)} aria-label="Удалить счет">
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-extrabold">Долги</h2>
          <span className="font-bold text-danger">{money(wallet.data.balances.debtBalance)}</span>
        </div>

        <div className="mb-3 grid grid-cols-[1fr_104px_42px] gap-2">
          <input
            className="min-w-0 rounded-md border border-line bg-ink px-3 py-2"
            placeholder="Название"
            value={newDebtName}
            onChange={(event) => setNewDebtName(event.target.value)}
          />
          <input
            className="min-w-0 rounded-md border border-line bg-ink px-3 py-2 text-right"
            inputMode="decimal"
            value={newDebtAmount}
            onChange={(event) => setNewDebtAmount(event.target.value)}
          />
          <button className="grid place-items-center rounded-md bg-danger text-white" onClick={() => void addDebt()} aria-label="Добавить долг">
            <Plus size={18} />
          </button>
        </div>

        <div className="space-y-2">
          {wallet.data.debts.length === 0 ? <p className="rounded-md border border-line p-3 text-sm text-slate-400">Долгов пока нет.</p> : null}
          {wallet.data.debts.map((item) => (
            <div key={item.id} className="grid grid-cols-[1fr_120px_38px] items-center gap-2 rounded-md border border-line p-3">
              <span className="font-bold">{item.name}</span>
              <input
                className="w-full rounded-md border border-line bg-ink px-3 py-2 text-right"
                inputMode="decimal"
                value={debts.find((debt) => debt.id === item.id)?.amount ?? item.amount}
                onChange={(event) => setDebts((prev) => prev.map((debt) => (debt.id === item.id ? { ...debt, amount: event.target.value } : debt)))}
              />
              <button className="grid h-9 w-9 place-items-center rounded-md border border-danger/50 text-danger" onClick={() => void deleteDebt(item.id)} aria-label="Удалить долг">
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <label className="block text-sm font-bold text-slate-300">Итог после корректировки</label>
        <input className="mt-2 w-full rounded-md border border-line bg-ink px-3 py-3 text-lg font-bold" inputMode="decimal" value={editedBalance} onChange={(event) => setEditedBalance(event.target.value)} />
        <button className="mt-3 flex w-full items-center justify-center gap-2 rounded-md bg-mint px-4 py-3 font-extrabold text-ink" onClick={() => void reconcile()}>
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

function createId() {
  return globalThis.crypto?.randomUUID?.() ?? `local-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function recalculate<T extends ReturnType<typeof useWalletState>["data"]>(state: T): T {
  const accountBalance = state.accounts.reduce((sum, account) => sum + Number(account.balance), 0);
  const debtBalance = state.debts.reduce((sum, debt) => sum + Number(debt.amount), 0);
  const currentBalance = state.settings.editedBalance === null ? accountBalance + debtBalance : Number(state.settings.editedBalance);

  return {
    ...state,
    balances: {
      ...state.balances,
      accountBalance: accountBalance.toFixed(2),
      debtBalance: debtBalance.toFixed(2),
      netBalance: (accountBalance + debtBalance).toFixed(2),
      currentBalance: currentBalance.toFixed(2),
      calculatedBalance: (accountBalance + debtBalance).toFixed(2),
      freeMoney: currentBalance.toFixed(2)
    }
  };
}
