import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { DashboardStateDto } from "@wallet/shared";
import { useState } from "react";
import { describe, expect, it } from "vitest";
import { emptyState } from "../mock/state";
import { PlanScreen } from "../screens/plan-screen";

function PlanHarness({ initialState = emptyState }: { initialState?: DashboardStateDto }) {
  const [data, setData] = useState<DashboardStateDto>(initialState);
  return (
    <PlanScreen
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

describe("PlanScreen", () => {
  it("lets the user add, complete, and delete fixed plan items", async () => {
    render(<PlanHarness />);

    fireEvent.change(screen.getAllByPlaceholderText("Название")[0], { target: { value: "Зарплата" } });
    fireEvent.change(screen.getAllByDisplayValue("0.00")[0], { target: { value: "90000" } });
    fireEvent.click(screen.getByLabelText("Добавить доход"));

    expect(await screen.findByText("Зарплата")).toBeInTheDocument();
    expect(screen.getByText("90 000 ₽")).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText("Получено"));
    await waitFor(() => expect(screen.getByText("Получено")).toBeInTheDocument());

    fireEvent.change(screen.getAllByPlaceholderText("Название")[1], { target: { value: "Аренда" } });
    fireEvent.change(screen.getAllByDisplayValue("0.00")[1], { target: { value: "35000" } });
    fireEvent.click(screen.getByLabelText("Добавить платёж"));

    expect(await screen.findByText("Аренда")).toBeInTheDocument();
    expect(screen.getByText("35 000 ₽")).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText("Удалить платёж"));
    await waitFor(() => {
      expect(screen.queryByText("Аренда")).not.toBeInTheDocument();
    });
  });

  it("creates a monthly payment schedule with a different final payment", async () => {
    render(<PlanHarness />);

    fireEvent.change(screen.getAllByPlaceholderText("Название")[1], { target: { value: "Оборотный кредит" } });
    fireEvent.change(screen.getAllByDisplayValue("0.00")[1], { target: { value: "15485" } });
    fireEvent.change(screen.getByLabelText("Добавить платёж: дата"), { target: { value: "2026-05-22" } });

    fireEvent.click(screen.getByText("Создать график"));
    fireEvent.change(screen.getByLabelText("Количество платежей"), { target: { value: "11" } });
    fireEvent.click(screen.getByLabelText("Последний платёж отличается"));
    fireEvent.change(screen.getByLabelText("Последний платёж"), { target: { value: "12500" } });
    fireEvent.click(screen.getByLabelText("Добавить платёж"));

    expect(await screen.findAllByText("Оборотный кредит")).toHaveLength(11);
    expect(screen.getAllByText("15 485 ₽")).toHaveLength(10);
    expect(screen.getByText("12 500 ₽")).toBeInTheDocument();
    expect(screen.getByText("22.03.2027")).toBeInTheDocument();
  });

  it("marks a debt repayment as an account transfer instead of an expense", async () => {
    render(
      <PlanHarness
        initialState={{
          ...emptyState,
          accounts: [{ id: "main-card", name: "Основная карта", balance: "50000.00", createdAt: new Date().toISOString() }],
          debts: [{ id: "credit-card", name: "Кредитка", amount: "-30000.00", createdAt: new Date().toISOString() }]
        }}
      />
    );

    fireEvent.change(screen.getByLabelText("Название погашения"), { target: { value: "Погашение кредитки" } });
    fireEvent.change(screen.getByLabelText("Сумма погашения"), { target: { value: "10000" } });
    fireEvent.click(screen.getByLabelText("Добавить погашение долга"));

    expect(await screen.findByText("Погашение кредитки")).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText("Погашение выполнено"));

    await waitFor(() => {
      expect(screen.getByText("40 000 ₽")).toBeInTheDocument();
      expect(screen.getByText("-20 000 ₽")).toBeInTheDocument();
    });
  });
});
