import type { DashboardStateDto } from "@wallet/shared";
import { useEffect, useState } from "react";
import { api, authenticate } from "../lib/api";
import { initTelegram } from "../lib/telegram";
import { emptyState } from "../mock/state";

const LOCAL_STATE_KEY = "wallet_local_state";

export function normalizeDashboardState(state: DashboardStateDto): DashboardStateDto {
  const legacy = state as DashboardStateDto & Partial<Pick<DashboardStateDto, "categories" | "operations" | "plannedOperations">>;
  return {
    ...state,
    categories: legacy.categories ?? emptyState.categories,
    operations: legacy.operations ?? [],
    plannedOperations: legacy.plannedOperations ?? []
  };
}

function readLocalState() {
  try {
    const saved = localStorage.getItem(LOCAL_STATE_KEY);
    if (!saved) return emptyState;
    const parsed = normalizeDashboardState(JSON.parse(saved) as DashboardStateDto);
    if (parsed.user.id === "demo" || parsed.user.username === "demo_wallet") {
      localStorage.removeItem(LOCAL_STATE_KEY);
      return emptyState;
    }
    return parsed;
  } catch {
    return emptyState;
  }
}

export function useWalletState() {
  const [data, setRawData] = useState<DashboardStateDto>(() => readLocalState());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [remoteAvailable, setRemoteAvailable] = useState(false);

  function setData(next: DashboardStateDto | ((current: DashboardStateDto) => DashboardStateDto)) {
    setRawData((current) => {
      const resolved = typeof next === "function" ? next(current) : next;
      localStorage.setItem(LOCAL_STATE_KEY, JSON.stringify(resolved));
      return resolved;
    });
  }

  async function refresh() {
    try {
      setError(null);
      const hasTelegramSession = await authenticate();
      setRemoteAvailable(hasTelegramSession);
      if (!hasTelegramSession) return;
      const next = await api.state();
      setData(normalizeDashboardState(next));
    } catch (err) {
      setRemoteAvailable(false);
      setError(err instanceof Error ? err.message : "Не удалось обновить данные");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    initTelegram();
    if (import.meta.env.MODE === "test") {
      setLoading(false);
      return;
    }
    void refresh();
  }, []);

  return { data, loading, error, remoteAvailable, refresh, setData };
}
