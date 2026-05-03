import { useMemo, useState } from "react";
import { Shell } from "../components/layout/shell";
import { AccountsScreen } from "../screens/accounts-screen";
import { ChartsScreen } from "../screens/charts-screen";
import { HistoryScreen } from "../screens/history-screen";
import { PlanScreen } from "../screens/plan-screen";
import { WalletScreen } from "../screens/wallet-screen";
import { useWalletState } from "../hooks/use-state";

export type Screen = "wallet" | "plan" | "accounts" | "charts" | "history";

export function App() {
  const [screen, setScreen] = useState<Screen>("wallet");
  const wallet = useWalletState();

  const content = useMemo(() => {
    if (screen === "plan") return <PlanScreen wallet={wallet} />;
    if (screen === "accounts") return <AccountsScreen wallet={wallet} />;
    if (screen === "charts") return <ChartsScreen />;
    if (screen === "history") return <HistoryScreen />;
    return <WalletScreen wallet={wallet} onNavigate={setScreen} />;
  }, [screen, wallet]);

  return (
    <Shell active={screen} onNavigate={setScreen}>
      {content}
    </Shell>
  );
}
