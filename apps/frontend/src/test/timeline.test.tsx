import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { WalletScreen } from "../screens/wallet-screen";
import { demoState, emptyState } from "../mock/state";

describe("Finance timeline", () => {
  it("shows executed fixed items and distributed unallocated movement", () => {
    render(
      <WalletScreen
        wallet={{
          data: demoState,
          loading: false,
          error: null,
          refresh: async () => {},
          setData: () => {}
        }}
        onNavigate={() => {}}
      />
    );

    expect(screen.getByText("Таймлайн движения")).toBeInTheDocument();
    expect(screen.getByText("Зарплата")).toBeInTheDocument();
    expect(screen.getByText("Интернет")).toBeInTheDocument();
    expect(screen.getByText("Распределяется между сверками")).toBeInTheDocument();
  });

  it("shows ledger operations such as debt repayments", () => {
    render(
      <WalletScreen
        wallet={{
          data: {
            ...emptyState,
            balances: { ...emptyState.balances, additionalExpenses: "0.00" },
            operations: [
              {
                id: "operation-credit",
                kind: "debt_repayment",
                name: "Погашение кредитки",
                amount: "10000.00",
                operationDate: "2026-05-22T00:00:00.000Z",
                note: null,
                plannedOperationId: "planned-credit",
                seriesId: null,
                createdAt: "2026-05-22T00:00:00.000Z",
                entries: [
                  { id: "entry-account", targetType: "account", targetId: "main-card", amount: "-10000.00" },
                  { id: "entry-debt", targetType: "debt", targetId: "credit-card", amount: "10000.00" }
                ]
              }
            ]
          },
          loading: false,
          error: null,
          refresh: async () => {},
          setData: () => {}
        }}
        onNavigate={() => {}}
      />
    );

    expect(screen.getByText("Погашение кредитки")).toBeInTheDocument();
    expect(screen.getByText("Погашение долга")).toBeInTheDocument();
  });

  it("explains unallocated movement as daily distribution instead of one jump", () => {
    render(
      <WalletScreen
        wallet={{
          data: {
            ...emptyState,
            balances: { ...emptyState.balances, additionalExpenses: "-700.00" },
            latestSnapshot: {
              id: "snapshot-now",
              accountBalance: "9300.00",
              debtBalance: "0.00",
              netBalance: "9300.00",
              createdAt: "2026-05-07T10:00:00.000Z"
            }
          },
          loading: false,
          error: null,
          refresh: async () => {},
          setData: () => {}
        }}
        onNavigate={() => {}}
      />
    );

    expect(screen.getByText("7 дней по -100 ₽")).toBeInTheDocument();
    expect(screen.getByText("Нераспределённые расходы")).toBeInTheDocument();
  });
});
