import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AlertsPanel } from "../components/wallet/alerts-panel";

describe("AlertsPanel", () => {
  it("uses neutral copy when there are no critical risks", () => {
    render(<AlertsPanel alerts={[]} />);
    expect(screen.getByText("Рисков не видно")).toBeInTheDocument();
    expect(screen.getByText("Критичных просрочек и кассового разрыва не видно.")).toBeInTheDocument();
  });

  it("renders risk alerts", () => {
    render(<AlertsPanel alerts={[{ id: "cash-gap", level: "high", title: "Не хватит денег", description: "Ожидается кассовый разрыв" }]} />);
    expect(screen.getByText("Не хватит денег")).toBeInTheDocument();
  });
});
