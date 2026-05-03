import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { FinancialIndicators } from "../components/wallet/financial-indicators";
import { demoState } from "../mock/state";

describe("FinancialIndicators", () => {
  it("renders the analyst checklist with calculated personal finance indicators", () => {
    render(<FinancialIndicators state={demoState} />);

    expect(screen.getByText("Финансовый пульс")).toBeInTheDocument();
    expect(screen.getByText("Покрытие обязательств")).toBeInTheDocument();
    expect(screen.getByText("2,1×")).toBeInTheDocument();
    expect(screen.getByText("Долговая нагрузка")).toBeInTheDocument();
    expect(screen.getByText("8,7%")).toBeInTheDocument();
    expect(screen.getByText("Исполнение плана")).toBeInTheDocument();
    expect(screen.getByText("40%")).toBeInTheDocument();
    expect(screen.getByText("Нераспределённое движение")).toBeInTheDocument();
    expect(screen.getByText("3,8%")).toBeInTheDocument();
    expect(screen.getByText("Чистая позиция")).toBeInTheDocument();
    expect(screen.getByText("104 800 ₽")).toBeInTheDocument();
  });
});
