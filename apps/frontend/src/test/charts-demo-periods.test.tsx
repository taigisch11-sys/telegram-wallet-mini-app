import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { App } from "../app/App";

describe("Demo chart periods", () => {
  it("recalculates demo chart data when the user changes period", () => {
    render(<App />);

    fireEvent.click(screen.getByLabelText("Меню"));
    fireEvent.click(screen.getByText("Включить демо"));
    fireEvent.click(screen.getAllByText("Графики")[0]);

    expect(screen.getByText("Месяц · 5 точек")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Неделя" }));
    expect(screen.getByText("Неделя · 7 точек")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Квартал" }));
    expect(screen.getByText("Квартал · 12 точек")).toBeInTheDocument();
  });
});
