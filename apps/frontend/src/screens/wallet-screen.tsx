import type { AccountDto, DashboardStateDto, DebtDto } from "@wallet/shared";
import { Banknote, Check, ChevronRight, CreditCard, Landmark, Pencil, TrendingUp, X } from "lucide-react";
import { useState } from "react";
import type { Screen } from "../app/App";
import { AlertsPanel } from "../components/wallet/alerts-panel";
import { BalanceHero } from "../components/wallet/balance-hero";
import { FinanceTimeline } from "../components/wallet/finance-timeline";
import { FinancialIndicators } from "../components/wallet/financial-indicators";
import { UpcomingList } from "../components/wallet/upcoming-list";
import { useWalletState } from "../hooks/use-state";
import { api } from "../lib/api";
import { money } from "../lib/format";
import { recalculateLocalState } from "../lib/local-finance";

export function WalletScreen({ wallet, onNavigate }: { wallet: ReturnType<typeof useWalletState>; onNavigate: (screen: Screen) => void }) {
  const state = wallet.data;
  const topAccounts = state.accounts.slice(0, 3);
  const topDebts = state.debts.slice(0, 2);
  const [editingAccount, setEditingAccount] = useState<{ id: string; balance: string } | null>(null);
  const [savingAccountId, setSavingAccountId] = useState<string | null>(null);

  async function saveQuickAccountBalance(id: string) {
    if (!editingAccount || editingAccount.id !== id) return;

    const balance = normalizeMoney(editingAccount.balance);
    const nextAccounts = state.accounts.map((account) => (account.id === id ? { ...account, balance } : account));
    const editedBalance = calculateNetBalance(nextAccounts, state.debts);
    setSavingAccountId(id);

    try {
      await api.reconcile({
        accounts: nextAccounts.map((account) => ({ id: account.id, balance: account.balance })),
        debts: state.debts.map((debt) => ({ id: debt.id, amount: debt.amount })),
        editedBalance
      });
      await wallet.refresh();
    } catch {
      wallet.setData((current) => applyQuickAccountCorrection(current, id, balance));
    } finally {
      setSavingAccountId(null);
      setEditingAccount(null);
    }
  }

  return (
    <div className="space-y-5">
      {wallet.error ? <div className="rounded-[22px] border border-amber/35 bg-amber/10 p-3 text-sm font-semibold text-amber">{wallet.error}. Показаны локальные данные.</div> : null}

      <BalanceHero
        currentBalance={money(state.balances.currentBalance)}
        calculatedBalance={money(state.balances.calculatedBalance)}
        additionalExpenses={money(state.balances.additionalExpenses)}
        freeMoney={money(state.balances.freeMoney)}
        onNavigate={onNavigate}
      />

      <section className="space-y-3 pb-24">
        <WalletAssetRow
          title="Счета"
          subtitle={state.accounts.length ? `${state.accounts.length} активных` : "Добавьте карту, вклад или наличные"}
          amount={money(state.balances.accountBalance)}
          icon="card"
          tone="account"
          onClick={() => onNavigate("accounts")}
        />
        {topAccounts.map((account) => (
          <AccountRow
            key={account.id}
            account={account}
            editBalance={editingAccount?.id === account.id ? editingAccount.balance : account.balance}
            isEditing={editingAccount?.id === account.id}
            isSaving={savingAccountId === account.id}
            onCancel={() => setEditingAccount(null)}
            onChangeEditBalance={(balance) => setEditingAccount({ id: account.id, balance })}
            onClick={() => onNavigate("accounts")}
            onSave={() => void saveQuickAccountBalance(account.id)}
            onStartEdit={() => setEditingAccount({ id: account.id, balance: account.balance })}
          />
        ))}
        <WalletAssetRow
          title="Долги"
          subtitle={state.debts.length ? "Долговая нагрузка" : "Долгов пока нет"}
          amount={money(state.balances.debtBalance)}
          icon="debt"
          tone="debt"
          onClick={() => onNavigate("accounts")}
        />
        {topDebts.map((debt) => (
          <DebtRow key={debt.id} debt={debt} onClick={() => onNavigate("accounts")} />
        ))}
      </section>

      <AlertsPanel alerts={state.alerts} />
      <FinancialIndicators state={state} />
      <FinanceTimeline state={state} />
      <UpcomingList items={state.upcoming} onNavigatePlan={() => onNavigate("plan")} />
    </div>
  );
}

function WalletAssetRow({
  title,
  subtitle,
  amount,
  icon,
  tone,
  onClick
}: {
  title: string;
  subtitle: string;
  amount: string;
  icon: "card" | "debt";
  tone: "account" | "debt";
  onClick: () => void;
}) {
  const Icon = icon === "card" ? CreditCard : Banknote;
  const toneClass = tone === "account" ? "wallet-token--action" : "wallet-token--danger";
  return (
    <button className="wallet-row w-full text-left" type="button" onClick={onClick}>
      <div className={`wallet-token ${toneClass}`}>
        <Icon size={28} strokeWidth={2.7} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="break-words text-[20px] font-extrabold leading-tight tracking-[-0.02em] text-white">{title}</p>
        <p className="break-words text-[15px] font-semibold leading-snug text-[#a1a1a7]">{subtitle}</p>
      </div>
      <div className="flex-none text-right">
        <p className="text-[18px] font-bold text-white">{amount}</p>
      </div>
    </button>
  );
}

function AccountRow({
  account,
  editBalance,
  isEditing,
  isSaving,
  onCancel,
  onChangeEditBalance,
  onClick,
  onSave,
  onStartEdit
}: {
  account: AccountDto;
  editBalance: string;
  isEditing: boolean;
  isSaving: boolean;
  onCancel: () => void;
  onChangeEditBalance: (value: string) => void;
  onClick: () => void;
  onSave: () => void;
  onStartEdit: () => void;
}) {
  if (isEditing) {
    return (
      <div className="rounded-[28px] bg-[#232326] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
        <div className="flex items-center gap-3">
          <div className="wallet-token h-12 w-12 bg-[#3a4352]">
            <Landmark size={23} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="break-words text-[18px] font-extrabold leading-snug text-white">{account.name}</p>
            <p className="text-[13px] font-semibold text-[#8f8f95]">Быстрая корректировка счёта</p>
          </div>
        </div>
        <div className="mt-3 grid grid-cols-[1fr_42px_42px] gap-2">
          <input
            aria-label={`Новый остаток ${account.name}`}
            className="min-w-0 rounded-[16px] border border-white/10 bg-[#1b1b1f] px-3 py-2 text-right text-[17px] font-extrabold text-white outline-none focus:border-action"
            inputMode="decimal"
            value={editBalance}
            onChange={(event) => onChangeEditBalance(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") onSave();
              if (event.key === "Escape") onCancel();
            }}
          />
          <button
            aria-label={`Сохранить счёт ${account.name}`}
            className="grid h-11 w-11 place-items-center rounded-[16px] bg-action text-white disabled:opacity-60"
            disabled={isSaving}
            type="button"
            onClick={onSave}
          >
            <Check size={19} strokeWidth={3} />
          </button>
          <button aria-label={`Отменить изменение ${account.name}`} className="grid h-11 w-11 place-items-center rounded-[16px] bg-[#34343a] text-white" type="button" onClick={onCancel}>
            <X size={19} strokeWidth={3} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="wallet-row w-full bg-[#232326] text-left">
      <button className="flex min-w-0 flex-1 items-center gap-3 text-left" type="button" onClick={onClick}>
        <div className="wallet-token bg-[#3a4352]">
          <Landmark size={25} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="break-words text-[18px] font-extrabold leading-snug text-white">{account.name}</p>
          <p className="text-[14px] font-semibold text-[#8f8f95]">Счёт</p>
        </div>
        <p className="text-[18px] font-bold text-white">{money(account.balance)}</p>
      </button>
      <button
        aria-label={`Изменить счёт ${account.name}`}
        className="grid h-10 w-10 flex-none place-items-center rounded-full bg-[#34343a] text-action"
        type="button"
        onClick={onStartEdit}
      >
        <Pencil size={17} />
      </button>
    </div>
  );
}

function DebtRow({ debt, onClick }: { debt: DebtDto; onClick: () => void }) {
  return (
    <button className="wallet-row w-full bg-[#232326] text-left" type="button" onClick={onClick}>
      <div className="wallet-token wallet-token--danger">
        <TrendingUp size={25} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="break-words text-[18px] font-extrabold leading-snug text-white">{debt.name}</p>
        <p className="text-[14px] font-semibold text-[#8f8f95]">Обязательство</p>
      </div>
      <div className="flex items-center gap-2 text-right">
        <p className="text-[18px] font-bold text-danger">{money(debt.amount)}</p>
        <ChevronRight className="text-[#6f6f75]" size={21} />
      </div>
    </button>
  );
}

function applyQuickAccountCorrection(state: DashboardStateDto, accountId: string, balance: string) {
  const accounts = state.accounts.map((account) => (account.id === accountId ? { ...account, balance } : account));
  return recalculateLocalState({
    ...state,
    accounts,
    settings: { ...state.settings, editedBalance: calculateNetBalance(accounts, state.debts) }
  });
}

function calculateNetBalance(accounts: AccountDto[], debts: DebtDto[]) {
  const accountBalance = accounts.reduce((sum, account) => sum + Number(account.balance), 0);
  const debtBalance = debts.reduce((sum, debt) => sum + Number(debt.amount), 0);
  return (accountBalance + debtBalance).toFixed(2);
}

function normalizeMoney(value: string) {
  const parsed = Number(String(value).replace(",", "."));
  return Number.isFinite(parsed) ? parsed.toFixed(2) : "0.00";
}
