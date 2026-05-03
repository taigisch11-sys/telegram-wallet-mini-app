import type { DashboardStateDto } from "@wallet/shared";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it } from "vitest";
import { demoState } from "../mock/state";
import { WalletScreen } from "../screens/wallet-screen";

function WalletHarness() {
  const [data, setData] = useState<DashboardStateDto>(demoState);

  return (
    <WalletScreen
      wallet={{
        data,
        loading: false,
        error: null,
        refresh: async () => {},
        setData
      }}
      onNavigate={() => {}}
    />
  );
}

describe("Wallet quick account correction", () => {
  it("lets the user correct an account balance from the main screen", async () => {
    render(<WalletHarness />);

    fireEvent.click(screen.getByLabelText("Изменить счёт Основная карта"));
    fireEvent.change(screen.getByLabelText("Новый остаток Основная карта"), { target: { value: "80000" } });
    fireEvent.click(screen.getByLabelText("Сохранить счёт Основная карта"));

    await waitFor(() => {
      expect(screen.getByText("80 000 ₽")).toBeInTheDocument();
    });
    expect(screen.getByText("120 200 ₽")).toBeInTheDocument();
  });
});
