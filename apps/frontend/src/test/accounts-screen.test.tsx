import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it } from "vitest";
import type { DashboardStateDto } from "@wallet/shared";
import { AccountsScreen } from "../screens/accounts-screen";
import { emptyState } from "../mock/state";

function AccountsHarness() {
  const [data, setData] = useState<DashboardStateDto>(emptyState);
  return (
    <AccountsScreen
      wallet={{
        data,
        loading: false,
        error: null,
        refresh: async () => {},
        setData
      }}
    />
  );
}

describe("AccountsScreen", () => {
  it("starts with zero accounts and lets the user add and delete an account", async () => {
    render(<AccountsHarness />);

    expect(screen.getByText("Счетов пока нет. Добавьте карту, вклад или наличные.")).toBeInTheDocument();

    fireEvent.change(screen.getAllByPlaceholderText("Название")[0], { target: { value: "Карта" } });
    fireEvent.change(screen.getAllByDisplayValue("0.00")[0], { target: { value: "1500" } });
    fireEvent.click(screen.getByLabelText("Добавить счет"));

    expect(await screen.findByText("Карта")).toBeInTheDocument();
    expect(screen.getByText("1 500 ₽")).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText("Удалить счет"));
    await waitFor(() => {
      expect(screen.getByText("Счетов пока нет. Добавьте карту, вклад или наличные.")).toBeInTheDocument();
    });
  });
});
