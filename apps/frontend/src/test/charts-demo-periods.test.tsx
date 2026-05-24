import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { App } from "../app/App";

describe("Demo chart periods", () => {
  it("opens demo mode and lets the user reach the analytics screen", () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: "Посмотреть концепт" }));
    fireEvent.click(screen.getByLabelText("Аналитика"));

    expect(screen.getByText("Динамика и опорные величины")).toBeInTheDocument();
    expect(screen.getByText("Net balance")).toBeInTheDocument();
    expect(screen.getByText("Тренд")).toBeInTheDocument();
  });
});
