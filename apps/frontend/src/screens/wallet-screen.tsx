import { AlertsPanel } from "../components/wallet/alerts-panel";
import { BalanceHero } from "../components/wallet/balance-hero";
import { UpcomingList } from "../components/wallet/upcoming-list";
import { useWalletState } from "../hooks/use-state";
import { money } from "../lib/format";

export function WalletScreen({ wallet }: { wallet: ReturnType<typeof useWalletState> }) {
  const state = wallet.data;
  return (
    <div className="space-y-3">
      {wallet.error ? <div className="rounded-md border border-amber/40 bg-amber/10 p-3 text-sm text-amber">{wallet.error}. Показаны локальные данные.</div> : null}
      <BalanceHero
        currentBalance={money(state.balances.currentBalance)}
        calculatedBalance={money(state.balances.calculatedBalance)}
        additionalExpenses={money(state.balances.additionalExpenses)}
        freeMoney={money(state.balances.freeMoney)}
      />
      <AlertsPanel alerts={state.alerts} />
      <UpcomingList items={state.upcoming} />
    </div>
  );
}
