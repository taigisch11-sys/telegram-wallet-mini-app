import type { DashboardStateDto, HistoryItemDto, PlannedOperationDto, TimeseriesPointDto } from "@wallet/shared";
import { getTelegramInitData } from "./telegram";

const API_URL = import.meta.env.VITE_API_URL ?? "";
const TOKEN_KEY = "wallet_jwt";

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem(TOKEN_KEY);
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers
    }
  });

  if (!response.ok) {
    const error = await response.json().catch(() => null);
    throw new Error(error?.error?.message ?? "Не удалось выполнить запрос");
  }

  return response.json();
}

export async function authenticate() {
  const initData = getTelegramInitData();
  if (!initData) {
    localStorage.setItem(TOKEN_KEY, "test-token");
    return false;
  }

  const response = await request<{ token: string }>("/api/auth/telegram", {
    method: "POST",
    body: JSON.stringify({ initData })
  });
  localStorage.setItem(TOKEN_KEY, response.token);
  return true;
}

export const api = {
  state: () => request<DashboardStateDto>("/api/state"),
  history: () => request<HistoryItemDto[]>("/api/history"),
  timeseries: (period: string) => request<TimeseriesPointDto[]>(`/api/analytics/timeseries?period=${period}`),
  createAccount: (body: { name: string; balance: string }) => request("/api/accounts", { method: "POST", body: JSON.stringify(body) }),
  deleteAccount: (id: string) => request(`/api/accounts/${id}`, { method: "DELETE" }),
  createDebt: (body: { name: string; amount: string }) => request("/api/debts", { method: "POST", body: JSON.stringify(body) }),
  deleteDebt: (id: string) => request(`/api/debts/${id}`, { method: "DELETE" }),
  createIncome: (body: { name: string; amount: string; plannedDate: string }) => request("/api/income", { method: "POST", body: JSON.stringify(body) }),
  deleteIncome: (id: string) => request(`/api/income/${id}`, { method: "DELETE" }),
  markIncome: (id: string) => request(`/api/income/${id}/mark-received`, { method: "PATCH", body: JSON.stringify({}) }),
  createPayment: (body: { name: string; amount: string; plannedDate: string }) => request("/api/payments", { method: "POST", body: JSON.stringify(body) }),
  deletePayment: (id: string) => request(`/api/payments/${id}`, { method: "DELETE" }),
  markPayment: (id: string) => request(`/api/payments/${id}/mark-paid`, { method: "PATCH", body: JSON.stringify({}) }),
  createPlannedOperation: (body: Partial<PlannedOperationDto>) => request("/api/planned-operations", { method: "POST", body: JSON.stringify(body) }),
  markPlannedOperation: (id: string) => request(`/api/planned-operations/${id}/mark-done`, { method: "PATCH", body: JSON.stringify({}) }),
  deletePlannedOperation: (id: string) => request(`/api/planned-operations/${id}`, { method: "DELETE" }),
  reconcile: (body: unknown) => request("/api/accounts/reconcile", { method: "POST", body: JSON.stringify(body) })
};
