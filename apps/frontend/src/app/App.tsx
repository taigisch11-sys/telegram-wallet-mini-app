import type { DashboardStateDto } from "@wallet/shared";
import { useEffect, useMemo, useState } from "react";
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
  const [localMode, setLocalMode] = useState(false);
  const [learningEnabled, setLearningEnabled] = useState(false);
  const [learningStep, setLearningStep] = useState(0);
  const [loadingHelpVisible, setLoadingHelpVisible] = useState(false);
  const realWallet = useWalletState();

  const demoWallet: ReturnType<typeof useWalletState> = {
    data: demoData,
    loading: false,
    error: null,
    remoteAvailable: false,
    refresh: async () => {},
    setData: (next) => {
      setDemoData((current) => (typeof next === "function" ? next(current) : next));
    }
  };
  const wallet = demoEnabled ? demoWallet : realWallet;

  function startDemo() {
    setDemoData(demoState);
    setDemoEnabled(true);
    setLocalMode(false);
    setScreen("wallet");
  }

  useEffect(() => {
    if (!realWallet.loading || demoEnabled || localMode) {
      setLoadingHelpVisible(false);
      return;
    }

    const timeout = window.setTimeout(() => setLoadingHelpVisible(true), 4000);
    return () => window.clearTimeout(timeout);
  }, [demoEnabled, localMode, realWallet.loading]);

  const content = useMemo(() => {
    if (screen === "menu") {
      return (
        <MenuScreen
          demoEnabled={demoEnabled}
          learningEnabled={learningEnabled}
          onStartDemo={startDemo}
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
    if (screen === "plan") return <PlanScreen wallet={wallet} demoMode={demoEnabled} />;
    if (screen === "accounts") return <AccountsScreen wallet={wallet} demoMode={demoEnabled} />;
    if (screen === "charts") return <ChartsScreen demoData={demoEnabled ? demoTimeseriesByPeriod : undefined} />;
    if (screen === "history") return <HistoryScreen items={demoEnabled ? demoHistory : undefined} />;
    return (
      <WalletScreen
        wallet={wallet}
        onNavigate={setScreen}
        onStartDemo={startDemo}
        onStartLearning={() => {
          setLearningStep(0);
          setLearningEnabled(true);
          setScreen("wallet");
        }}
        demoMode={demoEnabled}
      />
    );
  }, [demoEnabled, learningEnabled, screen, wallet]);

  return (
    <Shell active={screen} onNavigate={setScreen}>
      {demoEnabled ? (
        <div className="mb-4 flex flex-wrap items-center gap-2 rounded-[24px] border border-action/35 bg-actionSoft px-4 py-3 text-sm font-extrabold text-[#c9ddff]">
          <span className="rounded-full bg-action px-2 py-1 text-xs text-white">Демо-режим</span>
          <span>Показаны примерные данные, реальные записи не меняются.</span>
        </div>
      ) : null}
      {localMode ? (
        <div className="mb-4 rounded-[24px] border border-amber/35 bg-amber/10 px-4 py-3 text-sm font-extrabold text-amber">
          Локальный режим: данные сохраняются на этом устройстве, пока сервер или Telegram недоступны.
        </div>
      ) : null}
      {learningEnabled ? <LearningCoach step={learningStep} onStep={setLearningStep} onNavigate={setScreen} onClose={() => setLearningEnabled(false)} /> : null}
      {realWallet.loading && !demoEnabled && !localMode ? (
        <div className="rounded-[28px] border border-white/10 bg-[#2b2b2f] p-5 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
          <p className="text-lg font-extrabold text-white">Загружаем финансы</p>
          <p className="mt-2 text-sm font-semibold text-slate-400">Подключаем Telegram и проверяем сохранённые данные.</p>
          {loadingHelpVisible ? (
            <div className="mt-4 space-y-2">
              <p className="text-sm font-bold text-amber">Загрузка идёт дольше обычного. Можно не ждать сервер.</p>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                <button className="rounded-2xl bg-action px-4 py-3 text-sm font-extrabold text-white" type="button" onClick={() => setLocalMode(true)}>
                  Продолжить локально
                </button>
                <button className="rounded-2xl bg-white/10 px-4 py-3 text-sm font-extrabold text-white" type="button" onClick={startDemo}>
                  Открыть демо
                </button>
                <button
                  className="rounded-2xl border border-white/10 px-4 py-3 text-sm font-extrabold text-slate-200"
                  type="button"
                  onClick={() => {
                    setLoadingHelpVisible(false);
                    void realWallet.refresh();
                  }}
                >
                  Повторить
                </button>
              </div>
            </div>
          ) : null}
        </div>
      ) : (
        content
      )}
    </Shell>
  );
}
