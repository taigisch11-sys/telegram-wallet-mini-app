import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { WalletScreen } from "../screens/wallet-screen";
import { demoState } from "../mock/state";

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
});
