import { fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it } from "vitest";
import { AmountInput } from "../components/common/amount-input";

function AmountHarness({ initialValue = "0.00" }: { initialValue?: string }) {
  const [value, setValue] = useState(initialValue);

  return <AmountInput label="Сумма" value={value} onChange={setValue} helper="Тестовое денежное поле" />;
}

describe("AmountInput", () => {
  it("opens a calculator and replaces the default zero while typing", () => {
    render(<AmountHarness />);

    fireEvent.click(screen.getByRole("button", { name: /Сумма/ }));
    expect(screen.getByRole("dialog", { name: "Калькулятор" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "1" }));
    fireEvent.click(screen.getByRole("button", { name: "2" }));
    fireEvent.click(screen.getByRole("button", { name: "3" }));
    fireEvent.click(screen.getByRole("button", { name: "Готово" }));

    expect(screen.getByRole("button", { name: /123.*₽/ })).toBeInTheDocument();
    expect(screen.getByLabelText("Сумма")).toHaveValue("123.00");
  });

  it("supports quick amount chips and arithmetic before applying the value", () => {
    render(<AmountHarness initialValue="1000.00" />);

    fireEvent.click(screen.getByRole("button", { name: /Сумма/ }));
    fireEvent.click(screen.getByRole("button", { name: /\+5\s000/ }));
    fireEvent.click(screen.getByRole("button", { name: "+" }));
    fireEvent.click(screen.getByRole("button", { name: "2" }));
    fireEvent.click(screen.getByRole("button", { name: "000" }));
    fireEvent.click(screen.getByRole("button", { name: "=" }));
    fireEvent.click(screen.getByRole("button", { name: "Готово" }));

    expect(screen.getByRole("button", { name: /8\s000.*₽/ })).toBeInTheDocument();
    expect(screen.getByLabelText("Сумма")).toHaveValue("8000.00");
  });

  it("calculates multiplication before addition without unsafe eval", () => {
    render(<AmountHarness />);

    fireEvent.click(screen.getByRole("button", { name: /Сумма/ }));
    fireEvent.click(screen.getByRole("button", { name: "2" }));
    fireEvent.click(screen.getByRole("button", { name: "+" }));
    fireEvent.click(screen.getByRole("button", { name: "3" }));
    fireEvent.click(screen.getByRole("button", { name: "×" }));
    fireEvent.click(screen.getByRole("button", { name: "4" }));
    fireEvent.click(screen.getByRole("button", { name: "=" }));
    fireEvent.click(screen.getByRole("button", { name: "Готово" }));

    expect(screen.getByRole("button", { name: /14.*₽/ })).toBeInTheDocument();
    expect(screen.getByLabelText("Сумма")).toHaveValue("14.00");
  });
});
