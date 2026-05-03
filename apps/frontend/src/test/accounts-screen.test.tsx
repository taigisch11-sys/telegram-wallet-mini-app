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

    fireEvent.change(screen.getByLabelText("Название счёта"), { target: { value: "Карта" } });
    fireEvent.change(screen.getByLabelText("Остаток"), { target: { value: "1500" } });
    fireEvent.click(screen.getByRole("button", { name: "Добавить счёт" }));

    expect(await screen.findByText("Карта")).toBeInTheDocument();
    expect(screen.getAllByText("1 500 ₽").length).toBeGreaterThan(0);

    fireEvent.click(screen.getByLabelText("Удалить счёт Карта"));
    await waitFor(() => {
      expect(screen.getByText("Счетов пока нет. Добавьте карту, вклад или наличные.")).toBeInTheDocument();
    });
  });

  it("lets the user add a debt account with a positive typed amount and delete it", async () => {
    render(<AccountsHarness />);

    expect(screen.getByText("Долговых счетов пока нет. Добавьте кредитку, кредит или рассрочку.")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Название долгового счёта"), { target: { value: "Кредитка" } });
    fireEvent.change(screen.getByLabelText("Сумма долга"), { target: { value: "25000" } });
    fireEvent.click(screen.getByRole("button", { name: "Добавить долговой счёт" }));

    expect(await screen.findByText("Кредитка")).toBeInTheDocument();
    expect(screen.getAllByText("-25 000 ₽").length).toBeGreaterThan(0);

    fireEvent.click(screen.getByLabelText("Удалить долговой счёт Кредитка"));
    await waitFor(() => {
      expect(screen.getByText("Долговых счетов пока нет. Добавьте кредитку, кредит или рассрочку.")).toBeInTheDocument();
    });
  });
});
