import type { DashboardStateDto } from "@wallet/shared";
import { useMemo, useState } from "react";
import { LearningCoach } from "../components/learning/learning-coach";
import { Shell } from "../components/layout/shell";
import { AccountsScreen } from "../screens/accounts-screen";
import { ChartsScreen } from "../screens/charts-screen";
import { HistoryScreen } from "../screens/history-screen";
import { MenuScreen } from "../screens/menu-screen";
import { PlanScreen } from "../screens/plan-screen";
import { WalletScreen } from "../screens/wallet-screen";
import { useWalletState } from "../hooks/use-state";
import { demoHistory, demoState, demoTimeseriesByPeriod } from "../mock/state";

export type Screen = "wallet" | "plan" | "accounts" | "charts" | "history" | "menu";

export function App() {
  const [screen, setScreen] = useState<Screen>("wallet");
  const [demoEnabled, setDemoEnabled] = useState(false);
  const [demoData, setDemoData] = useState<DashboardStateDto>(demoState);
  const [learningEnabled, setLearningEnabled] = useState(false);
  const [learningStep, setLearningStep] = useState(0);
  const realWallet = useWalletState();

  const demoWallet: ReturnType<typeof useWalletState> = {
    data: demoData,
    loading: false,
    error: null,
    refresh: async () => {},
    setData: (next) => {
      setDemoData((current) => (typeof next === "function" ? next(current) : next));
    }
  };
  const wallet = demoEnabled ? demoWallet : realWallet;

  const content = useMemo(() => {
    if (screen === "menu") {
      return (
        <MenuScreen
          demoEnabled={demoEnabled}
          learningEnabled={learningEnabled}
          onStartDemo={() => {
            setDemoData(demoState);
            setDemoEnabled(true);
            setScreen("wallet");
          }}
          onStopDemo={() => {
            setDemoEnabled(false);
            setScreen("wallet");
          }}
          onStartLearning={() => {
            setLearningStep(0);
            setLearningEnabled(true);
            setScreen("wallet");
          }}
          onStopLearning={() => setLearningEnabled(false)}
          onNavigate={setScreen}
        />
      );
    }
    if (screen === "plan") return <PlanScreen wallet={wallet} />;
    if (screen === "accounts") return <AccountsScreen wallet={wallet} />;
    if (screen === "charts") return <ChartsScreen demoData={demoEnabled ? demoTimeseriesByPeriod : undefined} />;
    if (screen === "history") return <HistoryScreen items={demoEnabled ? demoHistory : undefined} />;
    return <WalletScreen wallet={wallet} onNavigate={setScreen} />;
  }, [demoEnabled, learningEnabled, screen, wallet]);

  return (
    <Shell active={screen} onNavigate={setScreen}>
      {demoEnabled ? (
        <div className="mb-4 flex flex-wrap items-center gap-2 rounded-[24px] border border-[#32d178]/40 bg-[#123926] px-4 py-3 text-sm font-extrabold text-[#b8ffd8]">
          <span className="rounded-full bg-[#32d178] px-2 py-1 text-xs text-[#07160f]">Демо-режим</span>
          <span>Показаны примерные данные, реальные записи не меняются.</span>
        </div>
      ) : null}
      {learningEnabled ? <LearningCoach step={learningStep} onStep={setLearningStep} onNavigate={setScreen} onClose={() => setLearningEnabled(false)} /> : null}
      {content}
    </Shell>
  );
}
