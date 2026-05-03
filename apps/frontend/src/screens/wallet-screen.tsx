import type { AccountDto, DebtDto } from "@wallet/shared";
import { Banknote, ChevronRight, CreditCard, Landmark, TrendingUp } from "lucide-react";
import type { Screen } from "../app/App";
import { AlertsPanel } from "../components/wallet/alerts-panel";
import { BalanceHero } from "../components/wallet/balance-hero";
import { FinanceTimeline } from "../components/wallet/finance-timeline";
import { FinancialIndicators } from "../components/wallet/financial-indicators";
import { UpcomingList } from "../components/wallet/upcoming-list";
import { useWalletState } from "../hooks/use-state";
import { money } from "../lib/format";

export function WalletScreen({ wallet, onNavigate }: { wallet: ReturnType<typeof useWalletState>; onNavigate: (screen: Screen) => void }) {
  const state = wallet.data;
  const topAccounts = state.accounts.slice(0, 3);
  const topDebts = state.debts.slice(0, 2);

  return (
    <div className="space-y-5">
      {wallet.error ? <div className="rounded-[22px] border border-[#f2c45d]/35 bg-[#f2c45d]/10 p-3 text-sm font-semibold text-[#f2c45d]">{wallet.error}. Показаны локальные данные.</div> : null}

      <BalanceHero
        currentBalance={money(state.balances.currentBalance)}
        calculatedBalance={money(state.balances.calculatedBalance)}
        additionalExpenses={money(state.balances.additionalExpenses)}
        freeMoney={money(state.balances.freeMoney)}
        onNavigate={onNavigate}
      />

      <section className="space-y-3">
        <WalletAssetRow
          title="Счета"
          subtitle={state.accounts.length ? `${state.accounts.length} активных` : "Добавьте карту, вклад или наличные"}
          amount={money(state.balances.accountBalance)}
          icon="card"
          tone="blue"
          onClick={() => onNavigate("accounts")}
        />
        {topAccounts.map((account) => (
          <AccountRow key={account.id} account={account} onClick={() => onNavigate("accounts")} />
        ))}
        <WalletAssetRow
          title="Долги"
          subtitle={state.debts.length ? "Долговая нагрузка" : "Долгов пока нет"}
          amount={money(state.balances.debtBalance)}
          icon="debt"
          tone="green"
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
  tone: "blue" | "green";
  onClick: () => void;
}) {
  const Icon = icon === "card" ? CreditCard : Banknote;
  const toneClass = tone === "blue" ? "bg-[#2d7dff]" : "bg-[#22c77a]";
  return (
    <button className="wallet-row w-full text-left" type="button" onClick={onClick}>
      <div className={`wallet-token ${toneClass}`}>
        <Icon size={28} strokeWidth={2.7} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[20px] font-extrabold tracking-[-0.02em] text-white">{title}</p>
        <p className="truncate text-[15px] font-semibold text-[#a1a1a7]">{subtitle}</p>
      </div>
      <div className="text-right">
        <p className="text-[18px] font-bold text-white">{amount}</p>
      </div>
    </button>
  );
}

function AccountRow({ account, onClick }: { account: AccountDto; onClick: () => void }) {
  return (
    <button className="wallet-row w-full bg-[#232326] text-left" type="button" onClick={onClick}>
      <div className="wallet-token bg-[#3a4352]">
        <Landmark size={25} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[18px] font-extrabold text-white">{account.name}</p>
        <p className="text-[14px] font-semibold text-[#8f8f95]">Счёт</p>
      </div>
      <p className="text-[18px] font-bold text-white">{money(account.balance)}</p>
    </button>
  );
}

function DebtRow({ debt, onClick }: { debt: DebtDto; onClick: () => void }) {
  return (
    <button className="wallet-row w-full bg-[#232326] text-left" type="button" onClick={onClick}>
      <div className="wallet-token bg-[#3d2630] text-[#ff6b73]">
        <TrendingUp size={25} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[18px] font-extrabold text-white">{debt.name}</p>
        <p className="text-[14px] font-semibold text-[#8f8f95]">Обязательство</p>
      </div>
      <div className="flex items-center gap-2 text-right">
        <p className="text-[18px] font-bold text-[#ff6b73]">{money(debt.amount)}</p>
        <ChevronRight className="text-[#6f6f75]" size={21} />
      </div>
    </button>
  );
}
