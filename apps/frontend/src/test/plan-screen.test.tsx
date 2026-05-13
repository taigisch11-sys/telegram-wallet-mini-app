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

    fireEvent.change(screen.getByLabelText("Название дохода"), { target: { value: "Зарплата" } });
    fireEvent.change(screen.getByLabelText("Сумма дохода"), { target: { value: "90000" } });
    fireEvent.click(screen.getByLabelText("Добавить доход"));

    expect(await screen.findByText("Зарплата")).toBeInTheDocument();
    expect(screen.getByText("90 000 ₽")).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText("Получено"));
    await waitFor(() => expect(screen.getByText("Получено")).toBeInTheDocument());

    fireEvent.change(screen.getByLabelText("Название платежа"), { target: { value: "Аренда" } });
    fireEvent.change(screen.getByLabelText("Сумма платежа"), { target: { value: "35000" } });
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

    fireEvent.change(screen.getByLabelText("Название платежа"), { target: { value: "Оборотный кредит" } });
    fireEvent.change(screen.getByLabelText("Сумма платежа"), { target: { value: "15485" } });
    fireEvent.change(screen.getByLabelText("Добавить платёж: дата"), { target: { value: "2026-05-22" } });

    fireEvent.click(screen.getByText("Размножить платежи"));
    fireEvent.change(screen.getByLabelText("Количество платежей"), { target: { value: "11" } });
    fireEvent.click(screen.getByLabelText("Последний платёж отличается"));
    fireEvent.change(screen.getByLabelText("Последний платёж"), { target: { value: "12500" } });
    fireEvent.click(screen.getByLabelText("Добавить платёж"));

    expect(await screen.findAllByText("Оборотный кредит")).toHaveLength(11);
    expect(screen.getAllByText("15 485 ₽")).toHaveLength(10);
    expect(screen.getByText("12 500 ₽")).toBeInTheDocument();
    expect(screen.getByText("22.03.2027")).toBeInTheDocument();
  });

  it("lets the user choose an optional category for a fixed payment", async () => {
    render(
      <PlanHarness
        initialState={{
          ...emptyState,
          categories: [
            { id: "cat-food", name: "Еда", type: "expense", color: "#ffb84d", icon: "basket", isDefault: true, createdAt: new Date().toISOString() },
            { id: "cat-credit", name: "Кредиты", type: "expense", color: "#5b8cff", icon: "credit-card", isDefault: true, createdAt: new Date().toISOString() }
          ]
        }}
      />
    );

    fireEvent.change(screen.getByLabelText("Название платежа"), { target: { value: "Платёж по кредиту" } });
    fireEvent.change(screen.getByLabelText("Сумма платежа"), { target: { value: "10000" } });
    fireEvent.change(screen.getByLabelText("Категория платежа"), { target: { value: "cat-credit" } });
    fireEvent.click(screen.getByLabelText("Добавить платёж"));

    expect(await screen.findByText("Платёж по кредиту")).toBeInTheDocument();
    expect(screen.getByText("Кредиты")).toBeInTheDocument();
  });

  it("marks a debt repayment as an account transfer instead of an expense", async () => {
    render(
      <PlanHarness
        initialState={{
          ...emptyState,
          accounts: [
            { id: "main-card", name: "Основная карта", balance: "50000.00", createdAt: new Date().toISOString() },
            { id: "reserve-card", name: "Резерв", balance: "80000.00", createdAt: new Date().toISOString() }
          ],
          debts: [
            { id: "credit-card", name: "Кредитка", amount: "-30000.00", createdAt: new Date().toISOString() },
            { id: "loan", name: "Кредит", amount: "-70000.00", createdAt: new Date().toISOString() }
          ]
        }}
      />
    );

    fireEvent.change(screen.getByLabelText("Счёт списания"), { target: { value: "reserve-card" } });
    fireEvent.change(screen.getByLabelText("Долг для погашения"), { target: { value: "loan" } });
    fireEvent.change(screen.getByLabelText("Название погашения"), { target: { value: "Погашение кредитки" } });
    fireEvent.change(screen.getByLabelText("Сумма погашения"), { target: { value: "10000" } });
    fireEvent.click(screen.getByLabelText("Добавить погашение долга"));

    expect(await screen.findByText("Погашение кредитки")).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText("Погашение выполнено"));

    await waitFor(() => {
      expect(screen.getByText("70 000 ₽")).toBeInTheDocument();
      expect(screen.getByText("-60 000 ₽")).toBeInTheDocument();
    });
  });

  it("lets the user delete a planned debt repayment before it is done", async () => {
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
    fireEvent.click(screen.getByLabelText("Удалить погашение долга Погашение кредитки"));

    await waitFor(() => {
      expect(screen.queryByText("Погашение кредитки")).not.toBeInTheDocument();
    });
  });

  it("creates a debt repayment schedule with a different final payment", async () => {
    render(
      <PlanHarness
        initialState={{
          ...emptyState,
          accounts: [{ id: "main-card", name: "Основная карта", balance: "50000.00", createdAt: new Date().toISOString() }],
          debts: [{ id: "credit-card", name: "Кредитка", amount: "-30000.00", createdAt: new Date().toISOString() }]
        }}
      />
    );

    fireEvent.change(screen.getByLabelText("Название погашения"), { target: { value: "График кредитки" } });
    fireEvent.change(screen.getByLabelText("Сумма погашения"), { target: { value: "10000" } });
    fireEvent.change(screen.getByLabelText("Дата погашения"), { target: { value: "2026-05-22" } });
    fireEvent.click(screen.getAllByText("Размножить платежи")[1]);
    fireEvent.change(screen.getByLabelText("Количество платежей"), { target: { value: "3" } });
    fireEvent.click(screen.getByLabelText("Последний платёж отличается"));
    fireEvent.change(screen.getByLabelText("Последний платёж"), { target: { value: "5000" } });
    fireEvent.click(screen.getByLabelText("Добавить погашение долга"));

    expect(await screen.findAllByText("График кредитки")).toHaveLength(3);
    expect(screen.getAllByText("10 000 ₽")).toHaveLength(2);
    expect(screen.getByText("5 000 ₽")).toBeInTheDocument();
    expect(screen.getByText(/22\.07\.2026/)).toBeInTheDocument();
  });

  it("blocks a debt repayment that is larger than the selected debt", async () => {
    render(
      <PlanHarness
        initialState={{
          ...emptyState,
          accounts: [{ id: "main-card", name: "Основная карта", balance: "50000.00", createdAt: new Date().toISOString() }],
          debts: [{ id: "credit-card", name: "Кредитка", amount: "-8000.00", createdAt: new Date().toISOString() }]
        }}
      />
    );

    fireEvent.change(screen.getByLabelText("Название погашения"), { target: { value: "Переплата кредитки" } });
    fireEvent.change(screen.getByLabelText("Сумма погашения"), { target: { value: "10000" } });

    expect(screen.getByText("Сумма больше текущего долга. Уменьшите платёж или обновите остаток долга.")).toBeInTheDocument();
    expect(screen.getByLabelText("Добавить погашение долга")).toBeDisabled();

    fireEvent.click(screen.getByLabelText("Добавить погашение долга"));
    expect(screen.queryByText("Переплата кредитки")).not.toBeInTheDocument();
  });

  it("blocks completing a stale planned repayment after the debt became smaller", async () => {
    render(
      <PlanHarness
        initialState={{
          ...emptyState,
          accounts: [{ id: "main-card", name: "Основная карта", balance: "50000.00", createdAt: new Date().toISOString() }],
          debts: [{ id: "credit-card", name: "Кредитка", amount: "-8000.00", createdAt: new Date().toISOString() }],
          plannedOperations: [
            {
              id: "repayment-overpay",
              kind: "debt_repayment",
              name: "Старое погашение",
              amount: "10000.00",
              plannedDate: new Date().toISOString(),
              expectedDate: null,
              actualDate: null,
              effectiveDate: new Date().toISOString(),
              status: "planned",
              note: null,
              sourceAccountId: "main-card",
              targetAccountId: null,
              targetDebtId: "credit-card",
              seriesId: null
            }
          ]
        }}
      />
    );

    expect(screen.getByText("Старое погашение")).toBeInTheDocument();
    expect(screen.getByText("Сумма погашения больше текущего долга")).toBeInTheDocument();
    expect(screen.getByLabelText("Погашение выполнено")).toBeDisabled();

    fireEvent.click(screen.getByLabelText("Погашение выполнено"));
    expect(screen.getByText("-8 000 ₽")).toBeInTheDocument();
  });

  it("limits monthly payment schedules to 120 payments", async () => {
    render(<PlanHarness />);

    fireEvent.change(screen.getByLabelText("Название платежа"), { target: { value: "Длинный график" } });
    fireEvent.change(screen.getByLabelText("Сумма платежа"), { target: { value: "1000" } });
    fireEvent.click(screen.getByText("Размножить платежи"));
    fireEvent.change(screen.getByLabelText("Количество платежей"), { target: { value: "121" } });

    expect(screen.getByText("Можно создать не больше 120 платежей за раз.")).toBeInTheDocument();
    expect(screen.getByLabelText("Добавить платёж")).toBeDisabled();

    fireEvent.click(screen.getByLabelText("Добавить платёж"));
    expect(screen.queryByText("Длинный график")).not.toBeInTheDocument();
  });
});
