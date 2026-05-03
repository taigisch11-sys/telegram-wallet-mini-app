import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AlertsPanel } from "../components/wallet/alerts-panel";

describe("AlertsPanel", () => {
  it("renders risk alerts", () => {
    render(<AlertsPanel alerts={[{ id: "cash-gap", level: "high", title: "Не хватит денег", description: "Ожидается кассовый разрыв" }]} />);
    expect(screen.getByText("Не хватит денег")).toBeInTheDocument();
  });
});
