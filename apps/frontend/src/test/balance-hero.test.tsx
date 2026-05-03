import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { BalanceHero } from "../components/wallet/balance-hero";

describe("BalanceHero", () => {
  it("renders core wallet metrics", () => {
    render(<BalanceHero currentBalance="72 300 ₽" calculatedBalance="70 000 ₽" additionalExpenses="2 300 ₽" freeMoney="18 000 ₽" />);
    expect(screen.getByText("72 300 ₽")).toBeInTheDocument();
    expect(screen.getByText("Расчётный баланс")).toBeInTheDocument();
    expect(screen.getByText("Перевести")).toBeInTheDocument();
  });
});
