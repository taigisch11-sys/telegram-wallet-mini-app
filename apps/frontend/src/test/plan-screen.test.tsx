import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { DashboardStateDto } from "@wallet/shared";
import { useState } from "react";
import { describe, expect, it } from "vitest";
import { emptyState } from "../mock/state";
import { PlanScreen } from "../screens/plan-screen";

function PlanHarness() {
  const [data, setData] = useState<DashboardStateDto>(emptyState);
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
});
