import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { App } from "../app/App";

describe("App", () => {
  it("renders bottom navigation", () => {
    render(<App />);
    expect(screen.getAllByText("Финансы").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Графики").length).toBeGreaterThan(0);
  });

  it("connects primary wallet actions to real screens", () => {
    render(<App />);

    fireEvent.click(screen.getAllByText("Сверить")[0]);
    expect(screen.getByText("Сохранить остатки")).toBeInTheDocument();

    fireEvent.click(screen.getAllByText("Финансы")[0]);
    fireEvent.click(screen.getAllByText("План")[0]);
    expect(screen.getByText("Доходы")).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText("Открыть историю"));
    expect(screen.getByRole("heading", { name: "История" })).toBeInTheDocument();
  });
});
